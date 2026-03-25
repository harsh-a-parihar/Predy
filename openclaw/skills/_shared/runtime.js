import { config } from "../../../src/utils/config.js";
import { VeriBondEngine } from "../../../src/trust/VeriBondEngine.js";
import { MemoryHub } from "../../../src/orchestrator/memory.js";
import { Orchestrator } from "../../../src/orchestrator/index.js";
import { logger } from "../../../src/utils/logger.js";

let runtime = null;

export function getApiBase() {
  return process.env.PREDY_API_BASE || "";
}

export async function callApi(path, body = null, method = "POST") {
  const base = getApiBase();
  if (!base) return null;
  const response = await fetch(`${base}${path}`, {
    method,
    headers: { "content-type": "application/json" },
    body: body ? JSON.stringify(body) : undefined
  });
  if (!response.ok) {
    throw new Error(`OpenClaw API call failed (${response.status}): ${path}`);
  }
  return response.json();
}

export function getLocalRuntime() {
  if (runtime) return runtime;
  const trustEngine = new VeriBondEngine({ config });
  const memory = new MemoryHub();
  const orchestrator = new Orchestrator({ trustEngine, memory, logger, config });
  runtime = { trustEngine, memory, orchestrator };
  return runtime;
}
