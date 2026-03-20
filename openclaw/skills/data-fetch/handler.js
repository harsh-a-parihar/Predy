import { callApi, getApiBase, getLocalRuntime } from "../_shared/runtime.js";

export async function handle(input = {}) {
  const instruction = input.instruction || "Fetch yield signals";
  if (getApiBase()) {
    const response = await callApi("/skill/data/fetch", { instruction });
    return response?.data ?? response;
  }

  const { orchestrator } = getLocalRuntime();
  const result = await orchestrator.runPredictionLoop({ userInstruction: instruction });
  return result.dataOutput ?? result;
}
