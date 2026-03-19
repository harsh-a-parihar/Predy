export function formatAgentMessage(agent, message, extra = {}) {
  return {
    id: `${agent}-${Date.now()}`,
    agent,
    message,
    extra,
    timestamp: new Date().toISOString()
  };
}
