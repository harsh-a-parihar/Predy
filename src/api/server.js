import express from "express";
import { createRoutes } from "./routes.js";
import { createUserRouter } from "./userRoutes.js";

/**
 * @param {{
 *   config: import("../utils/config.js").config,
 *   orchestrator: import("../orchestrator/index.js").Orchestrator,
 *   trustEngine: import("../trust/VeriBondEngine.js").VeriBondEngine | null,
 *   memory: import("../orchestrator/memory.js").MemoryHub,
 *   logger: import("../utils/logger.js").logger,
 *   resolveTrustEngine: (req: any) => import("../trust/VeriBondEngine.js").VeriBondEngine
 * }} opts
 */
export function createApp({ config, orchestrator, trustEngine, memory, logger, resolveTrustEngine }) {
  const app = express();
  app.use((_req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-User-Id");
    res.header("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    if (_req.method === "OPTIONS") {
      return res.sendStatus(204);
    }
    return next();
  });
  app.use(express.json());
  app.use(createUserRouter({ config }));
  app.use(createRoutes({ config, orchestrator, trustEngine, memory, resolveTrustEngine }));

  app.use((err, _req, res, _next) => {
    logger.error("api.error", { error: err.message });
    res.status(500).json({ ok: false, error: err.message });
  });

  return app;
}

export function createServer(opts) {
  const { config, logger } = opts;
  const app = createApp(opts);

  const server = app.listen(config.port, () => {
    logger.info("api.server_started", { port: config.port });
  });

  return { app, server };
}
