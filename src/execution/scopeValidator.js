import { ethers } from "ethers";

const ALLOWED_ACTIONS = new Set(["increase-steth-exposure", "hold-position", "rebalance"]);
const MAX_NOTIONAL_USDC = Number(process.env.EXECUTION_MAX_NOTIONAL_USDC || 10);

export function validateScope({ action, amount = 0, simulationMode = false, usdcAddress = "" }) {
  if (!ALLOWED_ACTIONS.has(action)) {
    return { allowed: false, reason: `Action not allowed: ${action}` };
  }

  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount) || numericAmount < 0) {
    return { allowed: false, reason: `Invalid amount: ${amount}` };
  }
  if (numericAmount > MAX_NOTIONAL_USDC) {
    return { allowed: false, reason: `Amount exceeds safety cap (${MAX_NOTIONAL_USDC})` };
  }

  if (!simulationMode) {
    if (action === "rebalance" && !ethers.isAddress(usdcAddress || "")) {
      return { allowed: false, reason: "VERIBOND_USDC_ADDRESS is missing/invalid for rebalance" };
    }
  }

  return { allowed: true };
}
