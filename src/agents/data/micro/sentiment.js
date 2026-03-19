export async function sentimentMicro({ userInstruction }) {
  // Lightweight deterministic sentiment signal for hackathon demo stability.
  const bearishWords = ["risk", "dump", "fall", "panic"];
  const isBearish = bearishWords.some((w) =>
    String(userInstruction || "").toLowerCase().includes(w)
  );

  return {
    source: "sentimentMicro",
    sentimentScore: isBearish ? -0.35 : 0.42
  };
}
