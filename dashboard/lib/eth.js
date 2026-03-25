import { BrowserProvider, formatEther, ethers } from "ethers";

const BASE_SEPOLIA_CHAIN = {
  chainId: "0x14a34",
  chainName: "Base Sepolia",
  nativeCurrency: { name: "Ethereum", symbol: "ETH", decimals: 18 },
  rpcUrls: ["https://sepolia.base.org"],
  blockExplorerUrls: ["https://sepolia.basescan.org"]
};

export async function ensureBaseSepolia(ethereum) {
  const chainId = await ethereum.request({ method: "eth_chainId" });
  if (chainId === BASE_SEPOLIA_CHAIN.chainId) return;
  try {
    await ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: BASE_SEPOLIA_CHAIN.chainId }]
    });
  } catch (switchError) {
    if (switchError?.code === 4902) {
      await ethereum.request({
        method: "wallet_addEthereumChain",
        params: [BASE_SEPOLIA_CHAIN]
      });
      return;
    }
    throw switchError;
  }
}

export function getInjectedProvider() {
  if (typeof window === "undefined") return null;
  return window.ethereum || null;
}

export async function connectInjected() {
  const ethereum = getInjectedProvider();
  if (!ethereum) throw new Error("No injected wallet (install MetaMask or another EVM wallet)");
  await ensureBaseSepolia(ethereum);
  const accounts = await ethereum.request({ method: "eth_requestAccounts" });
  const address = ethers.getAddress(accounts[0]);
  const provider = new BrowserProvider(ethereum);
  return { ethereum, address, provider };
}

export async function fetchEthBalance(provider, address) {
  const bal = await provider.getBalance(address);
  return formatEther(bal);
}

/** USDC on Base Sepolia — common test token */
const USDC_ABI = ["function balanceOf(address) view returns (uint256)"];
const USDC_BASE_SEPOLIA = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";

export async function fetchUsdcBalance(provider, address) {
  const c = new ethers.Contract(USDC_BASE_SEPOLIA, USDC_ABI, provider);
  const raw = await c.balanceOf(address);
  return Number(raw) / 1e6;
}
