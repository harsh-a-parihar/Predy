import { randomUUID } from "node:crypto";
import { runDataAgent } from "../agents/data/index.js";
import { runConsensusAgent } from "../agents/consensus/index.js";
import { runPrivacyAgent } from "../agents/privacy/index.js";
import { runExecutorAgent } from "../agents/executor/index.js";
import { requiresHumanApproval } from "./approval.js";

export class Orchestrator {
  constructor({ trustEngine, memory, logger }) {
    this.trustEngine = trustEngine;
    this.memory = memory;
    this.logger = logger;
  }

  async runPredictionLoop({ userInstruction }) {
    const predictionId = randomUUID();
    this.memory.add({ type: "user_instruction", userInstruction, predictionId });

    const dataOutput = await runDataAgent({ userInstruction });
    const consensusOutput = await runConsensusAgent({
      dataOutput,
      trustEngine: this.trustEngine,
      predictionId
    });
    const privacyOutput = await runPrivacyAgent({ consensusOutput });

    const needsApproval = requiresHumanApproval({ publicConfidence: privacyOutput.publicConfidence });
    if (needsApproval) {
      const paused = {
        predictionId,
        status: "awaiting-human-approval",
        dataOutput,
        consensusOutput,
        privacyOutput
      };
      this.memory.add({ type: "paused_for_approval", predictionId });
      return paused;
    }

    const executorOutput = await runExecutorAgent({
      predictionId,
      consensusOutput,
      privacyOutput,
      trustEngine: this.trustEngine
    });

    const result = {
      predictionId,
      status: "completed",
      dataOutput,
      consensusOutput,
      privacyOutput,
      executorOutput
    };

    this.memory.add({ type: "prediction_completed", predictionId, result });
    this.logger.info("orchestrator.cycle_complete", { predictionId });
    return result;
  }
}
