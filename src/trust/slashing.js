import { Contract } from "ethers";
import { TRUTH_STAKE_ABI } from "./abis.js";

export async function resolveClaim({
  simulationMode,
  chain,
  contractAddress,
  claimId,
  fallbackIsCorrect
}) {
  if (simulationMode || !contractAddress || !claimId) {
    return {
      result: fallbackIsCorrect ? "reward" : "slash",
      txHash: "SIMULATED_RESOLVE_TX"
    };
  }

  const contract = new Contract(contractAddress, TRUTH_STAKE_ABI, chain.signer);
  const tx = await contract.resolve(claimId);
  const receipt = await tx.wait();
  const claim = await contract.getClaim(claimId);
  return {
    result: claim.wasCorrect ? "reward" : "slash",
    txHash: receipt.hash
  };
}
