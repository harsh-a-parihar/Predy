# Predy Submission Checklist

## Tracks

- Lido
- Protocol Labs
- Venice
- Uniswap
- bond.credit
- Open Track

## Proof & demo assets

| Asset | Link / status |
|--------|----------------|
| **Demo video** | _Placeholder — add Loom/YouTube URL before submit_ |
| **Real tx (Base Sepolia)** | Run `npm run test:execute` — prints **TruthStake.submitClaim** (ConsensusAgent, ERC-8004 id 2) + Basescan URL. Paste latest tx here. |
| **Reference (mainnet tx from README)** | https://basescan.org/tx/0x2d67bc8d9b40aadeac6891d2abe1acb72a80d8db7d099c9b13e8b64094bf85c0 |

**Note for judges:** Predy runs **fully real on-chain** against deployed **VeriBond** contracts (TruthStake, OwnerBadge, MockResolver) on Base Sepolia, with **live Venice** privacy inference and **OpenAI** reasoning in Data + Consensus agents when API keys are set (`VENICE_API_KEY`, `OPENAI_API_KEY`).

## Required Assets

- [x] Product README
- [x] PRD and architecture docs
- [x] Agent manifest (`agent.json`)
- [x] End-to-end runnable API
- [x] Interactive dashboard
- [x] VeriBond contracts vendored (slim `vendor/VeriBond/contracts`: `src/`, `script/`, `lib/`)
- [ ] Demo video (link above)
- [ ] Final transaction proofs (paste latest Base Sepolia tx in table + README)
- [ ] Track-specific submission forms

## Demo Script (60-120s)

1. Open dashboard — show **VeriBond Trust Active** banner, green **Real on-chain** badge, contract Basescan links.
2. Trigger **Run full prediction loop** (optionally toggle **You are on your own**).
3. Show agent cards, per-agent memory, prediction output with **tx links**.
4. Show `@` quick chat or click an agent card → chat feed.
5. Open `GET /api/predy/history` or scroll to history for proof trail.
6. Optional: manual Stake / Resolve with Basescan links in trust log.

## Notes

- **Production / hackathon proof:** set `SIMULATION_MODE=false`, fund Base Sepolia ETH + USDC, deploy VeriBond per `docs/DEPLOY_BASE_SEPOLIA.md`.
- `SIMULATION_MODE=true` only stubs **execution** adapters; VeriBond trust calls remain on-chain in normal config.
