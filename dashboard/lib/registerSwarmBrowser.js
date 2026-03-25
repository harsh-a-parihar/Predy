import { Contract, ethers } from "ethers";

const IDENTITY_REGISTRY_ABI = [
  "function register(string memory agentURI) external returns (uint256 agentId)",
  "function getAgentWallet(uint256 agentId) external view returns (address)"
];

const IERC721_TRANSFER = ["event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)"];

const SWARM_ROLES = [
  { key: "Orchestrator", slug: "orchestrator" },
  { key: "DataAgent", slug: "data" },
  { key: "ConsensusAgent", slug: "consensus" },
  { key: "PrivacyAgent", slug: "privacy" },
  { key: "ExecutorAgent", slug: "executor" }
];

function tokenIdFromMintReceipt(receipt, registryAddress) {
  const iface = new ethers.Interface(IERC721_TRANSFER);
  const reg = registryAddress.toLowerCase();
  for (const log of receipt.logs) {
    if (!log.address || log.address.toLowerCase() !== reg) continue;
    try {
      const ev = iface.parseLog({ topics: log.topics, data: log.data });
      if (ev?.name === "Transfer" && ev.args.from === ethers.ZeroAddress) {
        return ev.args.tokenId;
      }
    } catch {
      /* continue */
    }
  }
  throw new Error("Could not parse agentId from register() receipt");
}

/**
 * @param {{
 *   provider: import("ethers").BrowserProvider,
 *   identityRegistryAddress: string,
 *   swarmId: string,
 *   userId: string,
 *   profile: Record<string, unknown>
 * }} opts
 */
export async function registerSwarmWithBrowserWallet({ provider, identityRegistryAddress, swarmId, userId, profile }) {
  if (!ethers.isAddress(identityRegistryAddress)) {
    throw new Error("Invalid identity registry address");
  }
  const signer = await provider.getSigner();
  const contract = new Contract(identityRegistryAddress, IDENTITY_REGISTRY_ABI, signer);
  const signerAddress = await signer.getAddress();

  const swarm = {};
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
