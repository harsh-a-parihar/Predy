# Predy API & Endpoint Structure (Internal + Future External)

## 1. Internal OpenClaw / Skill Endpoints (Used by Agents)

- `POST /skill/data/fetch` → Returns structured facts + sentiment score  
  Payload: `{ "sources": ["lido", "x", "macro"] }`  
  Why: Decouples data ingestion (DRY)

- `POST /skill/consensus/predict` → Runs voting + returns confidence + VeriBond stake call  
  Payload: `{ "data": {...}, "stakeAmount": "0.5" }`

- `POST /skill/privacy/sanitize` → Venice private inference wrapper  
  Payload: `{ "prediction": "..." }` → Returns `{ publicConfidence, privateBlob }`

- `POST /skill/execute/action` → Scope check + tx + VeriBond reward/slash  
  Payload: `{ "action": "rebalance", "amount": "1.2", "confidence": 85 }`

- `POST /skill/human/chat` → Handles @agent replies + memory recall  
  Payload: `{ "from": "user", "to": "ConsensusAgent", "message": "..." }`

## 2. VeriBond Trust Engine Endpoints (Internal Calls)

- `POST /trust/stake` → Stake on prediction  
- `POST /trust/resolve` → Settle with slash/reward + attestation  
- `GET /trust/reputation` → Returns current score + history  
- `POST /trust/bond` → Update bonding curve on success

## 3. Future Public APIs (for startup feel)

- `GET /api/predy/status` → Dashboard data  
- `POST /api/predy/instruct` → Natural language entry point  
- `GET /api/predy/history` → Full proof + tx list  
- `POST /api/predy/stake` → Manual staking from UI

All endpoints follow REST + JSON, use environment variables, heavy validation, logging, and error handling. Connection: Orchestrator routes everything → agents call TrustEngine → Execution layer finalizes.

This design is DRY, testable, and scalable.