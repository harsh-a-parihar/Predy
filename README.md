# Predy – Yield Prediction & Safe Execution Swarm

Transparent, economically accountable multi-agent system for stETH yield optimization with VeriBond staking.

**Registered in Synthesis 2026**  
Participant: 776401bc776d4b4eb4432604872e3ef0  
Team: 1027239e8acf49eca9699d63b29879d9  

**On-chain proofs**
- Mainnet reference tx: https://basescan.org/tx/0x2d67bc8d9b40aadeac6891d2abe1acb72a80d8db7d099c9b13e8b64094bf85c0  
- **Base Sepolia:** run `npm run test:execute` — submits a real **TruthStake.submitClaim** for **ConsensusAgent (ERC-8004 id 2)** using the shared swarm wallet; console prints `txHash` + Basescan URL.

**Swarm architecture (locked):** team id `1027239e8acf49eca9699d63b29879d9` · four internal agents (ERC-8004 ids **1–4**) · one shared wallet — see `config.swarmAgents` / `GET /api/predy/status` → `team` + `veribond.agentWalletChecks`.

**Demo video:** _add Loom/YouTube link before submission_ (see `SUBMISSION.md`).

**Stack note:** Fully **real on-chain** against deployed **VeriBond** contracts on Base Sepolia, plus **live Venice** (`VENICE_API_KEY`) and **OpenAI** reasoning (`OPENAI_API_KEY`) when configured.

## Features
- Jarvis-style interactive swarm
- Internal prediction market + VeriBond staking/slashing
- Privacy via Venice + scoped safe execution
- Beautiful dashboard with history & proofs

### Production-style agent stack (optional API keys)
- **Per-agent memory**: `MemoryHub` keeps global events plus a `SessionMemory` per agent (`DataAgent`, `ConsensusAgent`, `PrivacyAgent`, `ExecutorAgent`). `GET /api/predy/history` returns a flat timeline plus `structured` (per-agent arrays).
- **OpenAI** (`OPENAI_API_KEY`): **DataAgent** sentiment (JSON + rationale) and **ConsensusAgent** internal prediction market (3 voters + semantic analysis + aggregate reasoning). Without a key, deterministic fallbacks run.
- **Lido APR**: **DataAgent** pulls live stETH APR from `https://eth-api.lido.fi/v1/protocol/steth/apr` (last page / latest sample).
- **Venice** (`VENICE_API_KEY`, optional `VENICE_MODEL` / `VENICE_API_BASE_URL`): **PrivacyAgent** private inference + JSON envelope for `publicConfidence`, `publicSummary`, `privateBlob`, `privacyNotes`.
- **Autonomy**: Default **95%** autonomous behaviour in supervised mode (`AUTONOMY_AUTO_APPROVE_PERCENT`): when public confidence is &lt; 55%, the loop still proceeds without pausing **95%** of the time. Toggle **full autonomy** (dashboard or `fullAutonomy: true` on `/api/predy/instruct`) for “you are on your own” (never pause for low confidence).

## Quick Start
1. Copy `.env.example` to `.env` and set **`PRIVATE_KEY`**, **VeriBond addresses** (see `docs/DEPLOY_BASE_SEPOLIA.md`).
2. Install dependencies:
   - `npm install`
3. Run API server:
   - `npm start`
4. Test core flow:
   - `POST /api/predy/instruct` with body `{ "instruction": "optimize my yield safely" }`
5. Run smoke test:
   - `npm run test:smoke`
6. On-chain staking proof (ConsensusAgent stake on TruthStake; needs Base Sepolia ETH + USDC + registry-aligned `PRIVATE_KEY`):
   - `npm run test:execute`
7. Launch dashboard:
   - `cd dashboard && npm install && npm run dev`

## Architecture Implemented
- `src/orchestrator/*`: prediction loop + memory + approval gate
- `src/agents/*`: Data, Consensus, Privacy, Executor agents and micro-agents
- `src/trust/*`: VeriBond facade with modular staking/slashing/reputation/bonding
- `src/execution/*`: scope validator + chain client wrapper + Lido/Uniswap adapters
- `src/api/*`: all planned skill/trust/public endpoints
- `src/chat/*`: group + `@agent` chat routing
- `openclaw/skills/*`: OpenClaw-native skill folders (`SKILL.md` + `handler.js`) with local fallback
- `dashboard/`: Next.js command center UI for chat, prediction feed, and agent trust cards
- `vendor/VeriBond/`: slim VeriBond checkout (**`contracts/`** only: `src/`, `script/`, `lib/`, Foundry config) + README; frontend/auction extras removed

## OpenClaw Discovery (VM)
- OpenClaw runtime/config exists on the VM under `~/.openclaw`
- Agent defaults, tool profile, gateway config, and skills directory are present
- `openclaw` binary is installed via npm-global bin path on the VM

## OpenClaw Native Skills (Predy)
- Native skills live under `openclaw/skills/*` with `SKILL.md` + `handler.js`.
- Handlers are API-first (`PREDY_API_BASE`) and fallback to local Node runtime if API is unavailable.
- Register/sync on VM:
  - `bash scripts/register-openclaw-vm.sh`
- Manual verification on VM:
  - `~/.npm-global/bin/openclaw agents list --json`
  - ensure `predy` agent workspace is `/home/thearchitect_harsh_gmail_com/predy`

## VeriBond Integration Notes
- VeriBond repo used: [harsh-a-parihar/VeriBond](https://github.com/harsh-a-parihar/VeriBond.git)
- Deploy TruthStake + OwnerBadge + MockResolver to **Base Sepolia**: `docs/DEPLOY_BASE_SEPOLIA.md`
- Trust engine uses **real** `TruthStake` / `OwnerBadge` calls (no simulation fallback).
- `SIMULATION_MODE` only affects **execution** adapters (Lido/Uniswap stubs); stake/resolve/reputation are on-chain.

## Ethereum reference
- [EthSkills index](https://ethskills.com/SKILL.md) — RPC, wallets, L2s, standards.

## Deployment and Demo
- VM deploy script: `scripts/deploy-vm.sh`
- Demo flow script: `scripts/demo.sh`

Built for Synthesis 2026 to win multiple tracks.