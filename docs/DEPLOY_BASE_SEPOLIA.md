# Deploy VeriBond to Base Sepolia (Foundry)

Predy reuses the official VeriBond deploy script (`vendor/VeriBond/contracts/script/Deploy.s.sol`). It deploys **OwnerBadge**, **MockResolver**, and **TruthStake**, wired to:

| Dependency | Base Sepolia address |
|------------|----------------------|
| USDC (Circle test) | `0x036CbD53842c5426634e7929541eC2318f3dCF7e` |
| ERC-8004 Identity Registry | `0x8004A818BFB912233c491871b3d84c89A494BD9e` |
| ERC-8004 Reputation Registry | `0x8004B663056A597Dffe9eCcC1965A193B7388713` |

See [IDENTITY.md](./IDENTITY.md) for how Predy uses ERC-8004 agent NFTs vs `OwnerBadge`.

## Prerequisites

- [Foundry](https://book.getfoundry.sh/getting-started/installation) (`forge`, `cast`)
- Base Sepolia ETH on the deployer account
- **`PRIVATE_KEY` must be a hex private key with a `0x` prefix** (Foundry `vm.envUint` requires this format).

### Predy API wallet vs TruthStake (important)

`TruthStake.submitClaim` **reverts** unless `msg.sender == identityRegistry.getAgentWallet(agentId)` (custom error `UnauthorizedAgentWallet`). The Predy server signs txs with **`PRIVATE_KEY`**, so that key’s address **must** be the registered ERC-8004 agent wallet for **`VERIBOND_AGENT_ID_CONSENSUS`** (default `2`).

- Check **`GET /api/predy/status`** → `veribond.agentWalletChecks` (four rows; `agentWalletAllMatch: true` when the signer is the registered wallet for ERC-8004 ids 1–4).
- Predy locks **one shared wallet** (`PREDY_SWARM_SINGLE_WALLET`) for all four internal agents; `PRIVATE_KEY` must be that address’s key.

## Step 0 — Install Foundry libs (first time only)

```bash
cd vendor/VeriBond/contracts
forge install foundry-rs/forge-std openzeppelin/openzeppelin-contracts
forge build
```

Or from repo root:

```bash
bash scripts/deploy-veribond-base-sepolia.sh   # requires PRIVATE_KEY in .env
```

## Step 1 — Install deps & build (from repo root)

```bash
cd vendor/VeriBond/contracts
forge build
```

### Reuse existing VeriBond deployment (no broadcast)

Example addresses from `vendor/VeriBond/contracts/script/TestDeployment.s.sol` (confirm on Basescan before mainnet use):

- TruthStake `0x2bB50E9092f368A5B7491Dd905445c4FF6602D0A` — **verify on explorer** from `TestDeployment.s.sol`.

Check exact checksums in `TestDeployment.s.sol` in your clone.

## Step 2 — Deploy

The script reads **`PRIVATE_KEY`** as **`vm.envUint("PRIVATE_KEY")`**. If your key is hex, export it as a **decimal** uint for Solidity scripts, or patch the script to `vm.envUint("PRIVATE_KEY")` / `uint256(uint160(bytes20(...)))` — **simplest path**:

```bash
export PRIVATE_KEY=0xYOUR_KEY   # try this first; recent Foundry accepts hex for envUint in many setups
forge script script/Deploy.s.sol:Deploy \
  --rpc-url https://sepolia.base.org \
  --broadcast \
  -vvv
```

If `forge` errors on `PRIVATE_KEY`, convert hex key to decimal for the env var, or use:

```bash
cast wallet import predy-deployer --private-key 0xYOUR_KEY
forge script script/Deploy.s.sol:Deploy \
  --rpc-url https://sepolia.base.org \
  --broadcast \
  --account predy-deployer \
  -vvv
```

Copy from logs:

- **OwnerBadge** → `VERIBOND_OWNER_BADGE_ADDRESS`
- **TruthStake** → `VERIBOND_STAKING_ADDRESS`
- **MockResolver** → `VERIBOND_MOCK_RESOLVER_ADDRESS`

Set in Predy `.env`:

```env
VERIBOND_USDC_ADDRESS=0x036CbD53842c5426634e7929541eC2318f3dCF7e
VERIBOND_STAKING_ADDRESS=<TruthStake>
VERIBOND_OWNER_BADGE_ADDRESS=<OwnerBadge>
VERIBOND_MOCK_RESOLVER_ADDRESS=<MockResolver>
```

## Step 3 — TruthStake + ERC-8004 (critical)

`TruthStake.submitClaim` requires **`msg.sender == identityRegistry.getAgentWallet(agentId)`**.

1. Register your agent via the ERC-8004 flow (or tools in VeriBond docs).
2. Ensure **`agentId`** in Predy (`src/utils/config.js` → `agentIds.ConsensusAgent`, etc.) matches the on-chain agent whose **agent wallet** is your **`PRIVATE_KEY`** address.
3. Fund that wallet with **USDC** on Base Sepolia (faucet / bridge).

Optional: mint **OwnerBadge** from the deployer (unrelated to TruthStake staking, but used for reputation UX):

```bash
cast send <OWNER_BADGE> "mint()" --rpc-url https://sepolia.base.org --private-key 0xYOUR_KEY
```

## Step 4 — Resolve flow (MockResolver)

Before `resolve(claimId)` succeeds, the **owner** of **MockResolver** must set the outcome for the **claim hash bytes32** (same hash Predy passes to `submitClaim`, i.e. `keccak256(utf8("predy:..."))` or verify via `TruthStake.getClaim`):

```bash
cast send <MOCK_RESOLVER> "setOutcome(bytes32,bool)" <CLAIM_HASH> true \
  --rpc-url https://sepolia.base.org \
  --private-key 0xDEPLOYER_KEY
```

## Step 5 — Predy smoke

```bash
cd ../../../   # repo root
npm run test:execute   # 0.001 USDC self-transfer; needs USDC + ETH on wallet
```

See also: [EthSkills — Ship](https://ethskills.com/ship/SKILL.md) for wallet/RPC hygiene.
