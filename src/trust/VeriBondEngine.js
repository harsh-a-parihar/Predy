import { randomUUID } from "node:crypto";
import { Contract, ethers, Wallet } from "ethers";
import { logger } from "../utils/logger.js";
import { createChainClient } from "../execution/ethersWrapper.js";
import { stakeClaim } from "./staking.js";
import { resolveClaim } from "./slashing.js";
import { MOCK_RESOLVER_ABI, TRUTH_STAKE_ABI } from "./abis.js";
import { getReputationScore } from "./reputation.js";
import { updateBondingCurve } from "./bonding.js";

/**
 * VeriBond facade — TruthStake / OwnerBadge on-chain only.
 * Swarm ERC-8004 ids come from per-user onboarding (`swarmAgents`) or `config.legacySwarmAgents`.
 */
export class VeriBondEngine {
  /**
   * @param {{ config: any, privateKey?: string, swarmAgents?: Record<string, number|string|bigint>, linkedWallet?: string }} opts
   */
  constructor(opts) {
    const { config, privateKey: pkOpt, swarmAgents: swarmOpt, linkedWallet } = opts;
    this.reputation = new Map();
    this.config = config;
    this.linkedWallet = linkedWallet || null;
    const pk = pkOpt || config.privateKey;
    if (!pk || !String(pk).startsWith("0x")) {
      throw new Error("VeriBondEngine requires a 0x-prefixed private key (linked wallet or PRIVATE_KEY)");
    }
    this.swarmAgents = swarmOpt || config.legacySwarmAgents || config.swarmAgents || config.agentIds;
    this.chain = createChainClient({
      rpcUrl: config.baseRpcUrl,
      privateKey: pk
    });
    this.assertOnchainConfig();
  }

  _erc8004Id(agentKey) {
    const m = this.swarmAgents || this.config.legacySwarmAgents || this.config.agentIds;
    const v = m?.[agentKey];
    if (v === undefined || v === null) {
      if (agentKey === "Orchestrator") {
        return 0n;
      }
      const fb = this.config.legacySwarmAgents?.ConsensusAgent ?? this.config.agentIds?.ConsensusAgent ?? 2;
      return typeof fb === "bigint" ? fb : BigInt(String(fb));
    }
    return typeof v === "bigint" ? v : BigInt(String(v));
  }

  async _signerAddress() {
    return this.chain.signer.getAddress();
  }

  assertOnchainConfig() {
    const missing = [];
    if (!ethers.isAddress(this.config.contracts.staking || "")) {
      missing.push("VERIBOND_STAKING_ADDRESS");
    }
    if (!ethers.isAddress(this.config.contracts.ownerBadge || "")) {
      missing.push("VERIBOND_OWNER_BADGE_ADDRESS");
    }
    if (missing.length > 0) {
      throw new Error(`Invalid on-chain trust configuration: ${missing.join(", ")}`);
    }
  }

  formatEthersError(error) {
    return (
      error?.shortMessage ||
      error?.reason ||
      error?.info?.error?.message ||
      error?.message ||
      "Unknown ethers error"
    );
  }

  async stake({ agentId, predictionId, amount, confidence }) {
    const ercId = this._erc8004Id(agentId);
    const wallet = await this._signerAddress();
    const ercStr = ercId.toString(10);
    logger.info(
      `Agent ${agentId} (ERC-8004 ID ${ercStr}) staking with wallet ${wallet}`,
      { agentId, erc8004Id: ercStr, wallet, predictionId, amount, confidence }
    );
    try {
      const claimHashInput = `predy:${predictionId}:${agentId}:${confidence}`;
      const claimHash = ethers.id(claimHashInput);
      /** Use chain time so resolvesAt is reachable soon after orchestration (MockResolver + TruthStake). */
      const latest = await this.chain.provider.getBlock("latest");
      /** +3s so TruthStake.resolve can run shortly after stake when MockResolver outcome is set */
      const resolvesAt = Number(latest.timestamp) + 3;
      const stakeData = await stakeClaim({
        chain: this.chain,
        contractAddress: this.config.contracts.staking,
        agentId: ercId,
        claimHash,
        stakeAmountUSDC: amount,
        resolvesAt,
        predictedOutcome: confidence >= 0.6
      });
      const stakeId = stakeData.claimId ? String(stakeData.claimId) : randomUUID();
      logger.info("trust.stake.ok", { agentId, erc8004Id: ercStr, wallet, predictionId, amount, confidence, stakeId });
      return {
        stakeId,
        txHash: stakeData.txHash,
        claimHash
      };
    } catch (error) {
      const message = this.formatEthersError(error);
      logger.error("trust.stake.failed", { agentId, erc8004Id: ercStr, wallet, predictionId, error: message });
      const hint =
        `TruthStake requires msg.sender === identityRegistry.getAgentWallet(${ercStr}). ` +
        `Sign with the wallet registered for this agent id (linked: ${this.linkedWallet || this.config.singleWallet || "n/a"}).`;
      throw new Error(`Failed to stake claim on VeriBond: ${message}\n${hint}`);
    }
  }

