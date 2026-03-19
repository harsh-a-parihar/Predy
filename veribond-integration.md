# VeriBond Integration into Predy

## Why Integrate
VeriBond provides the missing economic trust layer (staking, slashing, reputation, bonding) that turns Predy from “another agent” into a verifiable, accountable product judges love.

## Integration Strategy
- Reuse your existing VeriBond contracts (staking, slashing, bonding curve, reputation registry)
- Wrap as “TrustEngine” module inside Predy
- Every ConsensusAgent prediction requires a small stake
- Correct → reward + reputation ↑ + bonding curve up
- Wrong → slash + reputation ↓ + bonding curve down
- Dashboard shows VeriBond UI (history, staking, proofs)

## Technical Integration Points
- Add VeriBond contracts to `contracts/` folder (copy + adapt)
- Create `src/trust/VeriBondEngine.js` with stake(), slash(), attest()
- Call from ExecutorAgent and ConsensusAgent
- Embed VeriBond Next.js components into dashboard for staking view

## Benefits After Integration
- Predictions have skin-in-the-game → massive trust signal
- On-chain proof of accountability → judges go crazy
- History + reputation dashboard → feels like a real product
- Directly hits “agents that trust/pay/cooperate” + reputation themes