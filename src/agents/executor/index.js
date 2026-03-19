import { validateScope } from "../../execution/scopeValidator.js";
import { executeLidoAction } from "../../execution/lido.js";
import { executeUniswapAction } from "../../execution/uniswap.js";

export async function runExecutorAgent({
  predictionId,
  consensusOutput,
  privacyOutput,
  trustEngine
}) {
  const action = consensusOutput.prediction;
  const amount = Number((privacyOutput.publicConfidence / 100).toFixed(2));
  const scope = validateScope({ action, amount });

  if (!scope.allowed) {
    return {
      agent: "ExecutorAgent",
      executed: false,
      reason: scope.reason
    };
  }

  const execution =
    action === "increase-steth-exposure"
      ? await executeLidoAction({ action, amount })
      : await executeUniswapAction({ action, amount });

  // For MVP demo, resolve success if confidence >= 60.
  const isCorrect = privacyOutput.publicConfidence >= 60;
  const resolution = await trustEngine.resolve({
    agentId: "ConsensusAgent",
    predictionId,
    isCorrect,
    stakeId: consensusOutput?.stake?.stakeId || null
  });
  await trustEngine.bond({ agentId: "ConsensusAgent", success: isCorrect });

  return {
    agent: "ExecutorAgent",
    executed: true,
    execution,
    resolution
  };
}
