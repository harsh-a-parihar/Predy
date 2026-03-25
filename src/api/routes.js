import express from "express";
import { Contract, JsonRpcProvider, ethers } from "ethers";
import { handleHumanChat } from "../chat/handler.js";
import { IDENTITY_REGISTRY_MIN_ABI, TRUTH_STAKE_ABI } from "../trust/abis.js";
import { normalizeAutonomy } from "../orchestrator/approval.js";
import { getUser } from "../user/userStore.js";

/** Express 4: forward async errors to error middleware instead of crashing the process */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

function loopOptions(req) {
  const b = req.body || {};
  const autonomy = {
    ...(typeof b.autonomy === "object" && b.autonomy !== null ? b.autonomy : {}),
    fullAutonomy: b.fullAutonomy ?? b.autonomy?.fullAutonomy,
    autoApprovePercent: b.autoApprovePercent ?? b.autonomy?.autoApprovePercent,
    mode: b.autonomyMode ?? b.mode ?? b.autonomy?.mode
  };
  return {
    userInstruction: b.instruction || b.userInstruction,
    autonomy
  };
}

const FIVE = ["Orchestrator", "DataAgent", "ConsensusAgent", "PrivacyAgent", "ExecutorAgent"];
const FOUR = ["DataAgent", "ConsensusAgent", "PrivacyAgent", "ExecutorAgent"];

