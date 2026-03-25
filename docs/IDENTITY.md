# Agent identity on Predy (ERC-8004 vs OwnerBadge)

## ERC-8004 Identity Registry (5 swarm agents)

Onboarding calls `IdentityRegistry.register(agentURI)` **five times** (Orchestrator + four agents). Each call mints an **ERC-721 Agent Identity** token; the **token ID** returned by the registry (e.g. `2726`) is the live on-chain identifier — it is **not** a placeholder.

- **Where to verify:** Base Sepolia explorer → contract **8004: Identity Registry** → ERC-721 transfer / token view.
- **In the app:** Swarm Agents tab links to BaseScan per token ID and shows the **register transaction** hash when available.

## OwnerBadge (`VERIBOND_OWNER_BADGE_ADDRESS`)

`vendor/VeriBond/contracts/src/identity/OwnerBadge.sol` implements a **single soulbound badge per wallet** (`mint()` once). It is **not** used to mint five role-specific agents. VeriBond reputation may still reference OwnerBadge alongside TruthStake; do not conflate it with per-agent ERC-8004 IDs.

## Wallet UX

MetaMask (and most EOAs) require **one confirmation per transaction**. Batching five `register` calls into a single user signature needs a **multicall / batch contract** or wallet support (e.g. advanced batching); Predy currently uses five sequential transactions by design.
