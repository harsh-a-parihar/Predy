import { callApi, getApiBase, getLocalRuntime } from "../_shared/runtime.js";

export async function handle(input = {}) {
  const instruction = input.instruction || "Run privacy scoring";
  if (getApiBase()) {
    const response = await callApi("/skill/privacy/sanitize", { instruction });
    return response?.data ?? response;
  }

  const { orchestrator } = getLocalRuntime();
  const result = await orchestrator.runPredictionLoop({ userInstruction: instruction });
  return result.privacyOutput ?? result;
}
