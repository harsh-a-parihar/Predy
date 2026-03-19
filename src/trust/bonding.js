export async function updateBondingCurve({ simulationMode, success }) {
  if (simulationMode) {
    return {
      status: "ok",
      direction: success ? "up" : "down",
      txHash: "SIMULATED_BOND_TX"
    };
  }

  // Placeholder for real bonding contract write.
  return {
    status: "pending-implementation",
    direction: success ? "up" : "down",
    txHash: null
  };
}
