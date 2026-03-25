import express from "express";
import { randomUUID } from "node:crypto";
import {
  linkWallet,
  linkWalletWithSignature,
  getUser,
  setOnboarded,
  disconnectUser
} from "../user/userStore.js";
import { registerSwarmOnChain } from "../identity/erc8004Register.js";

function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export function createUserRouter({ config }) {
  const router = express.Router();

  router.post(
    "/user/link-wallet",
    asyncHandler(async (req, res) => {
      const { wallet, privateKey, signature, message, userDetails } = req.body || {};
      if (!wallet) {
        return res.status(400).json({ ok: false, error: "wallet required" });
      }
      let out;
      if (signature && message) {
        out = linkWalletWithSignature({ wallet, signature, message, userDetails });
      } else if (privateKey) {
        out = linkWallet({ wallet, privateKey, userDetails });
      } else {
        return res.status(400).json({
          ok: false,
          error: "Provide either (signature + message) for browser wallet, or privateKey for server tests"
        });
      }
      res.json({
        ok: true,
        userId: out.userId,
        reconnected: out.reconnected,
        restoredFromDb: Boolean(out.restoredFromDb),
        message: out.restoredFromDb
          ? "Session restored from Predy database"
          : out.reconnected
            ? "Wallet reconnected"
            : "Wallet linked — complete onboarding next"
      });
    })
  );

  router.post(
    "/user/onboard",
    asyncHandler(async (req, res) => {
      const userId = req.headers["x-user-id"] || req.headers["X-User-Id"] || req.body?.userId;
      if (!userId) {
        return res.status(400).json({ ok: false, error: "X-User-Id header or body.userId required (from link-wallet)" });
      }
      const u = getUser(String(userId).trim());
      if (!u) {
        return res.status(404).json({ ok: false, error: "User not found — link wallet first" });
      }
      if (u.onboardedAt) {
        return res.status(400).json({ ok: false, error: "Already onboarded" });
      }

      const body = req.body || {};
      const { name, email, background, clientOnboard, swarmId: clientSwarmId, swarmAgents: bodyAgents, swarmMeta: bodyMeta, ...rest } = body;

      /** Browser completed 5× register() — no private key on server */
      if (clientOnboard === true && bodyAgents && typeof bodyAgents === "object") {
        const required = ["Orchestrator", "DataAgent", "ConsensusAgent", "PrivacyAgent", "ExecutorAgent"];
        for (const k of required) {
          if (!bodyAgents[k]) {
            return res.status(400).json({ ok: false, error: `Missing swarm agent id for ${k}` });
          }
        }
        const swarmId = clientSwarmId || `swarm-${randomUUID()}`;
        const profile = { name, email, background, ...rest };
        const swarmMeta = typeof bodyMeta === "object" && bodyMeta !== null ? bodyMeta : {};
        u.userDetails = { ...u.userDetails, ...profile };
        setOnboarded(u.userId, { swarmId, swarmAgents: bodyAgents, swarmMeta });
        return res.json({
          ok: true,
          userId: u.userId,
          swarmId,
          swarm: {
            orchestratorId: bodyAgents.Orchestrator,
            dataId: bodyAgents.DataAgent,
            consensusId: bodyAgents.ConsensusAgent,
            privacyId: bodyAgents.PrivacyAgent,
            executorId: bodyAgents.ExecutorAgent,
            full: bodyAgents
          },
          agents: swarmMeta,
          message: "5 unique ERC-8004 identities successfully registered on-chain using your linked wallet",
          mode: "client"
        });
      }

      if (!u.privateKey) {
        return res.status(400).json({
          ok: false,
          error:
            "No server private key for this user — use client onboard (clientOnboard: true + swarmAgents from browser txs) or link with privateKey for headless mode"
        });
      }

      const profile = { name, email, background, ...rest };
      u.userDetails = { ...u.userDetails, ...profile };
      const swarmId = `swarm-${randomUUID()}`;

      const { swarm } = await registerSwarmOnChain({
        rpcUrl: config.baseRpcUrl,
        privateKey: u.privateKey,
        identityRegistryAddress: config.identityRegistryAddress,
        swarmId,
        userId: u.userId,
        profile
      });

      const swarmAgents = {};
      const swarmMeta = {};
      for (const [k, v] of Object.entries(swarm)) {
        swarmAgents[k] = v.erc8004Id;
        swarmMeta[k] = {
          createdAt: v.createdAt,
          goal: v.goal,
          task: v.task,
          skills: v.skills,
          walletLinked: v.walletLinked,
          permissions: v.permissions,
          txHash: v.txHash,
          agentURI: v.agentURI
        };
      }

      setOnboarded(u.userId, { swarmId, swarmAgents, swarmMeta });

      res.json({
        ok: true,
        userId: u.userId,
        swarmId,
        swarm: {
          orchestratorId: swarm.Orchestrator?.erc8004Id,
          dataId: swarm.DataAgent?.erc8004Id,
          consensusId: swarm.ConsensusAgent?.erc8004Id,
          privacyId: swarm.PrivacyAgent?.erc8004Id,
          executorId: swarm.ExecutorAgent?.erc8004Id,
          full: swarmAgents
        },
        agents: swarmMeta,
        message: "5 unique ERC-8004 identities successfully registered on-chain using your linked wallet"
      });
    })
  );

  router.post(
    "/user/disconnect",
    asyncHandler(async (req, res) => {
      const userId = req.headers["x-user-id"] || req.body?.userId;
      if (!userId) {
        return res.status(400).json({ ok: false, error: "userId required" });
      }
      disconnectUser(String(userId).trim());
      res.json({ ok: true, message: "Disconnected" });
    })
  );

  return router;
}
