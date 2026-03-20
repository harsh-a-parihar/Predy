import express from "express";
import { Contract, JsonRpcProvider, ethers } from "ethers";
import { handleHumanChat } from "../chat/handler.js";
import { TRUTH_STAKE_ABI } from "../trust/abis.js";

export function createRoutes({ config, orchestrator, trustEngine, memory }) {
  const router = express.Router();
  const chatFeed = [];

  function addChat(message) {
    chatFeed.unshift({
      ...message,
      timestamp: message.timestamp || new Date().toISOString()
    });
    if (chatFeed.length > 100) {
      chatFeed.length = 100;
    }
  }

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
    addChat(response);
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

  router.get("/api/predy/status", async (_req, res) => {
    const agents = ["DataAgent", "ConsensusAgent", "PrivacyAgent", "ExecutorAgent"];
    const base = {
      agents,
      simulationMode: config.simulationMode,
      chainId: config.chainId,
      explorerBaseUrl: config.explorerBaseUrl,
      contracts: {
        staking: config.contracts.staking,
        ownerBadge: config.contracts.ownerBadge,
        usdc: config.contracts.usdc,
        mockResolver: config.contracts.mockResolver,
        reputation: config.contracts.reputation,
        bonding: config.contracts.bonding
      }
    };

    let veribond = null;
    try {
      const stakingAddr = config.contracts.staking;
      if (stakingAddr && ethers.isAddress(stakingAddr)) {
        const provider = new JsonRpcProvider(config.baseRpcUrl);
        const stakeContract = new Contract(stakingAddr, TRUTH_STAKE_ABI, provider);
        const [minStake, claimCount, usdcAddr] = await Promise.all([
          stakeContract.minStake(),
          stakeContract.getClaimCount(),
          stakeContract.usdc()
        ]);
        veribond = {
          minStakeRaw: minStake.toString(),
          minStakeUsdc: Number(minStake) / 1e6,
          claimCount: Number(claimCount),
          stakingUsdc: usdcAddr
        };
      }
    } catch (_e) {
      veribond = { error: "Could not read TruthStake (check RPC and address)" };
    }

    let signerAddress = null;
    try {
      signerAddress = await trustEngine.chain.signer.getAddress();
    } catch (_e) {
      signerAddress = null;
    }

    res.json({
      ok: true,
      data: {
        ...base,
        signerAddress,
        veribond
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

  router.get("/api/chat", (_req, res) => {
    res.json({ ok: true, data: chatFeed });
  });

  router.post("/api/chat", (req, res) => {
    const { to, message } = req.body || {};
    const response = handleHumanChat({ to, message: message || "" });
    addChat(response);
    res.json({ ok: true, data: response });
  });

  // Backward-compatible namespace alias for dashboard/API consumers.
  router.get("/api/predy/chat", (_req, res) => {
    res.json({ ok: true, data: chatFeed });
  });

  router.post("/api/predy/chat", (req, res) => {
    const { to, message } = req.body || {};
    const response = handleHumanChat({ to, message: message || "" });
    addChat(response);
    res.json({ ok: true, data: response });
  });

  return router;
}
