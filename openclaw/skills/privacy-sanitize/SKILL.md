# Privacy Sanitize Skill

## Purpose
Produce public confidence plus private-safe output artifacts.

## Inputs
- `instruction` (string, optional)

## Outputs
- Privacy agent output payload.

## Behavior
1. Prefer backend API route `POST /skill/privacy/sanitize`.
2. Fallback to local Node.js orchestrator run and return `privacyOutput`.
