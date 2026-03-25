import { validateScope } from "../../execution/scopeValidator.js";
import { executeLidoAction } from "../../execution/lido.js";
import { executeUniswapAction } from "../../execution/uniswap.js";
import { config } from "../../utils/config.js";

export async function runExecutorAgent({
  predictionId,
  consensusOutput,
  privacyOutput,
  trustEngine,
  memory
}) {
  const action = consensusOutput.prediction;
  const amount = Number((privacyOutput.publicConfidence / 100).toFixed(2));
  const scope = validateScope({
    action,
    amount,
    simulationMode: config.simulationMode,
    usdcAddress: config.contracts.usdc
  });

  if (!scope.allowed) {
    memory?.addForAgent?.("ExecutorAgent", {
      type: "executor_output",
      predictionId,
      executed: false,
      reason: scope.reason
    });
    return {
      agent: "ExecutorAgent",
      executed: false,
      reason: scope.reason
    };
  }

  const execution =
    action === "increase-steth-exposure"
      ? await executeLidoAction({
          action,
          amount,
          simulationMode: config.simulationMode,
          rpcUrl: config.baseRpcUrl,
          privateKey: config.privateKey
        })
      : await executeUniswapAction({
          action,
          amount,
          simulationMode: config.simulationMode,
          rpcUrl: config.baseRpcUrl,
          privateKey: config.privateKey,
          usdcAddress: config.contracts.usdc
        });

  const isCorrect = privacyOutput.publicConfidence >= 60;
  const resolution = await trustEngine.resolve({
    agentId: "ConsensusAgent",
    predictionId,
    isCorrect,
    stakeId: consensusOutput?.stake?.stakeId || null
  });
  await trustEngine.bond({ agentId: "ConsensusAgent", success: isCorrect });

  const output = {
    agent: "ExecutorAgent",
    executed: true,
    execution,
    resolution
  };

  memory?.addForAgent?.("ExecutorAgent", {
    type: "executor_output",
    predictionId,
    executed: true,
    txHash: execution?.transactionHash || execution?.txHash || execution?.hash
  });

  return output;
}
