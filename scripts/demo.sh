#!/usr/bin/env bash
set -euo pipefail

API="${PREDY_API:-http://localhost:8787}"

echo "1) status"
curl -s "${API}/api/predy/status" | jq .

echo "2) instruct"
curl -s -X POST "${API}/api/predy/instruct" \
  -H "content-type: application/json" \
  -d '{"instruction":"Optimize my yield safely"}' | jq .

echo "3) chat with consensus agent"
curl -s -X POST "${API}/skill/human/chat" \
  -H "content-type: application/json" \
  -d '{"to":"ConsensusAgent","message":"Why this prediction?"}' | jq .

echo "4) history"
curl -s "${API}/api/predy/history" | jq .
