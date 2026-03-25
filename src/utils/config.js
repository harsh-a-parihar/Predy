import dotenv from "dotenv";
import { ethers } from "ethers";

dotenv.config();

function flag(key, fallback = false) {
  const value = process.env[key];
  if (value === undefined) return fallback;
  return String(value).toLowerCase() === "true";
}

/** Ethers + VeriBondEngine expect `0x` + 64 hex. Foundry-style env often omits the prefix. */
function normalizePrivateKey(raw) {
  const s = String(raw).trim();
  if (s.startsWith("0x") || s.startsWith("0X")) return s;
  if (/^[0-9a-fA-F]{64}$/.test(s)) return `0x${s}`;
  return s;
}

/**
 * Legacy single-operator swarm (used when PRIVATE_KEY is set and no X-User-Id session).
 * Prefer multi-user onboarding for distinct ERC-8004 ids per user.
 */
/** Legacy single-wallet defaults (no Orchestrator row — multi-user onboard adds all 5). */
export const legacySwarmAgents = Object.freeze({
  DataAgent: Number(process.env.VERIBOND_AGENT_ID_DATA || 1),
  ConsensusAgent: Number(process.env.VERIBOND_AGENT_ID_CONSENSUS || 2),
  PrivacyAgent: Number(process.env.VERIBOND_AGENT_ID_PRIVACY || 3),
  ExecutorAgent: Number(process.env.VERIBOND_AGENT_ID_EXECUTOR || 4)
});

const DEFAULT_SINGLE_WALLET = "0x569CD75b6116b7C71D19C715EaAC157749Ccd0F8";

function parseSingleWallet(raw) {
  const s = (raw || DEFAULT_SINGLE_WALLET).trim();
  try {
    return ethers.getAddress(s);
  } catch {
    return DEFAULT_SINGLE_WALLET;
  }
}

const pkEnv = process.env.PRIVATE_KEY;
const hasPk = Boolean(pkEnv && String(pkEnv).trim());

export const config = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 8787),
  openaiApiKey: process.env.OPENAI_API_KEY || "",
  veniceApiBaseUrl: (process.env.VENICE_API_BASE_URL || "https://api.venice.ai/api/v1").replace(/\/$/, ""),
  veniceModel: process.env.VENICE_MODEL || "llama-3.3-70b",
  defaultAutonomyAutoApprovePercent: Number(process.env.AUTONOMY_AUTO_APPROVE_PERCENT || 95),
  baseRpcUrl: process.env.BASE_RPC_URL || "https://sepolia.base.org",
  /** Optional: legacy bootstrap; multi-user flow uses linked wallet from POST /user/link-wallet */
  privateKey: hasPk ? normalizePrivateKey(pkEnv) : "",
  chainId: Number(process.env.CHAIN_ID || 84532),
  explorerBaseUrl: (process.env.BASE_EXPLORER_URL || "https://sepolia.basescan.org").replace(/\/$/, ""),
  veniceApiKey: process.env.VENICE_API_KEY || "",
  simulationMode: flag("SIMULATION_MODE", false),
  contracts: {
    staking: process.env.VERIBOND_STAKING_ADDRESS || "",
    reputation: process.env.VERIBOND_REPUTATION_ADDRESS || "",
    bonding: process.env.VERIBOND_BONDING_ADDRESS || "",
    ownerBadge: process.env.VERIBOND_OWNER_BADGE_ADDRESS || "",
    usdc: process.env.VERIBOND_USDC_ADDRESS || "",
    mockResolver: process.env.VERIBOND_MOCK_RESOLVER_ADDRESS || ""
  },
  /** ERC-8004 Identity Registry (Base Sepolia public). */
  identityRegistryAddress: (process.env.IDENTITY_REGISTRY_ADDRESS || "0x8004A818BFB912233c491871b3d84c89A494BD9e").trim(),
  /** Optional: MockResolver owner key — auto `setOutcome` before TruthStake.resolve (see docs/DEPLOY_BASE_SEPOLIA.md). */
  mockResolverAdminPrivateKey: (process.env.MOCK_RESOLVER_ADMIN_PRIVATE_KEY || "").trim()
    ? normalizePrivateKey(process.env.MOCK_RESOLVER_ADMIN_PRIVATE_KEY)
    : "",
  /** SQLite path (default ./data/predy.db). */
  predyDbPath: process.env.PREDY_DB_PATH || "",
  teamId: process.env.PREDY_TEAM_ID || "1027239e8acf49eca9699d63b29879d9",
  teamMembersLabel: process.env.PREDY_TEAM_MEMBERS_LABEL || "2 (Harsh + Predy)",
  singleWallet: parseSingleWallet(process.env.PREDY_SWARM_SINGLE_WALLET),
  /** @deprecated use legacySwarmAgents — kept for older imports */
  swarmAgents: legacySwarmAgents,
  agentIds: legacySwarmAgents,
  legacySwarmAgents,
  /**
   * Runtime user context (set by POST /user/link-wallet + /user/onboard).
   * Read via GET /api/predy/status or `import { getCurrentUserFromRequest } from "./runtime/userContext.js"`.
   */
  currentUser: null,
  linkedWallet: null,
  dynamicSwarm: null
};
