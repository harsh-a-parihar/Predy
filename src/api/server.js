import express from "express";
import { createRoutes } from "./routes.js";

export function createServer({ config, orchestrator, trustEngine, memory, logger }) {
  const app = express();
  app.use((_req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.header("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    if (_req.method === "OPTIONS") {
      return res.sendStatus(204);
    }
    return next();
  });
  app.use(express.json());
  app.use(createRoutes({ config, orchestrator, trustEngine, memory }));

  app.use((err, _req, res, _next) => {
    logger.error("api.error", { error: err.message });
    res.status(500).json({ ok: false, error: err.message });
  });

  const server = app.listen(config.port, () => {
    logger.info("api.server_started", { port: config.port });
  });

  return { app, server };
}
