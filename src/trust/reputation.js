import { Contract, ethers } from "ethers";
import { OWNER_BADGE_ABI, TRUTH_STAKE_ABI } from "./abis.js";

export async function getReputationScore({
  chain,
  ownerBadgeAddress,
  stakingAddress,
  ownerAddress,
  agentId,
  localScore = 50
}) {
  if (!ownerBadgeAddress || !ethers.isAddress(ownerBadgeAddress)) {
    throw new Error("VERIBOND_OWNER_BADGE_ADDRESS is missing or invalid");
  }
  if (!stakingAddress || !ethers.isAddress(stakingAddress)) {
    throw new Error("VERIBOND_STAKING_ADDRESS is missing or invalid");
  }

  const ownerBadge = new Contract(ownerBadgeAddress, OWNER_BADGE_ABI, chain.provider);
  const staking = new Contract(stakingAddress, TRUTH_STAKE_ABI, chain.provider);
  const badgeId = await ownerBadge.ownerToBadge(ownerAddress);
  const slashes = badgeId > 0n ? await ownerBadge.slashCount(badgeId) : 0n;
  const accuracy = await staking.getAgentAccuracy(agentId);
  const correct = Number(accuracy.correct);
  const total = Number(accuracy.total);
  const accScore = total > 0 ? Math.round((correct / total) * 100) : localScore;
  const slashPenalty = Math.min(40, Number(slashes) * 2);
  return {
    score: Math.max(0, accScore - slashPenalty),
    source: "onchain"
  };
}
