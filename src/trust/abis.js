export const TRUTH_STAKE_ABI = [
  "function usdc() external view returns (address)",
  "function identityRegistry() external view returns (address)",
  "function minStake() external view returns (uint256)",
  "function submitClaim(uint256 agentId, bytes32 claimHash, uint256 stake, uint256 resolvesAt, bool predictedOutcome) external returns (bytes32 claimId)",
  "function resolve(bytes32 claimId) external",
  "function getClaim(bytes32 claimId) external view returns ((uint256 agentId,address submitter,bytes32 claimHash,uint256 stake,uint256 submittedAt,uint256 resolvesAt,bool predictedOutcome,bool resolved,bool wasCorrect))",
  "function getAgentAccuracy(uint256 agentId) external view returns (uint256 correct, uint256 total)",
  "function getClaimCount() external view returns (uint256)"
];

/** MockResolver — owner must set outcome for claimHash before TruthStake.resolve succeeds */
export const MOCK_RESOLVER_ABI = ["function setOutcome(bytes32 claimHash, bool outcome) external"];

/** ERC-8004 identity registry — TruthStake requires msg.sender == getAgentWallet(agentId) for submitClaim */
export const IDENTITY_REGISTRY_MIN_ABI = [
  "function getAgentWallet(uint256 agentId) external view returns (address)"
];

export const ERC20_MIN_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function decimals() external view returns (uint8)"
];

export const OWNER_BADGE_ABI = [
  "function ownerToBadge(address owner) external view returns (uint256)",
  "function slashCount(uint256 badgeId) external view returns (uint256)",
  "function hasBadge(address owner) external view returns (bool)"
];
