import { JsonRpcProvider, Wallet } from "ethers";

export function createChainClient({ rpcUrl, privateKey }) {
  const provider = new JsonRpcProvider(rpcUrl);
  const signer = new Wallet(privateKey, provider);
  return { provider, signer };
}
