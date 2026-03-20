import { randomUUID } from "node:crypto";
import { ethers } from "ethers";
import { logger } from "../utils/logger.js";
import { createChainClient } from "../execution/ethersWrapper.js";
import { stakeClaim } from "./staking.js";
import { resolveClaim } from "./slashing.js";
import { getReputationScore } from "./reputation.js";
import { updateBondingCurve } from "./bonding.js";

/**
 * VeriBond facade — always uses deployed TruthStake / OwnerBadge on-chain.
 */
export class VeriBondEngine {
  constructor({ config }) {
    this.reputation = new Map();
    this.config = config;
    this.chain = createChainClient({
      rpcUrl: config.baseRpcUrl,
      privateKey: config.privateKey
    });
    this.assertOnchainConfig();
  }

  assertOnchainConfig() {
    const missing = [];
    if (!this.config.privateKey || !String(this.config.privateKey).startsWith("0x")) {
      missing.push("PRIVATE_KEY");
    }
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
    try {
      const claimHashInput = `predy:${predictionId}:${agentId}:${confidence}`;
      const claimHash = ethers.id(claimHashInput);
      const resolvesAt = Math.floor(Date.now() / 1000) + 120;
      const stakeData = await stakeClaim({
        chain: this.chain,
        contractAddress: this.config.contracts.staking,
        agentId: this.config.agentIds[agentId] ?? 2,
        claimHash,
        stakeAmountUSDC: amount,
        resolvesAt,
        predictedOutcome: confidence >= 0.6
      });
      const stakeId = stakeData.claimId ? String(stakeData.claimId) : randomUUID();
      logger.info("trust.stake", { agentId, predictionId, amount, confidence, stakeId });
      return {
        stakeId,
        txHash: stakeData.txHash,
        claimHash
      };
    } catch (error) {
      const message = this.formatEthersError(error);
      logger.error("trust.stake.failed", { agentId, predictionId, error: message });
      throw new Error(`Failed to stake claim on VeriBond: ${message}`);
    }
  }

  async resolve({ agentId, predictionId, isCorrect, stakeId = null }) {
    try {
      const current = this.reputation.get(agentId) ?? 50;
      const next = isCorrect ? Math.min(100, current + 5) : Math.max(0, current - 8);
      this.reputation.set(agentId, next);

      const resolution = await resolveClaim({
        chain: this.chain,
        contractAddress: this.config.contracts.staking,
        claimId: stakeId
      });

      logger.info("trust.resolve", { agentId, predictionId, isCorrect, reputation: next });
      return {
        result: resolution.result,
        reputation: next,
        txHash: resolution.txHash
      };
    } catch (error) {
      const message = this.formatEthersError(error);
      logger.error("trust.resolve.failed", { agentId, predictionId, stakeId, error: message });
      throw new Error(`Failed to resolve claim on VeriBond: ${message}`);
    }
  }

  async getReputation(agentId) {
    try {
      const chainScore = await getReputationScore({
        chain: this.chain,
        ownerBadgeAddress: this.config.contracts.ownerBadge,
        stakingAddress: this.config.contracts.staking,
        ownerAddress: this.chain.signer.address,
        agentId: this.config.agentIds[agentId] ?? 2,
        localScore: this.reputation.get(agentId) ?? 50
      });
      return {
        agentId,
        score: chainScore.score,
        source: chainScore.source
      };
    } catch (error) {
      const message = this.formatEthersError(error);
      logger.error("trust.reputation.failed", { agentId, error: message });
      throw new Error(`Failed to fetch on-chain reputation: ${message}`);
    }
  }

  async bond({ agentId, success }) {
    try {
      const bonded = await updateBondingCurve({ success });
      logger.info("trust.bond", { agentId, success });
      return bonded;
    } catch (error) {
      const message = this.formatEthersError(error);
      logger.error("trust.bond.failed", { agentId, success, error: message });
      throw new Error(`Failed to update bonding state: ${message}`);
    }
  }
}
