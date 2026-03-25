import { config } from "./utils/config.js";
import { logger } from "./utils/logger.js";
import { VeriBondEngine } from "./trust/VeriBondEngine.js";
import { createResolveTrustEngine } from "./trust/resolveTrustEngine.js";
import { MemoryHub } from "./orchestrator/memory.js";
import { Orchestrator } from "./orchestrator/index.js";
import { createServer } from "./api/server.js";

function bootstrap() {
  const defaultEngine = config.privateKey ? new VeriBondEngine({ config }) : null;
  const resolveTrustEngine = createResolveTrustEngine(config, defaultEngine);
  const memory = new MemoryHub();
  const orchestrator = new Orchestrator({
    trustEngine: defaultEngine,
    memory,
    logger,
    config
  });
  createServer({ config, orchestrator, trustEngine: defaultEngine, memory, logger, resolveTrustEngine });
}

bootstrap();