  async resolve({ agentId, predictionId, isCorrect, stakeId = null }) {
    const ercId = this._erc8004Id(agentId);
    const ercStr = ercId.toString(10);
    const wallet = await this._signerAddress();
    logger.info(
      `Agent ${agentId} (ERC-8004 ID ${ercStr}) resolving with wallet ${wallet}`,
      { agentId, erc8004Id: ercStr, wallet, predictionId, isCorrect, stakeId }
    );
    try {
      const current = this.reputation.get(agentId) ?? 50;
      const next = isCorrect ? Math.min(100, current + 5) : Math.max(0, current - 8);
      this.reputation.set(agentId, next);

      if (stakeId && this.config.contracts.mockResolver && this.config.mockResolverAdminPrivateKey) {
        const read = new Contract(this.config.contracts.staking, TRUTH_STAKE_ABI, this.chain.provider);
        const claim = await read.getClaim(stakeId);
        const claimHash = claim.claimHash;
        const adminPk = this.config.mockResolverAdminPrivateKey;
        const resolverAddr = this.config.contracts.mockResolver;
        if (claimHash && ethers.isAddress(resolverAddr) && adminPk?.startsWith("0x")) {
          try {
            const admin = new Wallet(adminPk, this.chain.provider);
            const mr = new Contract(resolverAddr, MOCK_RESOLVER_ABI, admin);
            const setTx = await mr.setOutcome(claimHash, Boolean(isCorrect));
            await setTx.wait();
            logger.info("veribond.mock_resolver.setOutcome", { txHash: setTx.hash, claimHash });
          } catch (e) {
            logger.warn("veribond.mock_resolver.setOutcome_skipped", {
              message: e?.shortMessage || e?.message || String(e)
            });
          }
        }
      }

      const resolution = await resolveClaim({
        chain: this.chain,
        contractAddress: this.config.contracts.staking,
        claimId: stakeId
      });

      logger.info("trust.resolve.ok", { agentId, erc8004Id: ercStr, wallet, predictionId, isCorrect, reputation: next });
      return {
        result: resolution.result,
        reputation: next,
        txHash: resolution.txHash
      };
    } catch (error) {
      const message = this.formatEthersError(error);
      logger.error("trust.resolve.failed", { agentId, erc8004Id: ercStr, wallet, predictionId, stakeId, error: message });
      throw new Error(`Failed to resolve claim on VeriBond: ${message}`);
    }
  }

  async getReputation(agentId) {
    const ercId = this._erc8004Id(agentId);
    const ercStr = ercId.toString(10);
    const wallet = await this._signerAddress();
    logger.info(
      `Agent ${agentId} (ERC-8004 ID ${ercStr}) reputation read with wallet ${wallet}`,
      { agentId, erc8004Id: ercStr, wallet }
    );
    try {
      const chainScore = await getReputationScore({
        chain: this.chain,
        ownerBadgeAddress: this.config.contracts.ownerBadge,
        stakingAddress: this.config.contracts.staking,
        ownerAddress: wallet,
        agentId: ercId,
        localScore: this.reputation.get(agentId) ?? 50
      });
      return {
        agentId,
        erc8004Id: ercStr,
        score: chainScore.score,
        source: chainScore.source
      };
    } catch (error) {
      const message = this.formatEthersError(error);
      logger.error("trust.reputation.failed", { agentId, erc8004Id: ercStr, wallet, error: message });
      throw new Error(`Failed to fetch on-chain reputation: ${message}`);
    }
  }

  async bond({ agentId, success }) {
    const ercId = this._erc8004Id(agentId);
    const ercStr = ercId.toString(10);
    const wallet = await this._signerAddress();
    logger.info(
      `Agent ${agentId} (ERC-8004 ID ${ercStr}) bond update with wallet ${wallet}`,
      { agentId, erc8004Id: ercStr, wallet, success }
    );
    try {
      const bonded = await updateBondingCurve({ success });
      logger.info("trust.bond.ok", { agentId, erc8004Id: ercStr, wallet, success });
      return bonded;
    } catch (error) {
      const message = this.formatEthersError(error);
      logger.error("trust.bond.failed", { agentId, erc8004Id: ercStr, wallet, success, error: message });
      throw new Error(`Failed to update bonding state: ${message}`);
    }
  }
}
