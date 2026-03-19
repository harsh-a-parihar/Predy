import { voteMicro } from "./micro/vote.js";
import { probabilityMicro } from "./micro/probability.js";

export async function runConsensusAgent({ dataOutput, trustEngine, predictionId }) {
  const [vote, probability] = await Promise.all([
    voteMicro({ dataOutput }),
    probabilityMicro({ dataOutput })
  ]);

  const stakeAmount = Number((0.1 + probability.confidence * 0.4).toFixed(3));
  const stake = await trustEngine.stake({
    agentId: "ConsensusAgent",
    predictionId,
    amount: stakeAmount,
    confidence: probability.confidence
  });

  return {
    agent: "ConsensusAgent",
    prediction: vote.vote,
    confidence: probability.confidence,
    stake
  };
}
