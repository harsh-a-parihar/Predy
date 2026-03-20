"use client";

import { useEffect, useMemo, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_PREDY_API || "http://localhost:8787";
const EXPLORER_BASE =
  (process.env.NEXT_PUBLIC_BASE_EXPLORER_URL || "https://sepolia.basescan.org").replace(/\/$/, "");

function addressExplorerHref(addr) {
  if (!addr || !/^0x[a-fA-F0-9]{40}$/.test(String(addr).trim())) return null;
  return `${EXPLORER_BASE}/address/${String(addr).trim()}`;
}

function txExplorerHref(hash) {
  if (!hash || String(hash).startsWith("SIMULATED")) return null;
  const h = String(hash).trim();
  if (!/^0x[a-fA-F0-9]{64}$/.test(h)) return null;
  return `${EXPLORER_BASE}/tx/${h}`;
}

/**
 * Collect Basescan tx links only from known tx fields (avoid false positives from bytes32 claimId / stakeId).
 */
function collectTransactionLinks(root, prefix = "") {
  const out = [];
  const seen = new Set();

  function add(label, v) {
    if (typeof v !== "string") return;
    const href = txExplorerHref(v);
    if (!href || seen.has(v)) return;
    seen.add(v);
    out.push({ label, hash: v, href });
  }

  function walk(node, path) {
    if (node === null || node === undefined) return;
    if (typeof node !== "object") return;
    if (Array.isArray(node)) {
      node.forEach((item, i) => walk(item, `${path}[${i}]`));
      return;
    }
    for (const [k, v] of Object.entries(node)) {
      const p = path ? `${path}.${k}` : k;
      const kl = k.toLowerCase();
      if (typeof v === "string") {
        if (/txhash|transactionhash|transaction_hash/.test(kl)) {
          add(p, v);
        } else if (kl === "hash" && /receipt/i.test(p)) {
          add(p, v);
        }
      } else if (typeof v === "object" && v !== null) {
        walk(v, p);
      }
    }
  }

  walk(root, prefix);
  return out;
}

function ContractLinkRow({ label, address }) {
  const href = addressExplorerHref(address);
  if (!address) {
    return (
      <div style={{ marginBottom: 6 }}>
        <span style={{ opacity: 0.75 }}>{label}: </span>—
      </div>
    );
  }
  return (
    <div style={{ marginBottom: 6 }}>
      <span style={{ opacity: 0.85 }}>{label}: </span>
      {href ? (
        <a href={href} target="_blank" rel="noreferrer" style={{ wordBreak: "break-all" }}>
          {address}
        </a>
      ) : (
        <span>{address}</span>
      )}
    </div>
  );
}

function TxLinkList({ items, fullHash = true }) {
  if (!items?.length) return null;
  return (
    <ul style={{ margin: "6px 0 0", paddingLeft: 18, fontSize: 13 }}>
      {items.map(({ label, hash, href }) => (
        <li key={`${label}-${hash}`} style={{ marginBottom: 4 }}>
          <span style={{ opacity: 0.8 }}>{label}: </span>
          <a href={href} target="_blank" rel="noreferrer" style={{ wordBreak: "break-all" }}>
            {fullHash ? hash : `${hash.slice(0, 16)}…`}
          </a>
        </li>
      ))}
    </ul>
  );
}

async function call(path, method = "GET", body = null) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: { "content-type": "application/json" },
    body: body ? JSON.stringify(body) : undefined
  });
  if (!res.ok) {
    throw new Error(`Request failed (${res.status}): ${path}`);
  }
  return res.json();
}

