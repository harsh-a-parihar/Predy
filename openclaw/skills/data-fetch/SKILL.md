# Data Fetch Skill

## Purpose
Collect data signals for Predy (sentiment + on-chain micro metrics).

## Inputs
- `instruction` (string, optional): user instruction context for signal extraction.

## Outputs
- Data agent output payload from Predy.

## Behavior
1. If `PREDY_API_BASE` is set, call `POST /skill/data/fetch`.
2. Otherwise run local Node.js orchestrator fallback and return `dataOutput`.
