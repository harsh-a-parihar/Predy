/**
 * OpenAI Chat Completions (JSON) — used for sentiment, consensus market, explainability.
 * No SDK dependency; uses global fetch (Node 18+).
 */

export async function openaiChatJson({
  apiKey,
  model = "gpt-4o-mini",
  system,
  user,
  temperature = 0.35
}) {
  if (!apiKey) return null;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      temperature,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user }
      ],
      response_format: { type: "json_object" }
    })
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenAI HTTP ${res.status}: ${text.slice(0, 400)}`);
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) return null;
  try {
    return JSON.parse(content);
  } catch {
    return null;
  }
}

export async function openaiSentimentSignal({ apiKey, userInstruction }) {
  if (!apiKey) return null;
  return openaiChatJson({
    apiKey,
    system: `You are a DeFi market sentiment analyst. Given a short user instruction about yield / Lido / stETH / risk,
return ONLY valid JSON with this exact shape:
{"sentimentScore": number between -1 and 1 (bearish negative, bullish positive), "rationale": string (one sentence), "keywords": string[]}`,
    user: `User instruction: ${String(userInstruction || "").slice(0, 2000)}`,
    temperature: 0.25
  });
}