export function createRoutes({ config, orchestrator, trustEngine, memory, resolveTrustEngine }) {
  const router = express.Router();
  const chatFeed = [];

  function te(req) {
    if (typeof resolveTrustEngine === "function") {
      return resolveTrustEngine(req);
    }
    if (!trustEngine) {
      throw new Error(
        "Set X-User-Id after onboarding, or configure PRIVATE_KEY — trust engine not initialized."
      );
    }
    return trustEngine;
  }

  function addChat(message) {
    chatFeed.unshift({
      ...message,
      timestamp: message.timestamp || new Date().toISOString()
    });
    if (chatFeed.length > 100) {
      chatFeed.length = 100;
    }
  }

  router.post(
    "/skill/data/fetch",
    asyncHandler(async (req, res) => {
      const opts = loopOptions(req);
      const result = await orchestrator.runPredictionLoop({
        userInstruction: opts.userInstruction || "Fetch yield signals",
        autonomy: opts.autonomy,
        trustEngine: te(req)
      });
      res.json({ ok: true, data: result.dataOutput ?? result });
    })
  );

  router.post(
    "/skill/consensus/predict",
    asyncHandler(async (req, res) => {
      const opts = loopOptions(req);
      const result = await orchestrator.runPredictionLoop({
        userInstruction: opts.userInstruction || "Run consensus prediction",
        autonomy: opts.autonomy,
        trustEngine: te(req)
      });
      res.json({ ok: true, data: result.consensusOutput ?? result });
    })
  );

  router.post(
    "/skill/privacy/sanitize",
    asyncHandler(async (req, res) => {
      const opts = loopOptions(req);
      const result = await orchestrator.runPredictionLoop({
        userInstruction: opts.userInstruction || "Run privacy scoring",
        autonomy: opts.autonomy,
        trustEngine: te(req)
      });
      res.json({ ok: true, data: result.privacyOutput ?? result });
    })
  );

  router.post(
    "/skill/execute/action",
    asyncHandler(async (req, res) => {
      const opts = loopOptions(req);
      const result = await orchestrator.runPredictionLoop({
        userInstruction: opts.userInstruction || "Execute safe action",
        autonomy: opts.autonomy,
        trustEngine: te(req)
      });
      res.json({ ok: true, data: result.executorOutput ?? result });
    })
  );

  router.post("/skill/human/chat", (req, res) => {
    const { to, message } = req.body || {};
    const response = handleHumanChat({ to, message: message || "" });
    addChat(response);
    res.json({ ok: true, data: response });
  });

  router.post(
    "/trust/stake",
    asyncHandler(async (req, res) => {
      const data = await te(req).stake(req.body || {});
      res.json({ ok: true, data });
    })
  );

  router.post(
    "/trust/resolve",
    asyncHandler(async (req, res) => {
      const data = await te(req).resolve(req.body || {});
      res.json({ ok: true, data });
    })
  );

  router.get(
    "/trust/reputation",
    asyncHandler(async (req, res) => {
      const data = await te(req).getReputation(req.query.agentId || "ConsensusAgent");
      res.json({ ok: true, data });
    })
  );

  router.post(
    "/trust/bond",
    asyncHandler(async (req, res) => {
      const data = await te(req).bond(req.body || {});
      res.json({ ok: true, data });
    })
  );

  router.get(
    "/api/predy/status",
    asyncHandler(async (req, res) => {
      const uid = req.headers["x-user-id"] || req.headers["X-User-Id"];
      const sessionUser = uid ? getUser(String(uid).trim()) : null;

      const agents =
        sessionUser?.onboardedAt ? FIVE : FOUR;

      const teamId = config.teamId;
      const teamIdShort = `${teamId.slice(0, 8)}…`;
      const team = {
        teamId,
        teamIdShort,
        membersLabel: config.teamMembersLabel,
        singleWallet: config.singleWallet,
        swarmAgents: sessionUser?.swarmAgents || config.legacySwarmAgents,
        line: sessionUser?.onboardedAt
          ? `Team: ${teamIdShort} | Members: ${config.teamMembersLabel} | Swarm: 5 unique ERC-8004 identities (on-chain) + linked wallet`
          : `Team: ${teamIdShort} | Members: ${config.teamMembersLabel} | Link wallet + onboard for your personal swarm`,
        swarmBadge:
          "5 Swarm roles • Distinct ERC-8004 per agent • User wallet signs everything • Team of 2"
      };

      const userPayload = sessionUser
        ? {
            userId: sessionUser.userId,
            swarmId: sessionUser.swarmId,
            linkedWallet: sessionUser.linkedWallet,
            onboarded: Boolean(sessionUser.onboardedAt),
            swarmAgents: sessionUser.swarmAgents,
            swarmMeta: sessionUser.swarmMeta,
            bannerLine: sessionUser.onboardedAt
              ? `User onboarded • Swarm created with 5 unique ERC-8004 • Wallet linked: ${sessionUser.linkedWallet} • All actions signed by user wallet`
              : `Wallet linked — POST /user/onboard to register 5 ERC-8004 identities`
          }
        : null;

      const base = {
        agents,
        user: userPayload,
        team,
        agentIds: config.legacySwarmAgents,
        swarmAgents: sessionUser?.swarmAgents || config.legacySwarmAgents,
        simulationMode: config.simulationMode,
        chainId: config.chainId,
        explorerBaseUrl: config.explorerBaseUrl,
        autonomyDefaults: normalizeAutonomy({}),
        contracts: {
          staking: config.contracts.staking,
          ownerBadge: config.contracts.ownerBadge,
          usdc: config.contracts.usdc,
          mockResolver: config.contracts.mockResolver,
          reputation: config.contracts.reputation,
          bonding: config.contracts.bonding
        },
        identityRegistryAddress: config.identityRegistryAddress
      };

      let signerAddress = null;
      try {
        if (uid) {
          if (sessionUser?.onboardedAt) {
            try {
              signerAddress = await te(req).chain.signer.getAddress();
            } catch {
              signerAddress = sessionUser?.linkedWallet || null;
            }
          }
        } else if (trustEngine) {
          signerAddress = await trustEngine.chain.signer.getAddress();
        }
      } catch (_e) {
        try {
          if (!uid && trustEngine) signerAddress = await trustEngine.chain.signer.getAddress();
        } catch (_e2) {
          signerAddress = null;
        }
      }

      let veribond = null;
      try {
        const stakingAddr = config.contracts.staking;
        if (stakingAddr && ethers.isAddress(stakingAddr)) {
          const provider = new JsonRpcProvider(config.baseRpcUrl);
          const stakeContract = new Contract(stakingAddr, TRUTH_STAKE_ABI, provider);
          const [minStake, claimCount, usdcAddr, identityRegistryAddr] = await Promise.all([
            stakeContract.minStake(),
            stakeContract.getClaimCount(),
            stakeContract.usdc(),
            stakeContract.identityRegistry()
          ]);
          veribond = {
            minStakeRaw: minStake.toString(),
            minStakeUsdc: Number(minStake) / 1e6,
            claimCount: Number(claimCount),
            stakingUsdc: usdcAddr,
            identityRegistry: identityRegistryAddr
          };

          const idReg = new Contract(identityRegistryAddr, IDENTITY_REGISTRY_MIN_ABI, provider);
          const agentWalletChecks = [];
          const idMap = sessionUser?.swarmAgents || config.legacySwarmAgents;
          for (const name of agents) {
            const rawId = idMap[name];
            if (rawId === undefined || rawId === null) continue;
            const erc8004Id = typeof rawId === "bigint" ? rawId : BigInt(String(rawId));
            const expectedAgentWallet = await idReg.getAgentWallet(erc8004Id);
            const matches =
              Boolean(signerAddress) &&
              expectedAgentWallet.toLowerCase() === String(signerAddress).toLowerCase();
            agentWalletChecks.push({
              agentName: name,
              erc8004Id: erc8004Id.toString(10),
              role: name === "ConsensusAgent" ? "staking" : "swarm",
              expectedAgentWallet,
              signerAddress,
              matches,
              hint: matches
                ? null
                : "TruthStake requires msg.sender == getAgentWallet(agentId). Sign with the linked wallet used at onboarding."
            });
          }
          veribond.agentWalletChecks = agentWalletChecks;
          veribond.agentWalletAllMatch = agentWalletChecks.length > 0 && agentWalletChecks.every((c) => c.matches);
          veribond.singleWalletExpected = sessionUser?.linkedWallet || config.singleWallet;
          veribond.signerMatchesSingleWallet =
            Boolean(signerAddress) &&
            Boolean(sessionUser?.linkedWallet) &&
            String(signerAddress).toLowerCase() === String(sessionUser.linkedWallet).toLowerCase();
        }
      } catch (_e) {
        veribond = { error: "Could not read TruthStake / identity registry (check RPC and addresses)" };
      }

      res.json({
        ok: true,
        data: {
          ...base,
          signerAddress,
          veribond
        }
      });
    })
  );

  router.post(
    "/api/predy/instruct",
    asyncHandler(async (req, res) => {
      const opts = loopOptions(req);
      const result = await orchestrator.runPredictionLoop({
        userInstruction: opts.userInstruction || "Optimize my yield safely",
        autonomy: opts.autonomy,
        trustEngine: te(req)
      });
      res.json({ ok: true, data: result });
    })
  );

  router.get("/api/predy/history", (_req, res) => {
    res.json({
      ok: true,
      data: memory.getAll(),
      structured: typeof memory.getStructured === "function" ? memory.getStructured() : null
    });
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
