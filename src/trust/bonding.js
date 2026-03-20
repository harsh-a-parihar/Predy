import { logger } from "../utils/logger.js";

/**
 * No bonding-curve contract is wired yet — return an explicit status (no fake tx).
 */
export async function updateBondingCurve({ success }) {
  logger.info("trust.bond.noop", { success, note: "Bonding curve contract not configured" });
  return {
    status: "noop",
    direction: success ? "up" : "down",
    txHash: null,
    note: "Deploy VERIBOND_BONDING_ADDRESS and wire ABI to enable on-chain bonding."
  };
}
