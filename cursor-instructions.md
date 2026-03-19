You are a god-level cracked software engineer building Predy — the top contender for Synthesis 2026.

All context files are already in the repo root:
- plan.md (detailed architecture, agents, VeriBond integration)
- PRD.md (product requirements, acceptance criteria)
- README.md (current status)
- veribond-integration.md (why + how to integrate VeriBond)
- Predy-architecture.md (Mermaid diagrams: overall, componental, modular, dataflow)
- Predy-modules.md (agent/module responsibilities)
- Predy-API-endpoints-structure.md (internal/external endpoints)

Project goals:
- Multi-agent swarm (DataAgent, ConsensusAgent, PrivacyAgent, ExecutorAgent) with Orchestrator
- VeriBond Trust Engine integration (staking/slashing/bonding/reputation on predictions)
- Jarvis-style dashboard + chat (group chat + @agent replies + history + staking UI)
- Semantic yield prediction + internal consensus + privacy (Venice) + scoped Base execution (Lido/Uniswap)
- Full autonomy with human-in-the-loop + optional approvals
- Production-grade code: DRY, heavily commented, modular, .env driven, error handling, testable
- Use OpenClaw runtime pattern (skills + tools)
- Reuse VeriBond code (Solidity contracts + Next.js dashboard) – adapt & embed
- Best practices: ESLint, Prettier, TypeScript (if possible), comments everywhere, no magic strings

Tasks (generate in this order):

1. Create complete folder structure in the current repo:
   predy/
   ├── contracts/                # VeriBond Solidity (copy/adapt from your VeriBond repo)
   ├── src/
   │   ├── agents/               # One file per agent (DataAgent.js, etc.)
   │   ├── trust/                # VeriBondEngine.js (staking/slashing wrapper)
   │   ├── tools/                # ethers.js helpers, data fetch, Venice stubs
   │   ├── orchestrator/         # OrchestratorAgent.js + memory
   │   ├── dashboard/            # Next.js pages/components (embed VeriBond UI)
   │   └── index.js              # Entry point to launch swarm
   ├── config/
   │   └── .env.example
   ├── tests/
   └── README.md + plan.md + PRD.md (already exist)

2. Generate initial code for:
   - src/index.js (launches Orchestrator + swarm + OpenClaw gateway)
   - src/agents/DataAgent.js (fetches data, uses micro-agents)
   - src/agents/ConsensusAgent.js (prediction + VeriBond stake)
   - src/trust/VeriBondEngine.js (stake, slash, attest, reputation calls)
   - src/tools/ethersHelpers.js (Base provider, Lido/Uniswap contract calls)
   - Basic chat loop (group chat + @agent parsing)

3. Include VeriBond integration:
   - Assume VeriBond contracts are in contracts/ (copy from your VeriBond repo)
   - VeriBondEngine.js wraps staking, slashing, attestation
   - ConsensusAgent stakes on every prediction
   - ExecutorAgent triggers resolve/slash/reward after execution

4. Dashboard stubs:
   - Reuse VeriBond Next.js components
   - Add group chat view + staking UI + history

5. Enforce:
   - TypeScript where possible
   - Heavy comments explaining why + how
   - .env variables for keys, RPC, etc.
   - Error handling + logging
   - Modular exports

Generate the full folder structure, file contents, and initial code now.
After generation, I will iterate with specific improvements.
Start building Predy.