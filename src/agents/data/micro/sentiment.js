import { openaiSentimentSignal } from "../../../llm/openai.js";
import { config } from "../../../utils/config.js";

export async function sentimentMicro({ userInstruction }) {
  try {
    const llm = await openaiSentimentSignal({
      apiKey: config.openaiApiKey,
      userInstruction
    });
    if (llm && typeof llm.sentimentScore === "number") {
      return {
        source: "openai",
        sentimentScore: Math.max(-1, Math.min(1, Number(llm.sentimentScore))),
        rationale: llm.rationale || "",
        keywords: Array.isArray(llm.keywords) ? llm.keywords : []
      };
    }
  } catch {
    // fall through
  }

  const bearishWords = ["risk", "dump", "fall", "panic", "crash", "hack"];
  const isBearish = bearishWords.some((w) =>
    String(userInstruction || "").toLowerCase().includes(w)
  );

  return {
    source: "sentimentMicro-heuristic",
    sentimentScore: isBearish ? -0.35 : 0.42,
    rationale: isBearish
      ? "Heuristic: bearish keywords detected."
      : "Heuristic: neutral/bullish tone (set OPENAI_API_KEY for LLM sentiment).",
    keywords: []
  };
}
