import { formatAgentMessage } from "./formatter.js";

const knownAgents = new Set([
  "OrchestratorAgent",
  "DataAgent",
  "ConsensusAgent",
  "PrivacyAgent",
  "ExecutorAgent"
]);

export function handleHumanChat({ to, message }) {
  if (to && knownAgents.has(to)) {
    return formatAgentMessage(to, `Received: ${message}`, { mode: "direct" });
  }
  return formatAgentMessage("OrchestratorAgent", `Routing message: ${message}`, { mode: "group" });
}
