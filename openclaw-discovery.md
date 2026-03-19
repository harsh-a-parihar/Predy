# OpenClaw VM Discovery Notes

VM: `synthesis-claw-vm`  
Date: 2026-03-20

## Findings

- OpenClaw state exists under `~/.openclaw`.
- Core directories present:
  - `agents/`
  - `skills/`
  - `workspace/`
  - `logs/`
- Main config file exists at `~/.openclaw/openclaw.json` with:
  - model defaults
  - workspace path
  - gateway config
  - tool profile
  - installed skill entries

## Implication for Predy

- Predy can be adapted into OpenClaw-native skills by mapping:
  - `src/agents/*` -> skill handlers
  - `agent.json` -> OpenClaw agent manifest metadata
  - `src/api/routes.js` -> gateway-facing callable endpoints

## Next OpenClaw-specific hardening

1. Add OpenClaw-native command wrappers around `/skill/*` routes.
2. Register Predy skills into the VM's OpenClaw skills directory.
3. Run Predy from OpenClaw workspace path for direct gateway integration.
