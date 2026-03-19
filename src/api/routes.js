import express from "express";
import { handleHumanChat } from "../chat/handler.js";

export function createRoutes({ orchestrator, trustEngine, memory }) {
  const router = express.Router();

  router.post("/skill/data/fetch", async (req, res) => {
    const result = await orchestrator.runPredictionLoop({
      userInstruction: req.body?.instruction || "Fetch yield signals"
    });
    res.json({ ok: true, data: result.dataOutput ?? result });
  });

  router.post("/skill/consensus/predict", async (req, res) => {
    const result = await orchestrator.runPredictionLoop({
      userInstruction: req.body?.instruction || "Run consensus prediction"
    });
    res.json({ ok: true, data: result.consensusOutput ?? result });
  });

  router.post("/skill/privacy/sanitize", async (req, res) => {
    const result = await orchestrator.runPredictionLoop({
      userInstruction: req.body?.instruction || "Run privacy scoring"
    });
    res.json({ ok: true, data: result.privacyOutput ?? result });
  });

  router.post("/skill/execute/action", async (req, res) => {
    const result = await orchestrator.runPredictionLoop({
      userInstruction: req.body?.instruction || "Execute safe action"
    });
    res.json({ ok: true, data: result.executorOutput ?? result });
  });

  router.post("/skill/human/chat", (req, res) => {
    const { to, message } = req.body || {};
    const response = handleHumanChat({ to, message: message || "" });
    res.json({ ok: true, data: response });
  });

  router.post("/trust/stake", async (req, res) => {
    const data = await trustEngine.stake(req.body || {});
    res.json({ ok: true, data });
  });

  router.post("/trust/resolve", async (req, res) => {
    const data = await trustEngine.resolve(req.body || {});
    res.json({ ok: true, data });
  });

  router.get("/trust/reputation", async (req, res) => {
    const data = await trustEngine.getReputation(req.query.agentId || "ConsensusAgent");
    res.json({ ok: true, data });
  });

  router.post("/trust/bond", async (req, res) => {
    const data = await trustEngine.bond(req.body || {});
    res.json({ ok: true, data });
  });

  router.get("/api/predy/status", (_req, res) => {
    res.json({
      ok: true,
      data: {
        agents: ["DataAgent", "ConsensusAgent", "PrivacyAgent", "ExecutorAgent"],
        simulationMode: trustEngine.simulationMode
      }
    });
  });

  router.post("/api/predy/instruct", async (req, res) => {
    const result = await orchestrator.runPredictionLoop({
      userInstruction: req.body?.instruction || "Optimize my yield safely"
    });
    res.json({ ok: true, data: result });
  });

  router.get("/api/predy/history", (_req, res) => {
    res.json({ ok: true, data: memory.getAll() });
  });

  return router;
}
