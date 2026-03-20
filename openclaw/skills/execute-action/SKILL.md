# Execute Action Skill

## Purpose
Run scoped execution action for Predy and return transaction/resolution output.

## Inputs
- `instruction` (string, optional)

## Outputs
- Executor agent output payload.

## Behavior
1. Prefer backend API route `POST /skill/execute/action`.
2. Fallback to local Node.js orchestrator run and return `executorOutput`.
