import { handleHumanChat } from "../../../src/chat/handler.js";
import { callApi, getApiBase } from "../_shared/runtime.js";

export async function handle(input = {}) {
  const payload = {
    to: input.to || "OrchestratorAgent",
    message: input.message || ""
  };

  if (getApiBase()) {
    const response = await callApi("/api/chat", payload);
    return response?.data ?? response;
  }

  return handleHumanChat(payload);
}
