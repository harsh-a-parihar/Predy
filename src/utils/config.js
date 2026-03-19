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

export const config = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 8787),
  baseRpcUrl: required("BASE_RPC_URL", "https://sepolia.base.org"),
  privateKey: required("PRIVATE_KEY", "0x" + "1".repeat(64)),
  veniceApiKey: process.env.VENICE_API_KEY || "",
  simulationMode: flag("SIMULATION_MODE", true),
  contracts: {
    staking: process.env.VERIBOND_STAKING_ADDRESS || "",
    reputation: process.env.VERIBOND_REPUTATION_ADDRESS || "",
    bonding: process.env.VERIBOND_BONDING_ADDRESS || "",
    ownerBadge: process.env.VERIBOND_OWNER_BADGE_ADDRESS || "",
    usdc: process.env.VERIBOND_USDC_ADDRESS || ""
  },
  agentIds: {
    DataAgent: 1,
    ConsensusAgent: 2,
    PrivacyAgent: 3,
    ExecutorAgent: 4
  }
};
