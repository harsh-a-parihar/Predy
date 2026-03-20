import { callApi, getApiBase, getLocalRuntime } from "../_shared/runtime.js";

export async function handle(input = {}) {
  const instruction = input.instruction || "Run consensus prediction";
  if (getApiBase()) {
    const response = await callApi("/skill/consensus/predict", { instruction });
    return response?.data ?? response;
  }

  const { orchestrator } = getLocalRuntime();
  const result = await orchestrator.runPredictionLoop({ userInstruction: instruction });
  return result.consensusOutput ?? result;
}