export default function Home() {
  const [instruction, setInstruction] = useState("optimize my yield safely");
  const [status, setStatus] = useState(null);
  const [history, setHistory] = useState([]);
  const [result, setResult] = useState(null);
  const [chat, setChat] = useState([]);
  const [stakingForm, setStakingForm] = useState({
    agentId: "ConsensusAgent",
    predictionId: "",
    amount: "1",
    confidence: "0.7",
    stakeId: "",
    isCorrect: true
  });
  const [trustOps, setTrustOps] = useState([]);
  const [agentScores, setAgentScores] = useState({});
  const [uiError, setUiError] = useState("");

  const predictionTxLinks = useMemo(() => collectTransactionLinks(result || {}, "prediction"), [result]);

  const cards = useMemo(() => {
    const agents = status?.data?.agents || [];
    return agents.map((name) => {
      const score = agentScores[name];
      return {
        name,
        score: score?.score ?? 50,
        source: score?.source ?? "local"
      };
    });
  }, [status, agentScores]);

  async function refresh() {
    try {
      setUiError("");
      const [s, h] = await Promise.all([call("/api/predy/status"), call("/api/predy/history")]);
      setStatus(s);
      setHistory(h?.data || []);

      let c;
      try {
        c = await call("/api/chat");
      } catch (_error) {
        c = await call("/api/predy/chat");
      }
      setChat(c?.data || []);

      const agents = s?.data?.agents || [];
      const reps = await Promise.all(
        agents.map(async (agentId) => {
          try {
            const rep = await call(`/trust/reputation?agentId=${encodeURIComponent(agentId)}`);
            return [agentId, rep?.data || { score: 50, source: "fallback" }];
          } catch (_error) {
            return [agentId, { score: 50, source: "error" }];
          }
        })
      );
      setAgentScores(Object.fromEntries(reps));
    } catch (error) {
      setUiError(error?.message || "Failed to refresh dashboard data.");
    }
  }

  async function runCycle() {
    try {
      setUiError("");
      const data = await call("/api/predy/instruct", "POST", { instruction });
      setResult(data?.data || null);
      await refresh();
    } catch (error) {
      setUiError(error?.message || "Prediction loop failed.");
    }
  }

  async function sendChat(to) {
    const payload = { to, message: instruction };
    try {
      await call("/api/chat", "POST", payload);
    } catch (_error) {
      await call("/api/predy/chat", "POST", payload);
    }
    await refresh();
  }

  async function trustAction(path, body) {
    try {
      setUiError("");
      const response = await call(path, "POST", body);
      setTrustOps((prev) =>
        [
          {
            id: `${path}-${Date.now()}`,
            path,
            body,
            response: response?.data || response,
            ts: new Date().toISOString()
          },
          ...prev
        ].slice(0, 12)
      );
      await refresh();
    } catch (error) {
      setUiError(error?.message || `${path} failed`);
    }
  }

  function applyStakingForm(key, value) {
    setStakingForm((prev) => ({ ...prev, [key]: value }));
  }

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 3000);
    return () => clearInterval(interval);
  }, []);

  const contracts = status?.data?.contracts || {};
  const vb = status?.data?.veribond;

  return (
    <main style={{ maxWidth: 1200, margin: "0 auto", padding: 24 }}>
      <h1 style={{ marginTop: 0 }}>Predy Command Center</h1>
      <p style={{ opacity: 0.8, marginTop: 4 }}>
        Interactive multi-agent dashboard with VeriBond trust state. Explorer:{" "}
        <a href={EXPLORER_BASE} target="_blank" rel="noreferrer">
          {EXPLORER_BASE}
        </a>
      </p>
      {uiError ? (
        <div style={{ background: "#3A1520", border: "1px solid #8A2D46", color: "#FFDCE5", padding: 10, borderRadius: 8, marginBottom: 12 }}>
          {uiError}
        </div>
      ) : null}

      <section style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
        <div style={{ background: "#121A32", borderRadius: 12, padding: 16 }}>
          <h3 style={{ marginTop: 0 }}>Human Input</h3>
          <input
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            style={{
              width: "100%",
              padding: 10,
              borderRadius: 8,
              border: "1px solid #2E3B66",
              background: "#0E1430",
              color: "#E6ECFF"
            }}
          />
          <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
            <button onClick={runCycle}>Run Full Prediction Loop</button>
            <button onClick={() => sendChat("ConsensusAgent")}>@ConsensusAgent</button>
            <button onClick={() => sendChat("DataAgent")}>@DataAgent</button>
            <button onClick={() => sendChat("ExecutorAgent")}>@ExecutorAgent</button>
          </div>
        </div>

        <div style={{ background: "#121A32", borderRadius: 12, padding: 16 }}>
          <h3 style={{ marginTop: 0 }}>System Status</h3>
          <div>API: {status?.ok ? "online" : "unknown"}</div>
          <div>Chain ID: {status?.data?.chainId ?? "—"}</div>
          <div>Execution mode: {status?.data?.simulationMode ? "simulation" : "on-chain"}</div>
          <div>
            Signer:{" "}
            {status?.data?.signerAddress ? (
              <a href={addressExplorerHref(status.data.signerAddress) || "#"} target="_blank" rel="noreferrer">
                {status.data.signerAddress}
              </a>
            ) : (
              "—"
            )}
          </div>
          <div>Events: {history.length}</div>
          {vb && !vb.error ? (
            <div style={{ marginTop: 8, fontSize: 13, opacity: 0.9 }}>
              <div>TruthStake min stake (USDC): {vb.minStakeUsdc}</div>
              <div>Claims on-chain: {vb.claimCount}</div>
              {vb.stakingUsdc ? (
                <div>
                  USDC (from TruthStake):{" "}
                  <a href={addressExplorerHref(vb.stakingUsdc) || "#"} target="_blank" rel="noreferrer">
                    {vb.stakingUsdc}
                  </a>
                </div>
              ) : null}
            </div>
          ) : vb?.error ? (
            <div style={{ marginTop: 8, color: "#ffb4c0", fontSize: 13 }}>{vb.error}</div>
          ) : null}
        </div>
      </section>

      <section style={{ marginTop: 16 }}>
        <div style={{ background: "#121A32", borderRadius: 12, padding: 16 }}>
          <h3 style={{ marginTop: 0 }}>VeriBond contracts (from server config → Basescan)</h3>
          <p style={{ opacity: 0.75, fontSize: 13, marginTop: 0 }}>
            Addresses come from <code>/api/predy/status</code> (your <code>.env</code> on the API server).
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, fontSize: 13 }}>
            <div>
              <ContractLinkRow label="TruthStake (staking)" address={contracts.staking} />
              <ContractLinkRow label="OwnerBadge" address={contracts.ownerBadge} />
              <ContractLinkRow label="MockResolver" address={contracts.mockResolver} />
            </div>
            <div>
              <ContractLinkRow label="USDC (env)" address={contracts.usdc} />
              <ContractLinkRow label="Reputation (optional)" address={contracts.reputation} />
              <ContractLinkRow label="Bonding (optional)" address={contracts.bonding} />
            </div>
          </div>
        </div>
      </section>

      <section style={{ marginTop: 16, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        {cards.map((c) => (
          <div key={c.name} style={{ background: "#121A32", borderRadius: 12, padding: 12 }}>
            <div style={{ fontWeight: 700 }}>{c.name}</div>
            <div style={{ opacity: 0.85 }}>Reputation: {c.score}</div>
            <div style={{ opacity: 0.65, fontSize: 12 }}>Source: {c.source}</div>
          </div>
        ))}
      </section>

      <section style={{ marginTop: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={{ background: "#121A32", borderRadius: 12, padding: 16 }}>
          <h3 style={{ marginTop: 0 }}>Latest prediction — transactions (Basescan)</h3>
          {result ? (
            <div style={{ fontSize: 14, marginBottom: 10 }}>
              {predictionTxLinks.length ? (
                <TxLinkList items={predictionTxLinks} fullHash />
              ) : (
                <div style={{ opacity: 0.75 }}>No <code>txHash</code> / <code>transactionHash</code> fields in this result yet.</div>
              )}
            </div>
          ) : (
            <div style={{ opacity: 0.75 }}>Run a prediction cycle to see tx links.</div>
          )}
          <h4 style={{ marginBottom: 8 }}>Raw JSON</h4>
          <pre style={{ whiteSpace: "pre-wrap", margin: 0, opacity: 0.95, fontSize: 11 }}>
            {result ? JSON.stringify(result, null, 2) : "No cycle executed yet."}
          </pre>
        </div>
        <div style={{ background: "#121A32", borderRadius: 12, padding: 16 }}>
          <h3 style={{ marginTop: 0 }}>Live Chat Feed (/api/chat polling)</h3>
          {chat.length === 0 ? <div>No chat messages yet.</div> : null}
          {chat.map((m, i) => (
            <div key={m?.id || i} style={{ padding: "8px 0", borderBottom: "1px solid #1D274B" }}>
              <div style={{ fontWeight: 700 }}>{m?.agent}</div>
              <div style={{ opacity: 0.9 }}>{m?.message}</div>
              <div style={{ opacity: 0.6, fontSize: 12 }}>{m?.timestamp}</div>
            </div>
          ))}
        </div>
      </section>

      <section style={{ marginTop: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={{ background: "#121A32", borderRadius: 12, padding: 16 }}>
          <h3 style={{ marginTop: 0 }}>VeriBond Staking Controls</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <input
              value={stakingForm.agentId}
              onChange={(e) => applyStakingForm("agentId", e.target.value)}
              placeholder="agentId"
            />
            <input
              value={stakingForm.predictionId}
              onChange={(e) => applyStakingForm("predictionId", e.target.value)}
              placeholder="predictionId (optional)"
            />
            <input
              value={stakingForm.amount}
              onChange={(e) => applyStakingForm("amount", e.target.value)}
              placeholder="amount"
            />
            <input
              value={stakingForm.confidence}
              onChange={(e) => applyStakingForm("confidence", e.target.value)}
              placeholder="confidence 0-1"
            />
            <input
              value={stakingForm.stakeId}
              onChange={(e) => applyStakingForm("stakeId", e.target.value)}
              placeholder="stakeId for resolve"
            />
            <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <input
                type="checkbox"
                checked={stakingForm.isCorrect}
                onChange={(e) => applyStakingForm("isCorrect", e.target.checked)}
              />
              isCorrect
            </label>
          </div>
          <p style={{ opacity: 0.75, fontSize: 13, marginTop: 0 }}>
            Stake sends <code>TruthStake.submitClaim</code>. Resolve needs <code>MockResolver.setOutcome</code> for the claim hash.
          </p>
          <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
            <button
              onClick={() =>
                trustAction("/trust/stake", {
                  agentId: stakingForm.agentId,
                  predictionId: stakingForm.predictionId || `manual-${Date.now()}`,
                  amount: Math.max(1, Number(stakingForm.amount)),
                  confidence: Number(stakingForm.confidence)
                })
              }
            >
              Stake
            </button>
            <button
              onClick={() =>
                trustAction("/trust/resolve", {
                  agentId: stakingForm.agentId,
                  predictionId: stakingForm.predictionId || `manual-${Date.now()}`,
                  stakeId: stakingForm.stakeId || null,
                  isCorrect: stakingForm.isCorrect
                })
              }
            >
              Resolve
            </button>
            <button
              onClick={() =>
                trustAction("/trust/bond", {
                  agentId: stakingForm.agentId,
                  success: stakingForm.isCorrect
                })
              }
            >
              Bond Update
            </button>
          </div>
        </div>

        <div style={{ background: "#121A32", borderRadius: 12, padding: 16 }}>
          <h3 style={{ marginTop: 0 }}>Prediction history — tx links</h3>
          {history.length === 0 ? <div>No events yet.</div> : null}
          {history.slice().reverse().slice(0, 20).map((event, idx) => {
            const payload = event?.result ?? event;
            const txs = collectTransactionLinks(payload, event?.type || "history");
            return (
              <div key={`${event?.timestamp || ""}-${idx}`} style={{ padding: "10px 0", borderBottom: "1px solid #1D274B" }}>
                <div style={{ fontWeight: 700 }}>{event?.type || event?.event || "event"}</div>
                <div style={{ opacity: 0.8, fontSize: 12 }}>{event?.timestamp}</div>
                {event?.predictionId ? (
                  <div style={{ fontSize: 11, opacity: 0.65 }}>predictionId: {event.predictionId}</div>
                ) : null}
                <TxLinkList items={txs} fullHash />
                {!txs.length && event?.type === "prediction_completed" ? (
                  <div style={{ fontSize: 12, opacity: 0.6 }}>No tx hashes stored on this event (check raw payload below).</div>
                ) : null}
              </div>
            );
          })}
        </div>
      </section>

      <section style={{ marginTop: 16 }}>
        <div style={{ background: "#121A32", borderRadius: 12, padding: 16 }}>
          <h3 style={{ marginTop: 0 }}>Trust operations — Basescan tx links</h3>
          {trustOps.length === 0 ? (
            <div>No trust actions sent yet.</div>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {trustOps.map((op) => {
                const txs = collectTransactionLinks(op.response || {}, op.path);
                return (
                  <li key={op.id} style={{ borderBottom: "1px solid #1D274B", padding: "12px 0" }}>
                    <div style={{ fontWeight: 700 }}>{op.path}</div>
                    <div style={{ fontSize: 12, opacity: 0.75 }}>{op.ts}</div>
                    <TxLinkList items={txs} fullHash />
                    {!txs.length ? <span style={{ opacity: 0.7 }}>No txHash in API response (bond may be noop).</span> : null}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>
    </main>
  );
}
