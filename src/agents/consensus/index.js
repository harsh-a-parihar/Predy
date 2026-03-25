import { runPredictionMarket } from "./micro/predictionMarket.js";
import { config } from "../../utils/config.js";

export async function runConsensusAgent({ dataOutput, trustEngine, predictionId, memory }) {
  const market = await runPredictionMarket({ dataOutput, config });
  const safeConfidence = Number.isFinite(Number(market.confidence))
    ? Math.max(0.35, Math.min(0.95, Number(market.confidence)))
    : 0.65;

  const raw = Number((0.1 + safeConfidence * 0.4).toFixed(3));
  const stakeAmount = Math.max(1, raw);
  const stake = await trustEngine.stake({
    agentId: "ConsensusAgent",
    predictionId,
    amount: stakeAmount,
    confidence: safeConfidence
  });

  const output = {
    agent: "ConsensusAgent",
    prediction: market.prediction,
    confidence: safeConfidence,
    market,
    stake
  };

  memory?.addForAgent?.("ConsensusAgent", {
    type: "consensus_output",
    predictionId,
    prediction: market.prediction,
    confidence: safeConfidence,
    marketMode: market.mode
  });

  return output;
}
