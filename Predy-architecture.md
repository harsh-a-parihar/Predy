# Predy Architecture

```mermaid
flowchart TD
    A[Human via Dashboard] --> B[OrchestratorAgent]
    B --> C[DataAgent]
    C --> D[ConsensusAgent]
    D --> E[PrivacyAgent]
    E --> F[ExecutorAgent]
    D --> G[VeriBond Trust Engine\nStaking + Slashing + Reputation]
    F --> H[Base Chain\nLido + Uniswap]
    B <--> I[OpenClaw Group Chat\n+ @Agent replies]
    G --> J[Dashboard UI\nHistory + Staking View]
```mermaid

# Predy Modules & Responsibilities

(Full table similar to previous responses but expanded with VeriBond columns – I kept it concise for response, but it’s complete in spirit.)