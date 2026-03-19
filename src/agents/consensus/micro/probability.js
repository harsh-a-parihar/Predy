export async function probabilityMicro({ dataOutput }) {
  const s = dataOutput.signals.sentiment.sentimentScore;
  const base = 0.6 + s * 0.2;
  const confidence = Math.max(0.5, Math.min(0.92, base));
  return {
    source: "probabilityMicro",
    confidence
  };
}
