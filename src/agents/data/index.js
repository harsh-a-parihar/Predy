import { sentimentMicro } from "./micro/sentiment.js";
import { onChainMicro } from "./micro/onchain.js";

export async function runDataAgent(context) {
  const [sentiment, onchain] = await Promise.all([
    sentimentMicro(context),
    onChainMicro(context)
  ]);

  return {
    agent: "DataAgent",
    timestamp: new Date().toISOString(),
    signals: {
      sentiment,
      onchain
    }
  };
}
