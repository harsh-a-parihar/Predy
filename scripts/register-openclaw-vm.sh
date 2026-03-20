#!/usr/bin/env bash
set -euo pipefail

VM_NAME="${VM_NAME:-synthesis-claw-vm}"
VM_ZONE="${VM_ZONE:-asia-south1-a}"
REMOTE_ROOT="${REMOTE_ROOT:-~/predy}"
OPENCLAW_BIN="${OPENCLAW_BIN:-/home/thearchitect_harsh_gmail_com/.npm-global/bin/openclaw}"

echo "[1/4] Sync OpenClaw native skills + manifest to VM..."
gcloud compute scp --recurse "openclaw" "${VM_NAME}:${REMOTE_ROOT}/" --zone="${VM_ZONE}"
gcloud compute scp "agent.json" "${VM_NAME}:${REMOTE_ROOT}/agent.json" --zone="${VM_ZONE}"

echo "[2/4] Ensure Predy OpenClaw agent is registered..."
gcloud compute ssh "${VM_NAME}" --zone="${VM_ZONE}" --command="\
  if [ ! -x \"${OPENCLAW_BIN}\" ]; then
    echo 'OpenClaw binary not found at ${OPENCLAW_BIN}';
    exit 1;
  fi;
  ${OPENCLAW_BIN} agents list --json | python3 -c 'import json,sys; d=json.load(sys.stdin); sys.exit(0 if any(a.get(\"id\")==\"predy\" for a in d) else 1)' \
    || ${OPENCLAW_BIN} agents add predy --workspace ~/predy --non-interactive --json
"

echo "[3/4] Show current agents..."
gcloud compute ssh "${VM_NAME}" --zone="${VM_ZONE}" --command="${OPENCLAW_BIN} agents list --json"

echo "[4/4] Registration complete."
echo "Set PREDY_API_BASE in VM shell when using API-first skills, example:"
echo "  export PREDY_API_BASE=http://127.0.0.1:8787"
