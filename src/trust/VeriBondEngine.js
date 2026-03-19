import { randomUUID } from "node:crypto";
import { logger } from "../utils/logger.js";
import { createChainClient } from "../execution/ethersWrapper.js";
import { stakeClaim } from "./staking.js";
import { resolveClaim } from "./slashing.js";
import { getReputationScore } from "./reputation.js";
import { updateBondingCurve } from "./bonding.js";

/**
 * VeriBond facade.
 * For hackathon speed, it supports simulation mode while keeping
 * production-like method signatures for later contract integration.
 */
export class VeriBondEngine {
  constructor({ simulationMode = true, config }) {
    this.simulationMode = simulationMode;
    this.reputation = new Map();
    this.config = config;
    this.chain = createChainClient({
      rpcUrl: config.baseRpcUrl,
      privateKey: config.privateKey
    });
  }

  async stake({ agentId, predictionId, amount, confidence }) {
    const claimHash = `predy:${predictionId}:${agentId}:${confidence}`;
    const resolvesAt = Math.floor(Date.now() / 1000) + 60;
    const stakeData = await stakeClaim({
      simulationMode: this.simulationMode,
      chain: this.chain,
      contractAddress: this.config.contracts.staking,
      agentId: this.config.agentIds[agentId] ?? 2,
      claimHash: claimHash,
      stakeAmountUSDC: amount,
      resolvesAt,
      predictedOutcome: confidence >= 0.6
    });
    const stakeId = stakeData.claimId || randomUUID();
    logger.info("trust.stake", { agentId, predictionId, amount, confidence, stakeId });
    return {
      stakeId,
      txHash: stakeData.txHash
    };
  }

  async resolve({ agentId, predictionId, isCorrect, stakeId = null }) {
    const current = this.reputation.get(agentId) ?? 50;
    const next = isCorrect ? Math.min(100, current + 5) : Math.max(0, current - 8);
    this.reputation.set(agentId, next);

    const resolution = await resolveClaim({
      simulationMode: this.simulationMode,
      chain: this.chain,
      contractAddress: this.config.contracts.staking,
      claimId: stakeId,
      fallbackIsCorrect: isCorrect
    });

    logger.info("trust.resolve", { agentId, predictionId, isCorrect, reputation: next });
    return {
      result: resolution.result,
      reputation: next,
      txHash: resolution.txHash
    };
  }

  async getReputation(agentId) {
    const chainScore = await getReputationScore({
      simulationMode: this.simulationMode,
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
  }

  async bond({ agentId, success }) {
    const bonded = await updateBondingCurve({
      simulationMode: this.simulationMode,
      success
    });
    logger.info("trust.bond", { agentId, success });
    return bonded;
  }
}
