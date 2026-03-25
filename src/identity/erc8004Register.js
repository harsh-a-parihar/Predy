import { Contract, ethers, JsonRpcProvider, Wallet } from "ethers";

/**
 * Base Sepolia ERC-8004 Identity Registry (public).
 * @see https://docs.base.org — same address used by VeriBond TruthStake deployments.
 */
export const DEFAULT_IDENTITY_REGISTRY = "0x8004A818BFB912233c491871b3d84c89A494BD9e";

const IDENTITY_REGISTRY_ABI = [
  "function register(string memory agentURI) external returns (uint256 agentId)",
  "function getAgentWallet(uint256 agentId) external view returns (address)"
];

const IERC721_TRANSFER = [
  "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)"
];

/**
 * Parse minted agent id from ERC721 Transfer(from=0) emitted by registry.
 */
function tokenIdFromMintReceipt(receipt, registryAddress) {
  const iface = new ethers.Interface(IERC721_TRANSFER);
  const reg = registryAddress.toLowerCase();
  for (const log of receipt.logs) {
    if (!log.address || log.address.toLowerCase() !== reg) continue;
    try {
      const ev = iface.parseLog({
        topics: log.topics,
        data: log.data
      });
      if (ev?.name === "Transfer" && ev.args.from === ethers.ZeroAddress) {
        return ev.args.tokenId;
      }
    } catch {
      // continue
    }
  }
  throw new Error("Could not parse agentId from register() receipt (no mint Transfer)");
}

const SWARM_ROLES = [
  { key: "Orchestrator", slug: "orchestrator" },
  { key: "DataAgent", slug: "data" },
  { key: "ConsensusAgent", slug: "consensus" },
  { key: "PrivacyAgent", slug: "privacy" },
  { key: "ExecutorAgent", slug: "executor" }
];

/**
 * Register 5 ERC-8004 agents; each `register()` is a real on-chain tx signed by `privateKey`.
 * @returns {{ swarmId: string, swarm: Record<string, { erc8004Id: string, agentURI: string, txHash: string, createdAt: string }> }}
 */
export async function registerSwarmOnChain({
  rpcUrl,
  privateKey,
  identityRegistryAddress = DEFAULT_IDENTITY_REGISTRY,
  swarmId,
  userId,
  profile = {}
}) {
  if (!ethers.isAddress(identityRegistryAddress)) {
    throw new Error("Invalid identity registry address");
  }
  const provider = new JsonRpcProvider(rpcUrl);
  const signer = new Wallet(privateKey, provider);
  const contract = new Contract(identityRegistryAddress, IDENTITY_REGISTRY_ABI, signer);
  const signerAddress = await signer.getAddress();

  const swarm = {};
  /** Manual nonce after each confirmed tx avoids races with `pending` vs mined state */
  let nonce = BigInt(await provider.getTransactionCount(signerAddress, "latest"));
  for (const role of SWARM_ROLES) {
    const meta = {
      app: "predy",
      userId,
      swarmId,
      role: role.key,
      slug: role.slug,
      version: 1,
      ...profile
    };
    const agentURI = `data:application/json;utf8,${encodeURIComponent(JSON.stringify(meta))}`;
    const tx = await contract.register(agentURI, { nonce });
    const receipt = await tx.wait();
    nonce += 1n;
    const tokenId = tokenIdFromMintReceipt(receipt, identityRegistryAddress);
    const idStr = tokenId.toString(10);
    let onChainWallet = null;
    try {
      onChainWallet = await contract.getAgentWallet(tokenId);
    } catch {
      onChainWallet = null;
    }
    swarm[role.key] = {
      erc8004Id: idStr,
      agentURI,
      txHash: receipt.hash,
      createdAt: new Date().toISOString(),
      goal: `Predy ${role.key} for swarm ${swarmId}`,
      task: "swarm-coordination",
      skills: ["on-chain", "erc-8004", role.slug],
      walletLinked: true,
      permissions: ["execute-scoped", "stake-when-consensus"],
      onChainWallet: onChainWallet ? String(onChainWallet) : null,
      signerAddress
    };
  }

  return { swarmId, swarm };
}

export { SWARM_ROLES };
