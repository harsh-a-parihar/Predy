import { ethers } from "ethers";
import { createChainClient } from "./ethersWrapper.js";
import { logger } from "../utils/logger.js";

/** Native ETH uses 18 decimals; use a tiny fixed string so parseUnits never throws on precision. */
const MOCK_SELF_TRANSFER_ETH = "0.000001";

function formatEthersError(error) {
  return (
    error?.shortMessage ||
    error?.reason ||
    error?.info?.error?.message ||
    error?.message ||
    "Unknown ethers error"
  );
}

export async function executeLidoAction({ action, amount, simulationMode = false, rpcUrl, privateKey }) {
  if (simulationMode) {
    return {
      action,
      amount,
      txHash: "SIMULATED_LIDO_TX",
      mode: "simulation"
    };
  }

  try {
    const chain = createChainClient({ rpcUrl, privateKey });
    const signerAddress = await chain.signer.getAddress();
    const value = ethers.parseUnits(MOCK_SELF_TRANSFER_ETH, 18);
    const gasEstimate = await chain.provider.estimateGas({
      from: signerAddress,
      to: signerAddress,
      value
    });
    const gasLimit = (gasEstimate * 120n) / 100n;
    const tx = await chain.signer.sendTransaction({
      to: signerAddress,
      value,
      gasLimit
    });
    const receipt = await tx.wait();
    logger.info("execution.lido.tx", {
      action,
      amount,
      txHash: receipt.hash,
      gasEstimate: gasEstimate.toString(),
      gasUsed: receipt.gasUsed?.toString() || null
    });
    return {
      action,
      amount,
      txHash: receipt.hash,
      mode: "onchain"
    };
  } catch (error) {
    const message = formatEthersError(error);
    logger.error("execution.lido.failed", { action, amount, error: message });
    throw new Error(`Lido execution failed: ${message}`);
  }
}
