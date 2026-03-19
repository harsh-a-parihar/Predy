const ALLOWED_ACTIONS = new Set(["increase-steth-exposure", "hold-position", "rebalance"]);

export function validateScope({ action, amount = 0 }) {
  if (!ALLOWED_ACTIONS.has(action)) {
    return { allowed: false, reason: `Action not allowed: ${action}` };
  }
  if (Number(amount) > 10) {
    return { allowed: false, reason: "Amount exceeds demo safety cap (10)" };
  }
  return { allowed: true };
}
