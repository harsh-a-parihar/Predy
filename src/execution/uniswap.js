export async function executeUniswapAction({ action, amount }) {
  return {
    action,
    amount,
    txHash: "SIMULATED_UNISWAP_TX"
  };
}
