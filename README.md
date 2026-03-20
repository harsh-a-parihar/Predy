# Predy – Yield Prediction & Safe Execution Swarm

Transparent, economically accountable multi-agent system for stETH yield optimization with VeriBond staking.

**Registered in Synthesis 2026**  
Participant: 776401bc776d4b4eb4432604872e3ef0  
Team: 1027239e8acf49eca9699d63b29879d9  
On-chain: https://basescan.org/tx/0x2d67bc8d9b40aadeac6891d2abe1acb72a80d8db7d099c9b13e8b64094bf85c0

## Features
- Jarvis-style interactive swarm
- Internal prediction market + VeriBond staking/slashing
- Privacy via Venice + scoped safe execution
- Beautiful dashboard with history & proofs

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
6. On-chain execution smoke (0.001 USDC self-transfer; needs Base Sepolia ETH + USDC):
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
- `vendor/VeriBond/`: cloned upstream VeriBond codebase for reuse

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