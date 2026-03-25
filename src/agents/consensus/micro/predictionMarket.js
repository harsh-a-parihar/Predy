import { openaiChatJson } from "../../../llm/openai.js";
import { voteMicro } from "./vote.js";
import { probabilityMicro } from "./probability.js";

function aggregateVotes(votes) {
  const inc = votes.filter((v) => v.vote === "increase-steth-exposure").length;
  const hold = votes.length - inc;
  return inc > hold ? "increase-steth-exposure" : "hold-position";
}

function meanConfidence(votes) {
  if (!votes.length) return 0.65;
  const sum = votes.reduce((s, v) => s + Number(v.confidence || 0.5), 0);
  return Math.max(0.35, Math.min(0.95, sum / votes.length));
}

/**
 * Internal prediction market: multiple semantic "agents" vote + explain; OpenAI when key present.
 */
export async function runPredictionMarket({ dataOutput, config }) {
  const key = config.openaiApiKey;
  const payload = {
    sentiment: dataOutput.signals?.sentiment,
    onchain: dataOutput.signals?.onchain,
    userHint: dataOutput.userInstruction
  };

  if (!key) {
    const [vote, probability] = await Promise.all([
      voteMicro({ dataOutput }),
      probabilityMicro({ dataOutput })
    ]);
    return {
      source: "predictionMarket",
      mode: "deterministic-fallback",
      prediction: vote.vote,
      confidence: probability.confidence,
      votes: [
        {
          voter: "HeuristicA",
          vote: vote.vote,
          confidence: probability.confidence,
          reasoning: "Keyword + APR heuristic (set OPENAI_API_KEY for semantic market)."
        }
      ],
      aggregateReasoning:
        "OpenAI not configured — using deterministic voteMicro + probabilityMicro for stability.",
      semanticAnalysis: "N/A (no LLM)."
    };
  }

  try {
    const parsed = await openaiChatJson({
      apiKey: key,
      model: "gpt-4o-mini",
      system: `You are the Predy internal prediction market. Three specialist agents vote on stETH yield positioning.
Return ONLY valid JSON:
{
  "votes": [
    {
      "voter": "DataStrategist|RiskOfficer|YieldOptimizer",
      "vote": "increase-steth-exposure" | "hold-position",
      "confidence": number between 0.35 and 0.95,
      "reasoning": string (one or two sentences, cite sentiment/APR)
    }
  ],
  "aggregateReasoning": string (synthesize disagreement),
  "semanticAnalysis": string (macro + on-chain narrative in 2 sentences)
}
Rules:
- increase-steth-exposure only if both sentiment is not strongly bearish AND lidoApr is healthy (> ~3%).
- Otherwise prefer hold-position.`,
      user: JSON.stringify(payload),
      temperature: 0.35
    });

    if (!parsed?.votes || !Array.isArray(parsed.votes)) {
      throw new Error("Invalid prediction market JSON");
    }

    const votes = parsed.votes.map((v) => ({
      voter: v.voter || "Analyst",
      vote:
        v.vote === "increase-steth-exposure" ? "increase-steth-exposure" : "hold-position",
      confidence: Number(v.confidence) || 0.65,
      reasoning: v.reasoning || ""
    }));

    const prediction = aggregateVotes(votes);
    const confidence = meanConfidence(votes);

    return {
      source: "predictionMarket",
      mode: "openai",
      prediction,
      confidence,
      votes,
      aggregateReasoning: parsed.aggregateReasoning || "",
      semanticAnalysis: parsed.semanticAnalysis || ""
    };
  } catch (err) {
    const [vote, probability] = await Promise.all([
      voteMicro({ dataOutput }),
      probabilityMicro({ dataOutput })
    ]);
    return {
      source: "predictionMarket",
      mode: "openai-error-fallback",
      prediction: vote.vote,
      confidence: probability.confidence,
      votes: [
        {
          voter: "HeuristicFallback",
          vote: vote.vote,
          confidence: probability.confidence,
          reasoning: `LLM market failed: ${String(err?.message || err)}`
        }
      ],
      aggregateReasoning: "Fell back to heuristics after OpenAI error.",
      semanticAnalysis: String(err?.message || err)
    };
  }
}
