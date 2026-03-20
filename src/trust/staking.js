import { Contract, ethers } from "ethers";
import { TRUTH_STAKE_ABI, ERC20_MIN_ABI } from "./abis.js";
import { logger } from "../utils/logger.js";

export async function stakeClaim({
  chain,
  contractAddress,
  agentId,
  claimHash,
  stakeAmountUSDC,
  resolvesAt,
  predictedOutcome
}) {
  if (!contractAddress || !ethers.isAddress(contractAddress)) {
    throw new Error("VERIBOND_STAKING_ADDRESS is missing or invalid");
  }

  const contract = new Contract(contractAddress, TRUTH_STAKE_ABI, chain.signer);
  const usdcAddress = await contract.usdc();
  const minStake = await contract.minStake();
  const stakeUnits = BigInt(Math.floor(Number(stakeAmountUSDC) * 1_000_000));
  const minUnits = BigInt(minStake);
  if (stakeUnits < minUnits) {
    throw new Error(
      `Stake ${stakeUnits} units is below TruthStake.minStake (${minUnits} = ${Number(minUnits) / 1e6} USDC)`
    );
  }

  const usdc = new Contract(usdcAddress, ERC20_MIN_ABI, chain.signer);
  const owner = await chain.signer.getAddress();
  const currentAllowance = await usdc.allowance(owner, contractAddress);
  if (currentAllowance < stakeUnits) {
    const approveTx = await usdc.approve(contractAddress, ethers.MaxUint256);
    logger.info("veribond.usdc_approve", { txHash: approveTx.hash });
    await approveTx.wait();
  }

  const gasEstimate = await contract.submitClaim.estimateGas(
    agentId,
    claimHash,
    stakeUnits,
    resolvesAt,
    predictedOutcome
  );
  const gasLimit = (gasEstimate * 120n) / 100n;
  const claimId = await contract.submitClaim.staticCall(
    agentId,
    claimHash,
    stakeUnits,
    resolvesAt,
    predictedOutcome
  );
  const tx = await contract.submitClaim(agentId, claimHash, stakeUnits, resolvesAt, predictedOutcome, {
    gasLimit
  });
  const receipt = await tx.wait();
  logger.info("veribond.submit_claim", {
    txHash: receipt.hash,
    claimId,
    gasEstimate: gasEstimate.toString(),
    gasUsed: receipt.gasUsed?.toString() || null
  });
  return { claimId, txHash: receipt.hash };
}
