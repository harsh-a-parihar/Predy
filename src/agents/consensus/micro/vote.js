export async function voteMicro({ dataOutput }) {
  const sentiment = dataOutput.signals.sentiment.sentimentScore;
  const apr = dataOutput.signals.onchain.lidoApr;
  const bullish = sentiment > 0 && apr > 3.5;
  return {
    source: "voteMicro",
    vote: bullish ? "increase-steth-exposure" : "hold-position"
  };
}
