import { venicePrivacyEnvelope } from "../../llm/venice.js";
import { config } from "../../utils/config.js";

export async function runPrivacyAgent({ consensusOutput, dataOutput, predictionId, memory }) {
  const naivePublic = Number((consensusOutput.confidence * 100).toFixed(1));

  let venice = null;
  try {
    if (config.veniceApiKey) {
      venice = await venicePrivacyEnvelope({
        apiKey: config.veniceApiKey,
        baseUrl: config.veniceApiBaseUrl,
        model: config.veniceModel,
        consensusOutput,
        dataSummary: {
          lidoApr: dataOutput?.signals?.onchain?.lidoApr,
          sentiment: dataOutput?.signals?.sentiment?.sentimentScore
        }
      });
    }
  } catch (err) {
    venice = {
      veniceError: String(err?.message || err),
      publicConfidence: naivePublic,
      publicSummary: "Privacy layer unavailable; using consensus confidence.",
      privateBlob: `VENICE_ERR_${Date.now().toString(36)}`,
      privacyNotes: "Venice call failed — fallback to naive confidence."
    };
  }

  const publicConfidence = venice?.publicConfidence != null ? Number(venice.publicConfidence) : naivePublic;

  const usedVenice =
    Boolean(config.veniceApiKey) && venice && !venice.veniceError;

  const output = {
    agent: "PrivacyAgent",
    publicConfidence,
    publicSummary: venice?.publicSummary || `Consensus-derived confidence ${publicConfidence}% (no Venice summary).`,
    privateBlob:
      venice?.privateBlob ||
      `VENICE_SIM_${Date.now().toString(36)}`,
    privacyNotes: venice?.privacyNotes || "",
    venice: {
      usedApi: usedVenice,
      ...(venice?.veniceError ? { error: venice.veniceError } : {}),
      ...(!config.veniceApiKey ? { reason: "VENICE_API_KEY not set" } : {})
    }
  };

  memory?.addForAgent?.("PrivacyAgent", {
    type: "privacy_output",
    predictionId,
    publicConfidence,
    veniceUsed: output.venice.usedApi
  });

  return output;
}
