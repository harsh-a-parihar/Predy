import { Contract, ethers } from "ethers";
import { createChainClient } from "./ethersWrapper.js";
import { logger } from "../utils/logger.js";

const ERC20_ABI = [
  "function transfer(address to, uint256 value) external returns (bool)",
  "function decimals() external view returns (uint8)"
];

const USDC_DECIMALS = 6;

/** USDC-style amounts: clamp and format so parseUnits never exceeds 6 fraction digits. */
function parseUsdcAmount(amount, fallback = "0.001") {
  const raw = amount === undefined || amount === null || amount === "" ? fallback : String(amount).trim();
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) {
    return ethers.parseUnits(fallback, USDC_DECIMALS);
  }
  const clamped = Math.max(0.000001, Math.min(n, 1e9));
  return ethers.parseUnits(clamped.toFixed(USDC_DECIMALS), USDC_DECIMALS);
}

function formatEthersError(error) {
  return (
    error?.shortMessage ||
    error?.reason ||
    error?.info?.error?.message ||
    error?.message ||
    "Unknown ethers error"
  );
}

export async function executeUniswapAction({
  action,
  amount,
  simulationMode = false,
  rpcUrl,
  privateKey,
  usdcAddress
}) {
  if (simulationMode) {
    return {
      action,
      amount,
      txHash: "SIMULATED_UNISWAP_TX",
      mode: "simulation"
    };
  }

  if (!ethers.isAddress(usdcAddress || "")) {
    throw new Error("VERIBOND_USDC_ADDRESS is required for on-chain rebalance execution");
  }

  try {
    const chain = createChainClient({ rpcUrl, privateKey });
    const signerAddress = await chain.signer.getAddress();
    const usdc = new Contract(usdcAddress, ERC20_ABI, chain.signer);
    const onChainDecimals = Number(await usdc.decimals());
    if (onChainDecimals !== USDC_DECIMALS) {
      throw new Error(
        `Token at ${usdcAddress} reports decimals=${onChainDecimals}; expected ${USDC_DECIMALS} (USDC). ` +
          `Use Base Sepolia test USDC 0x036CbD53842c5426634e7929541eC2318f3dCF7e in VERIBOND_USDC_ADDRESS.`
      );
    }
    const transferAmount = parseUsdcAmount(amount, "0.001");
    const gasEstimate = await usdc.transfer.estimateGas(signerAddress, transferAmount);
    const gasLimit = (gasEstimate * 120n) / 100n;
    const tx = await usdc.transfer(signerAddress, transferAmount, { gasLimit });
    const receipt = await tx.wait();
    logger.info("execution.uniswap.tx", {
      action,
      amount,
      txHash: receipt.hash,
      token: usdcAddress,
      gasEstimate: gasEstimate.toString(),
      gasUsed: receipt.gasUsed?.toString() || null
    });
    return {
      action,
      amount,
      txHash: receipt.hash,
      mode: "onchain",
      token: usdcAddress
    };
  } catch (error) {
    const message = formatEthersError(error);
    logger.error("execution.uniswap.failed", { action, amount, usdcAddress, error: message });
    throw new Error(`Uniswap execution failed: ${message}`);
  }
}
