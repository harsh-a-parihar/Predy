#!/usr/bin/env bash
# Deploy OwnerBadge + MockResolver + TruthStake to Base Sepolia via VeriBond forge script.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CONTRACTS="$ROOT/vendor/VeriBond/contracts"
ENV_FILE="${ENV_FILE:-$ROOT/.env}"

if [[ -f "$ENV_FILE" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
fi

if [[ -z "${PRIVATE_KEY:-}" ]]; then
  echo "[deploy] ERROR: PRIVATE_KEY is empty. Set it in $ENV_FILE"
  exit 1
fi

# forge-std vm.envUint expects hex with 0x prefix
if [[ "${PRIVATE_KEY}" != 0x* ]]; then
  export PRIVATE_KEY="0x${PRIVATE_KEY}"
  echo "[deploy] Prepended 0x to PRIVATE_KEY for Foundry"
fi

RPC="${BASE_RPC_URL:-https://sepolia.base.org}"
echo "[deploy] RPC=$RPC"
echo "[deploy] Running forge script Deploy.s.sol (broadcast)..."

cd "$CONTRACTS"
forge script script/Deploy.s.sol:Deploy \
  --rpc-url "$RPC" \
  --broadcast \
  -vvv

echo "[deploy] Done. Paste addresses into ${ENV_FILE} (VERIBOND_STAKING_ADDRESS, VERIBOND_OWNER_BADGE_ADDRESS, VERIBOND_MOCK_RESOLVER_ADDRESS)"
