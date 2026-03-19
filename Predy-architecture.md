# Predy Architecture – Complete Visual & Technical Design

## 1. Overall Architecture (High-Level Flow)

```mermaid
flowchart TD
    A["Human User\n(Jarvis-style Dashboard)"] --> B["OrchestratorAgent\n(Router + Memory + Approvals)"]
    B <--> C[Live Group Chat\nOpenClaw Dashboard + @Agent]
    B --> D[DataAgent\n+ Micro-agents]
    D --> E[ConsensusAgent\n+ VeriBond Staking Vote]
    E --> F[PrivacyAgent\nVenice Private Inference]
    F --> G[ExecutorAgent\nScope Check + Action]
    G --> H[VeriBond Trust Engine\nStake / Slash / Bond / Attest / Reputation]
    G --> I[Base Chain\nLido + Uniswap + ERC-8004]
    H --> J[Beautiful Dashboard\nStaking UI + History + Proofs + Recommendations]
    J <--> A
    subgraph "Micro-Agentic Layer"
        D1[SentimentMicro]
        D2[OnChainMicro]
        E1[VoteMicro]
        E2[ProbabilityMicro]
    end
```

## 2. Componential Architecture (Layered View)

```mermaid
flowchart TB
 subgraph UI["UI"]
        Dashboard["VeriBond Next.js Dashboard + Chat"]
  end
 subgraph Orchestration["Orchestration"]
        Orchestrator["OrchestratorAgent + Memory"]
  end
 subgraph Swarm["Swarm"]
        Consensus["ConsensusAgent"]
        Data["DataAgent"]
        Privacy["PrivacyAgent"]
        Executor["ExecutorAgent"]
  end
 subgraph Trust["Trust"]
        VeriBond["VeriBond Engine\nStaking + Slashing + Bonding + Reputation"]
  end
 subgraph Execution["Execution"]
        Chain["Base + Lido + Uniswap + ERC-8004"]
  end
    Data --> Consensus
    Consensus --> Privacy
    Privacy --> Executor
    Dashboard <--> Orchestrator
    Orchestrator <--> Data
    Executor <--> VeriBond & Chain
```

## 3. Modular Architecture (Clean Code View)

```mermaid
mindmap
  root((Predy))
    Orchestrator
      SessionManager
      ApprovalHandler
      MemoryLayer
    Agents
      DataAgent
      ConsensusAgent
      PrivacyAgent
      ExecutorAgent
    TrustEngine
      VeriBondStaking
      SlashingLogic
      BondingCurve
      ReputationAttest
    Execution
      EthersWrapper
      LidoVault
      UniswapSwap
      ScopeValidator
    UI
      DashboardReact
      ChatUI
      HistoryViewer
```

## 4. Dataflow Architecture (End-to-End Cycle)

```mermaid
sequenceDiagram
    participant H as Human
    participant O as Orchestrator
    participant D as DataAgent
    participant C as Consensus
    participant P as Privacy
    participant E as Executor
    participant V as VeriBond
    participant Ch as Chain

    H->>O: Optimize my yield safely
    O->>D: Fetch signals
    D->>C: Raw data
    C->>V: Stake on prediction
    C->>P: Consensus result
    P->>E: Private version
    E->>V: Execute + slash/reward
    E->>Ch: Safe Lido/Uniswap tx
    Ch->>O: Tx hash + proof
    O->>H: Alert + Dashboard update + History
```

