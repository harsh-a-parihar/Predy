# Predy Submission Checklist

## Tracks

- Lido
- Protocol Labs
- Venice
- Uniswap
- bond.credit
- Open Track

## Required Assets

- [x] Product README
- [x] PRD and architecture docs
- [x] Agent manifest (`agent.json`)
- [x] End-to-end runnable API
- [x] Interactive dashboard
- [x] VeriBond integration scaffold from upstream repo
- [ ] Demo video (to record)
- [ ] Final transaction proofs (testnet run with real addresses)
- [ ] Track-specific submission forms

## Demo Script (60-120s)

1. Open dashboard and show 4 agents + trust cards.
2. Trigger `Optimize my yield safely`.
3. Show live output: prediction, confidence, stake event, execution event.
4. Show `@ConsensusAgent` chat query and response.
5. Open history endpoint and show proof trail.
6. Switch to on-chain mode and run one testnet proof transaction.

## Notes

- For deterministic demo quality, use `SIMULATION_MODE=true`.
- For judge proof run, set contract addresses and use `SIMULATION_MODE=false`.
