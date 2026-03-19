import { Contract, ethers } from "ethers";
import { TRUTH_STAKE_ABI } from "./abis.js";
import { logger } from "../utils/logger.js";

export async function stakeClaim({
  simulationMode,
  chain,
  contractAddress,
  agentId,
  claimHash,
  stakeAmountUSDC,
  resolvesAt,
  predictedOutcome
}) {
  if (simulationMode || !contractAddress) {
    return {
      claimId: ethers.id(`${agentId}:${claimHash}:${Date.now()}`),
      txHash: "SIMULATED_STAKE_TX"
    };
  }

  const contract = new Contract(contractAddress, TRUTH_STAKE_ABI, chain.signer);
  const stakeUnits = BigInt(Math.floor(Number(stakeAmountUSDC) * 1_000_000));
  const tx = await contract.submitClaim(
    agentId,
    claimHash,
    stakeUnits,
    resolvesAt,
    predictedOutcome
  );
  const receipt = await tx.wait();
  logger.info("veribond.submit_claim", { txHash: receipt.hash });
  return { claimId: null, txHash: receipt.hash };
}
