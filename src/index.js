import { config } from "./utils/config.js";
import { logger } from "./utils/logger.js";
import { VeriBondEngine } from "./trust/VeriBondEngine.js";
import { SessionMemory } from "./orchestrator/memory.js";
import { Orchestrator } from "./orchestrator/index.js";
import { createServer } from "./api/server.js";

function bootstrap() {
  const trustEngine = new VeriBondEngine({
    simulationMode: config.simulationMode,
    config
  });
  const memory = new SessionMemory();
  const orchestrator = new Orchestrator({ trustEngine, memory, logger });
  createServer({ config, orchestrator, trustEngine, memory, logger });
}

bootstrap();
