export function buildPredyLinkMessage(address) {
  return `Predy — authenticate wallet\nAddress: ${address}\nNetwork: Base Sepolia (chainId 84532)\nNonce: ${Date.now()}`;
}
