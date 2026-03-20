import { callApi, getApiBase, getLocalRuntime } from "../_shared/runtime.js";

export async function handle(input = {}) {
  const instruction = input.instruction || "Execute safe action";
  if (getApiBase()) {
    const response = await callApi("/skill/execute/action", { instruction });
    return response?.data ?? response;
  }

  const { orchestrator } = getLocalRuntime();
  const result = await orchestrator.runPredictionLoop({ userInstruction: instruction });
  return result.executorOutput ?? result;
}
