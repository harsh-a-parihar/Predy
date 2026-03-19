"use client";

import { useEffect, useMemo, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_PREDY_API || "http://localhost:8787";

async function call(path, method = "GET", body = null) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: { "content-type": "application/json" },
    body: body ? JSON.stringify(body) : undefined
  });
  return res.json();
}

export default function Home() {
  const [instruction, setInstruction] = useState("optimize my yield safely");
  const [status, setStatus] = useState(null);
  const [history, setHistory] = useState([]);
  const [result, setResult] = useState(null);
  const [chat, setChat] = useState([]);

  const cards = useMemo(() => {
    const agents = status?.data?.agents || [];
    return agents.map((a) => ({ name: a, score: a === "ConsensusAgent" ? 55 : 50 }));
  }, [status]);

  async function refresh() {
    const [s, h] = await Promise.all([call("/api/predy/status"), call("/api/predy/history")]);
    setStatus(s);
    setHistory(h?.data || []);
  }

  async function runCycle() {
    const data = await call("/api/predy/instruct", "POST", { instruction });
    setResult(data?.data || null);
    await refresh();
  }

  async function sendChat(to) {
    const payload = { to, message: instruction };
    const data = await call("/skill/human/chat", "POST", payload);
    setChat((prev) => [data?.data, ...prev].slice(0, 12));
  }

  useEffect(() => {
    refresh();
  }, []);

  return (
    <main style={{ maxWidth: 1200, margin: "0 auto", padding: 24 }}>
      <h1 style={{ marginTop: 0 }}>Predy Command Center</h1>
      <p style={{ opacity: 0.8, marginTop: 4 }}>
        Interactive multi-agent dashboard with VeriBond trust state.
      </p>

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
          <div>Mode: {status?.data?.simulationMode ? "simulation" : "on-chain"}</div>
          <div>Events: {history.length}</div>
        </div>
      </section>

      <section style={{ marginTop: 16, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        {cards.map((c) => (
          <div key={c.name} style={{ background: "#121A32", borderRadius: 12, padding: 12 }}>
            <div style={{ fontWeight: 700 }}>{c.name}</div>
            <div style={{ opacity: 0.85 }}>Reputation: {c.score}</div>
          </div>
        ))}
      </section>

      <section style={{ marginTop: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={{ background: "#121A32", borderRadius: 12, padding: 16 }}>
          <h3 style={{ marginTop: 0 }}>Latest Prediction</h3>
          <pre style={{ whiteSpace: "pre-wrap", margin: 0, opacity: 0.95 }}>
            {result ? JSON.stringify(result, null, 2) : "No cycle executed yet."}
          </pre>
        </div>
        <div style={{ background: "#121A32", borderRadius: 12, padding: 16 }}>
          <h3 style={{ marginTop: 0 }}>Group Chat / @agent</h3>
          {chat.length === 0 ? <div>No chat messages yet.</div> : null}
          {chat.map((m, i) => (
            <div key={m?.id || i} style={{ padding: "8px 0", borderBottom: "1px solid #1D274B" }}>
              <div style={{ fontWeight: 700 }}>{m?.agent}</div>
              <div style={{ opacity: 0.9 }}>{m?.message}</div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
