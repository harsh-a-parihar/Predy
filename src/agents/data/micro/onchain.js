import { fetchLidoStethApr } from "./lidoApr.js";

export async function onChainMicro() {
  const lido = await fetchLidoStethApr();
  return {
    source: "onChainMicro",
    lidoApr: lido.lidoApr,
    lidoMeta: {
      timeUnix: lido.timeUnix,
      page: lido.page,
      fallback: lido.fallback || false,
      error: lido.error
    },
    stEthDiscountBps: 4
  };
}
