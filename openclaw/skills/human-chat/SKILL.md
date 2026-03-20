# Human Chat Skill

## Purpose
Route a user message to a selected Predy agent or orchestrator.

## Inputs
- `to` (string, optional): target agent.
- `message` (string): human message.

## Outputs
- Agent-formatted chat response.

## Behavior
1. Prefer backend API route `POST /api/chat` for live feed compatibility.
2. Fallback to local Node.js chat handler.
