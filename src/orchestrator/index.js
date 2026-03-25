import { randomUUID } from "node:crypto";
import { runDataAgent } from "../agents/data/index.js";
import { runConsensusAgent } from "../agents/consensus/index.js";
import { runPrivacyAgent } from "../agents/privacy/index.js";
import { runExecutorAgent } from "../agents/executor/index.js";
import { normalizeAutonomy, shouldPauseForApproval } from "./approval.js";

export class Orchestrator {
  constructor({ trustEngine, memory, logger, config }) {
    this.trustEngine = trustEngine;
    this.memory = memory;
    this.logger = logger;
    this.config = config;
  }

  async runPredictionLoop({ userInstruction, autonomy, trustEngine }) {
    const te = trustEngine || this.trustEngine;
    if (!te) {
      throw new Error(
        "Trust engine required: send X-User-Id (after POST /user/onboard) or set PRIVATE_KEY for legacy mode."
      );
    }
    const predictionId = randomUUID();
    const autonomyResolved = normalizeAutonomy(autonomy);

    this.memory.addGlobal({
      type: "user_instruction",
      userInstruction,
      predictionId,
      autonomy: autonomyResolved
    });

    const dataOutput = await runDataAgent({
      userInstruction,
      predictionId,
      memory: this.memory
    });

    const consensusOutput = await runConsensusAgent({
      dataOutput,
      trustEngine: te,
      predictionId,
      memory: this.memory
    });

    const privacyOutput = await runPrivacyAgent({
      consensusOutput,
      dataOutput,
      predictionId,
      memory: this.memory
    });

    const needsApproval = shouldPauseForApproval({
      publicConfidence: privacyOutput.publicConfidence,
      autonomy: autonomyResolved
    });

    if (needsApproval) {
      const paused = {
        predictionId,
        status: "awaiting-human-approval",
        autonomy: autonomyResolved,
        dataOutput,
        consensusOutput,
        privacyOutput
      };
      this.memory.addGlobal({ type: "paused_for_approval", predictionId });
      return paused;
    }

    const executorOutput = await runExecutorAgent({
      predictionId,
      consensusOutput,
      privacyOutput,
      trustEngine: te,
      memory: this.memory
    });

    const result = {
      predictionId,
      status: "completed",
      autonomy: autonomyResolved,
      dataOutput,
      consensusOutput,
      privacyOutput,
      executorOutput
    };

    this.memory.addGlobal({ type: "prediction_completed", predictionId, result });
    this.logger.info("orchestrator.cycle_complete", { predictionId });
    return result;
  }
}
