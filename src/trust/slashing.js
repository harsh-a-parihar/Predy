import { Contract, ethers } from "ethers";
import { TRUTH_STAKE_ABI } from "./abis.js";

export async function resolveClaim({ chain, contractAddress, claimId }) {
  if (!contractAddress || !ethers.isAddress(contractAddress)) {
    throw new Error("VERIBOND_STAKING_ADDRESS is missing or invalid");
  }
  if (!claimId) {
    throw new Error("claimId (stakeId) is required for on-chain resolve");
  }

  const contract = new Contract(contractAddress, TRUTH_STAKE_ABI, chain.signer);
  const gasEstimate = await contract.resolve.estimateGas(claimId);
  const gasLimit = (gasEstimate * 120n) / 100n;
  const tx = await contract.resolve(claimId, { gasLimit });
  const receipt = await tx.wait();
  const claim = await contract.getClaim(claimId);
  return {
    result: claim.wasCorrect ? "reward" : "slash",
    txHash: receipt.hash,
    gasEstimate: gasEstimate.toString(),
    gasUsed: receipt.gasUsed?.toString() || null
  };
}
