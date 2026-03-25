/**
 * Venice AI — OpenAI-compatible API at api.venice.ai (private inference).
 * https://docs.venice.ai/api-reference
 */

const DEFAULT_VENICE_BASE = "https://api.venice.ai/api/v1";

export async function veniceChatJson({
  apiKey,
  baseUrl = DEFAULT_VENICE_BASE,
  model = "llama-3.3-70b",
  system,
  user,
  temperature = 0.2
}) {
  if (!apiKey) return null;

  const url = `${String(baseUrl).replace(/\/$/, "")}/chat/completions`;
  const res = await fetch(url, {
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
    throw new Error(`Venice HTTP ${res.status}: ${text.slice(0, 400)}`);
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

/**
 * Privacy layer: produce a non-reversible blob reference + safe public confidence.
 * High-conviction / sensitive strategy detail should reduce public confidence or stay in privateBlob only.
 */
export async function venicePrivacyEnvelope({
  apiKey,
  baseUrl,
  model,
  consensusOutput,
  dataSummary
}) {
  return veniceChatJson({
    apiKey,
    baseUrl,
    model: model || "llama-3.3-70b",
    system: `You are PrivacyAgent for Predy. You run on Venice private inference.
Return ONLY valid JSON:
{
  "publicConfidence": number (0-100, what is safe to show the user on a dashboard),
  "publicSummary": string (one short sentence, no wallet addresses or exact trade sizes),
  "privateBlob": string (opaque reference or ciphertext-like blob id — may include a short hash prefix venice_),
  "privacyNotes": string (why you redacted or lowered public confidence)
}
Rules:
- If consensus confidence is high (>0.85) or reasoning mentions specific exploit/MEV/alpha, LOWER publicConfidence by 5-25 points vs naive scaling.
- Never leak private user portfolio details; user instruction may be empty.`,
    user: JSON.stringify({
      dataSummary: dataSummary || {},
      consensus: {
        prediction: consensusOutput?.prediction,
        confidence: consensusOutput?.confidence,
        market: consensusOutput?.market
      }
    }),
    temperature: 0.15
  });
}
