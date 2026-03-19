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
1. Copy `.env.example` to `.env`
2. Install dependencies:
   - `npm install`
3. Run API server:
   - `npm start`
4. Test core flow:
   - `POST /api/predy/instruct` with body `{ "instruction": "optimize my yield safely" }`
5. Run smoke test:
   - `npm run test:smoke`
6. Launch dashboard:
   - `cd dashboard && npm install && npm run dev`

## Architecture Implemented
- `src/orchestrator/*`: prediction loop + memory + approval gate
- `src/agents/*`: Data, Consensus, Privacy, Executor agents and micro-agents
- `src/trust/*`: VeriBond facade with modular staking/slashing/reputation/bonding
- `src/execution/*`: scope validator + chain client wrapper + Lido/Uniswap adapters
- `src/api/*`: all planned skill/trust/public endpoints
- `src/chat/*`: group + `@agent` chat routing
- `dashboard/`: Next.js command center UI for chat, prediction feed, and agent trust cards
- `vendor/VeriBond/`: cloned upstream VeriBond codebase for reuse

## OpenClaw Discovery (VM)
- OpenClaw runtime/config exists on the VM under `~/.openclaw`
- Agent defaults, tool profile, gateway config, and skills directory are present
- `openclaw` binary is installed via npm-global bin path on the VM

## VeriBond Integration Notes
- VeriBond repo used: [harsh-a-parihar/VeriBond](https://github.com/harsh-a-parihar/VeriBond.git)
- Contract APIs currently integrated through `src/trust/abis.js` + trust modules
- `SIMULATION_MODE=true` keeps hackathon demos deterministic
- Set contract addresses in `.env` and disable simulation to execute on-chain

## Deployment and Demo
- VM deploy script: `scripts/deploy-vm.sh`
- Demo flow script: `scripts/demo.sh`

Built for Synthesis 2026 to win multiple tracks.