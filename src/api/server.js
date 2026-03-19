import express from "express";
import { createRoutes } from "./routes.js";

export function createServer({ config, orchestrator, trustEngine, memory, logger }) {
  const app = express();
  app.use(express.json());
  app.use(createRoutes({ orchestrator, trustEngine, memory }));

  app.use((err, _req, res, _next) => {
    logger.error("api.error", { error: err.message });
    res.status(500).json({ ok: false, error: err.message });
  });

  const server = app.listen(config.port, () => {
    logger.info("api.server_started", { port: config.port });
  });

  return { app, server };
}
