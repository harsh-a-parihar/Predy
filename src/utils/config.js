import dotenv from "dotenv";

dotenv.config();

function required(key, fallback = undefined) {
  const value = process.env[key] ?? fallback;
  if (value === undefined || value === "") {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

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

export const config = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 8787),
  baseRpcUrl: required("BASE_RPC_URL", "https://sepolia.base.org"),
  /** Funded hot wallet for Base Sepolia — no placeholder default (set in .env). */
  privateKey: normalizePrivateKey(required("PRIVATE_KEY")),
  chainId: Number(process.env.CHAIN_ID || 84532),
  explorerBaseUrl: (process.env.BASE_EXPLORER_URL || "https://sepolia.basescan.org").replace(/\/$/, ""),
  veniceApiKey: process.env.VENICE_API_KEY || "",
  /** Execution / demos — VeriBond trust layer is always on-chain in this build. */
  simulationMode: flag("SIMULATION_MODE", false),
  contracts: {
    staking: process.env.VERIBOND_STAKING_ADDRESS || "",
    reputation: process.env.VERIBOND_REPUTATION_ADDRESS || "",
    bonding: process.env.VERIBOND_BONDING_ADDRESS || "",
    ownerBadge: process.env.VERIBOND_OWNER_BADGE_ADDRESS || "",
    usdc: process.env.VERIBOND_USDC_ADDRESS || "",
    mockResolver: process.env.VERIBOND_MOCK_RESOLVER_ADDRESS || ""
  },
  agentIds: {
    DataAgent: 1,
    ConsensusAgent: 2,
    PrivacyAgent: 3,
    ExecutorAgent: 4
  }
};
