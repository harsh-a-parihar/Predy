# Consensus Predict Skill

## Purpose
Generate consensus prediction and confidence for the current instruction.

## Inputs
- `instruction` (string, optional)

## Outputs
- Consensus agent output payload.

## Behavior
1. Prefer backend API route `POST /skill/consensus/predict`.
2. Fallback to local Node.js orchestrator run and return `consensusOutput`.
