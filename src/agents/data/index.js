import { sentimentMicro } from "./micro/sentiment.js";
import { onChainMicro } from "./micro/onchain.js";

export async function runDataAgent({ userInstruction, predictionId, memory }) {
  const [sentiment, onchain] = await Promise.all([
    sentimentMicro({ userInstruction }),
    onChainMicro()
  ]);

  const output = {
    agent: "DataAgent",
    userInstruction,
    timestamp: new Date().toISOString(),
    signals: {
      sentiment,
      onchain
    }
  };

  memory?.addForAgent?.("DataAgent", {
    type: "data_output",
    predictionId,
    sentimentScore: sentiment.sentimentScore,
    lidoApr: onchain.lidoApr
  });

  return output;
}
