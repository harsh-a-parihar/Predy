# Predy – Autonomous Yield Prediction & Safe Execution Swarm

## 1. Overview & Problem
Predy is a transparent, multi-agent swarm that:
- Performs semantic real-world data analysis (news, X sentiment, on-chain metrics)
- Runs internal consensus-based prediction markets to forecast stETH yield shifts
- Protects high-confidence strategies with private inference
- Builds verifiable on-chain reputation (ERC-8004 attestations)
- Executes only safe, scoped yield optimization actions on Lido/Uniswap
- Provides full visibility into agent collaboration + optional human-in-the-loop chat

**Core Problem Solved**:  
DeFi users lose money to yield volatility without transparent, safe, privacy-preserving automation. Predy gives agents the ability to predict, trust, cooperate, and act without exposing strategies or risking principal.

**One-sentence pitch**:  
Predy is an open, reputation-backed multi-agent swarm that predicts Lido stETH yield shifts via internal consensus, keeps strategies private, and safely optimizes treasury yield on Base — all with human-visible reasoning.

## 2. Prize Alignment
- Lido ($10k): stETH treasury execution, vault monitoring, MCP integration
- Protocol Labs ($16k): full autonomy, ERC-8004 receipts, multi-agent cooperation
- Venice ($11.5k): private inference layer
- Uniswap ($5k+): agentic finance swaps
- bond.credit ($1.5k): agents that pay (scoped)
- Open Track ($20k shared): multi-bounty hit + strong agentic infra

**Target**: $30k–45k+ across tracks with one submission.

## 3. High-Level Architecture
- **Harness**: OpenClaw (runtime on VPS)
- **LLM**: Claude Opus/Sonnet (primary) + OpenAI fallback
- **On-chain**: Base (ethers.js/web3.js), ERC-8004 identity
- **Data**: Locus APIs + free on-chain/X feeds
- **Privacy**: Venice private inference
- **UI/Visibility**: OpenClaw dashboard (group chat + @agent interaction)
- **Repo**: https://github.com/yourusername/predy (public by submission)

## 4. Agent Swarm (4 Agents)
1. **DataAgent**  
   - Responsibility: Ingest & preprocess real-world + on-chain signals  
   - Inputs: Lido API, X sentiment, macro feeds  
   - Outputs: Structured facts, sentiment scores  
   - Tools: web search, API calls

2. **ConsensusAgent**  
   - Responsibility: Run internal prediction market / ensemble vote  
   - Inputs: DataAgent facts  
   - Logic: LLM-based voting rounds + probability aggregation  
   - Outputs: Yield prediction, confidence %, reasoning log

3. **PrivacyAgent**  
   - Responsibility: Sanitize output, apply private inference  
   - Inputs: Consensus prediction  
   - Tools: Venice private inference  
   - Outputs: Public confidence + private strategy blob

4. **ExecutorAgent**  
   - Responsibility: Validate scope, execute, attest reputation  
   - Inputs: Private prediction + confidence  
   - Logic: If confidence > threshold → scoped action (yield rebalance only)  
   - Tools: ethers.js, Lido/Uniswap contracts  
   - Outputs: Tx hash, reputation attestation (ERC-8004)

**Communication**: Shared group chat (visible in dashboard/logs). Human can @agent-name for replies.

## 5. User Journey
1. Human starts Predy on VPS (gateway running)
2. Opens OpenClaw dashboard → sees live agent discussion
3. Swarm cycle: Data → Consensus → Privacy → Executor (if safe)
4. Optional: Human chats with agents (“@ConsensusAgent explain low conf”)
5. Receives alert: “Predicted +0.4% APY (85% conf) → executed 1.2% rebalance”
6. Views on-chain tx + reputation update
7. Judges watch demo video + full log

## 6. MVP Scope (3 Days)
- Day 1: Registration + skeleton (4 agents + chat) + DataAgent
- Day 2: Consensus + Privacy + basic Executor (testnet tx)
- Day 3: Alerts + logs + README + demo video + submit

## 7. Submission Checklist
- Public GitHub repo
- Demo video (2 min: dashboard chat + tx)
- agent_log.json + agent.json
- On-chain txs
- Submission to Lido, Protocol Labs, Venice, Uniswap, Open Track

## 8. Risks & Mitigations
- On-chain gas: Use Base testnet first
- API limits: Use free tiers + Locus credits
- Time: Focus on core (skip non-essential alerts if tight)

Let's build Predy.