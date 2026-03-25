"use client";

import clsx from "clsx";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BrowserProvider } from "ethers";
import { buildPredyLinkMessage } from "../lib/predyMessage.js";
import { registerSwarmWithBrowserWallet } from "../lib/registerSwarmBrowser.js";
import { connectInjected, fetchEthBalance, fetchUsdcBalance, getInjectedProvider } from "../lib/eth.js";

const API_BASE = process.env.NEXT_PUBLIC_PREDY_API || "http://localhost:8787";
const EXPLORER =
  (process.env.NEXT_PUBLIC_BASE_EXPLORER_URL || "https://sepolia.basescan.org").replace(/\/$/, "");

const MAIN_TABS = [
  { id: "overview", label: "Overview" },
  { id: "swarm", label: "Swarm Agents" },
  { id: "trade", label: "Trade & Execute" },
  { id: "history", label: "History" },
  { id: "settings", label: "Settings" }
];

const SIDEBAR = [
  { id: "dashboard", label: "Dashboard", tab: "overview" },
  { id: "my-swarm", label: "My Swarm", tab: "swarm" },
  { id: "predictions", label: "Predictions", tab: "trade" },
  { id: "history", label: "History", tab: "history" },
  { id: "wallet", label: "Wallet & Security", tab: "settings" },
  { id: "settings", label: "Settings", tab: "settings" }
];

const BG_OPTIONS = [
  { value: "defi", label: "DeFi / yield" },
  { value: "trading", label: "Trading" },
  { value: "research", label: "Research" },
  { value: "other", label: "Other" }
];

const EXP_OPTIONS = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" }
];

function IconHome({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
    </svg>
  );
}
function IconHex({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
    </svg>
  );
}
function IconChart({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  );
}
function IconClock({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
function IconWallet({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m0 0a2.25 2.25 0 012.25-2.25H15a3 3 0 110 6H5.25A2.25 2.25 0 013 12z" />
    </svg>
  );
}
function IconCog({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.37.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.144-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}
function IconPanel({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M18.75 19.5l-7.5-7.5 7.5-7.5m-6 15L5.25 12l7.5-7.5" />
    </svg>
  );
}

const SIDEBAR_ICONS = {
  dashboard: IconHome,
  "my-swarm": IconHex,
  predictions: IconChart,
  history: IconClock,
  wallet: IconWallet,
  settings: IconCog
};

function shortenAddr(a) {
  if (!a || a.length < 12) return a || "—";
  return `${a.slice(0, 6)}…${a.slice(-6)}`;
}

function Spinner({ className }) {
  return (
    <span
      className={clsx("inline-block h-4 w-4 rounded-full border-2 border-slate-600 border-t-indigo-400 animate-spin", className)}
      aria-hidden
    />
  );
}

export default function DashboardApp() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mainTab, setMainTab] = useState("overview");
  const [userId, setUserId] = useState(null);
  const [walletAddress, setWalletAddress] = useState(null);
  const [ethBal, setEthBal] = useState("—");
  const [usdcBal, setUsdcBal] = useState("—");
  const [provider, setProvider] = useState(null);

  const [connectOpen, setConnectOpen] = useState(false);
  const [walletMenuOpen, setWalletMenuOpen] = useState(false);
  const [onboardOpen, setOnboardOpen] = useState(false);

  const [linkLoading, setLinkLoading] = useState(false);
  const [onboardLoading, setOnboardLoading] = useState(false);

  const [onboardName, setOnboardName] = useState("");
  const [onboardEmail, setOnboardEmail] = useState("");
  const [onboardBg, setOnboardBg] = useState("defi");
  const [onboardExp, setOnboardExp] = useState("intermediate");
  const [onboardGoal, setOnboardGoal] = useState("");
  const [ackFiveTx, setAckFiveTx] = useState(false);

  const [instruction, setInstruction] = useState("optimize my yield safely");
  const [fullAutonomy, setFullAutonomy] = useState(false);
  const [autoApprovePercent, setAutoApprovePercent] = useState(95);
  const [status, setStatus] = useState(null);
  const [history, setHistory] = useState([]);
  const [result, setResult] = useState(null);
  const [cycleLoading, setCycleLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [stakingForm, setStakingForm] = useState({
    agentId: "ConsensusAgent",
    predictionId: "",
    amount: "1",
    confidence: "0.7",
    stakeId: "",
    isCorrect: true
  });
  const [trustLoading, setTrustLoading] = useState(null);
  const [trustOps, setTrustOps] = useState([]);

  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  const showToast = useCallback((type, message) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ type, message });
    toastTimer.current = setTimeout(() => setToast(null), 4200);
  }, []);

  const apiCall = useCallback(
    async (path, method = "GET", body = null) => {
      const headers = { "content-type": "application/json" };
      if (userId) headers["X-User-Id"] = userId;
      const res = await fetch(`${API_BASE}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined
      });
      if (!res.ok) {
        const t = await res.text().catch(() => "");
        let err = t;
        try {
          const j = JSON.parse(t);
          err = j.error || j.message || t;
        } catch {
          /* raw */
        }
        throw new Error(`${res.status}: ${err?.slice?.(0, 200) || err}`);
      }
      return res.json();
    },
    [userId]
  );

  const refreshBalances = useCallback(async () => {
    if (!provider || !walletAddress) return;
    try {
      const [e, u] = await Promise.all([fetchEthBalance(provider, walletAddress), fetchUsdcBalance(provider, walletAddress)]);
      setEthBal(Number(e).toFixed(4));
      setUsdcBal(u.toFixed(2));
    } catch {
      setEthBal("—");
      setUsdcBal("—");
    }
  }, [provider, walletAddress]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const [s, h] = await Promise.all([apiCall("/api/predy/status"), apiCall("/api/predy/history")]);
      setStatus(s);
      setHistory(Array.isArray(h?.data) ? h.data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setRefreshing(false);
    }
  }, [apiCall]);

  useEffect(() => {
    try {
      const id = localStorage.getItem("predy_userId");
      const w = localStorage.getItem("predy_wallet");
      if (id) setUserId(id);
      if (w) setWalletAddress(w);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !walletAddress) return;
    const eth = getInjectedProvider();
    if (!eth) return;
    setProvider(new BrowserProvider(eth));
  }, [walletAddress]);

  useEffect(() => {
    refreshBalances();
  }, [refreshBalances]);

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 12000);
    return () => clearInterval(t);
  }, [refresh]);

  const handleMetaMaskConnect = async () => {
    setLinkLoading(true);
    try {
      const { address, provider: p } = await connectInjected();
      setWalletAddress(address);
      setProvider(p);
      localStorage.setItem("predy_wallet", address);

      const message = buildPredyLinkMessage(address);
      const signer = await p.getSigner();
      const sig = await signer.signMessage(message);

      const data = await fetch(`${API_BASE}/user/link-wallet`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ wallet: address, signature: sig, message, userDetails: { source: "dashboard" } })
      }).then(async (r) => {
        const j = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(j.error || r.statusText);
        return j;
      });

      setUserId(data.userId);
      localStorage.setItem("predy_userId", data.userId);
      setConnectOpen(false);
      if (data.restoredFromDb) {
        showToast("ok", "Welcome back — your Predy session and swarm were restored from the database.");
      } else {
        showToast("ok", "Wallet connected & linked to Predy session.");
      }
      await refresh();
    } catch (e) {
      showToast("err", e?.message || "Connection failed");
    } finally {
      setLinkLoading(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      if (userId) await apiCall("/user/disconnect", "POST", { userId });
    } catch {
      /* ignore */
    }
    setUserId(null);
    setWalletAddress(null);
    setProvider(null);
    localStorage.removeItem("predy_userId");
    localStorage.removeItem("predy_wallet");
    setWalletMenuOpen(false);
    showToast("ok", "Disconnected");
    await refresh();
  };

  const user = status?.data?.user;
  const onboarded = Boolean(user?.onboarded);
  const agents = status?.data?.agents || [];
  const identityRegistry = status?.data?.identityRegistryAddress;

  const canSubmitOnboard = useMemo(() => {
    if (!ackFiveTx) return false;
    const nameOk = onboardName.trim().length >= 2;
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(onboardEmail).trim());
    return nameOk && emailOk;
  }, [ackFiveTx, onboardName, onboardEmail]);

  const runOnboard = async () => {
    if (!userId || !walletAddress || !provider) {
      showToast("err", "Connect wallet first");
      return;
    }
    if (!canSubmitOnboard) {
      showToast("err", "Confirm the 5-transaction notice and enter a valid name and email.");
      return;
    }
    setOnboardLoading(true);
    try {
      let st = await apiCall("/api/predy/status");
      const regAddr = st?.data?.identityRegistryAddress || process.env.NEXT_PUBLIC_IDENTITY_REGISTRY;
      if (!regAddr) throw new Error("Could not resolve identity registry — check API status");

      const swarmId = `swarm-${crypto.randomUUID()}`;
      const profile = {
        name: onboardName.trim(),
        email: onboardEmail.trim(),
        background: onboardBg,
        cryptoExperience: onboardExp,
        goal: onboardGoal || undefined
      };

      const { swarm } = await registerSwarmWithBrowserWallet({
        provider,
        identityRegistryAddress: regAddr,
        swarmId,
        userId,
        profile
      });

      const swarmAgents = {};
      const swarmMeta = {};
      for (const [k, v] of Object.entries(swarm)) {
        swarmAgents[k] = v.erc8004Id;
        swarmMeta[k] = {
          createdAt: v.createdAt,
          goal: v.goal,
          task: v.task,
          skills: v.skills,
          walletLinked: v.walletLinked,
          permissions: v.permissions,
          txHash: v.txHash,
          agentURI: v.agentURI
        };
      }

      await apiCall("/user/onboard", "POST", {
        clientOnboard: true,
        swarmId,
        swarmAgents,
        swarmMeta,
        name: profile.name,
        email: profile.email,
        background: profile.background,
        cryptoExperience: profile.cryptoExperience,
        goal: profile.goal
      });

      setOnboardOpen(false);
      setAckFiveTx(false);
      showToast("ok", "5 unique ERC-8004 identities created & linked to your wallet.");
      await refresh();
    } catch (e) {
      showToast("err", e?.message || "Onboarding failed");
    } finally {
      setOnboardLoading(false);
    }
  };

  const runCycle = async () => {
    setCycleLoading(true);
    try {
      const data = await apiCall("/api/predy/instruct", "POST", {
        instruction,
        fullAutonomy,
        autoApprovePercent
      });
      setResult(data?.data || null);
      await refresh();
      showToast("ok", data?.data?.status === "awaiting-human-approval" ? "Paused for approval" : "Cycle complete");
    } catch (e) {
      showToast("err", e?.message || "Cycle failed");
    } finally {
      setCycleLoading(false);
    }
  };

  const trustAction = async (path, body, label) => {
    setTrustLoading(label);
    try {
      const response = await apiCall(path, "POST", body);
      setTrustOps((prev) =>
        [{ id: `${path}-${Date.now()}`, path, body, response: response?.data || response, ts: new Date().toISOString() }, ...prev].slice(
          0,
          12
        )
      );
      await refresh();
      showToast("ok", `${label} submitted`);
    } catch (e) {
      showToast("err", e?.message || label);
    } finally {
      setTrustLoading(null);
    }
  };

  const metrics = useMemo(
    () => [
      {
        label: "Yield prediction confidence",
        value: result?.consensusOutput?.confidence != null ? `${(result.consensusOutput.confidence * 100).toFixed(0)}%` : "—",
        sub: "Last cycle"
      },
      {
        label: "Staked reputation",
        value: trustOps[0]?.response?.stakeId ? "Active" : "—",
        sub: "TruthStake"
      },
      {
        label: "Linked wallet balance",
        value: walletAddress ? `${ethBal} ETH` : "—",
        sub: walletAddress ? `~${usdcBal} USDC` : "Connect wallet"
      },
      {
        label: "Active agents",
        value: onboarded ? String(agents.length || 5) : "0",
        sub: onboarded ? "ERC-8004 swarm" : "Onboard to activate"
      }
    ],
    [result, trustOps, walletAddress, ethBal, usdcBal, onboarded, agents.length]
  );

  const predictionTxLinks = useMemo(() => {
    if (!result) return [];
    const out = [];
    const walk = (node, p = "") => {
      if (!node || typeof node !== "object") return;
      if (Array.isArray(node)) return node.forEach((x, i) => walk(x, `${p}[${i}]`));
      for (const [k, v] of Object.entries(node)) {
        const kl = k.toLowerCase();
        if (typeof v === "string" && /^0x[a-fA-F0-9]{64}$/.test(v) && /tx|hash/i.test(k)) {
          out.push({ label: p ? `${p}.${k}` : k, hash: v, href: `${EXPLORER}/tx/${v}` });
        } else if (typeof v === "object") walk(v, p ? `${p}.${k}` : k);
      }
    };
    walk(result);
    return out.slice(0, 12);
  }, [result]);

  return (
    <div className="flex min-h-screen bg-[#050814] text-slate-100">
      {/* Sidebar */}
      <aside
        className={clsx(
          "flex flex-col border-r border-slate-800/80 bg-[#0a0f1c] transition-[width] duration-200",
          sidebarCollapsed ? "w-[72px]" : "w-[260px]"
        )}
      >
        <div className="flex h-16 items-center justify-between px-3 border-b border-slate-800/60">
          {!sidebarCollapsed && (
            <span className="font-bold tracking-tight text-lg bg-gradient-to-r from-indigo-400 to-cyan-300 bg-clip-text text-transparent">
              Predy
            </span>
          )}
          <button
            type="button"
            onClick={() => setSidebarCollapsed((c) => !c)}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800/80 hover:text-white"
            aria-label="Toggle sidebar"
          >
            <IconPanel className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex-1 space-y-1 p-2">
          {SIDEBAR.map((item) => {
            const Icon = SIDEBAR_ICONS[item.id] || IconHome;
            const active = mainTab === item.tab;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setMainTab(item.tab)}
                className={clsx(
                  "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  active ? "bg-indigo-500/15 text-indigo-300 border border-indigo-500/30" : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
                )}
              >
                <Icon className="h-5 w-5 shrink-0 opacity-90" />
                {!sidebarCollapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>
        <div className={clsx("p-3 border-t border-slate-800/60 text-[10px] text-slate-500", sidebarCollapsed && "hidden")}>
          Predy × VeriBond · Base Sepolia
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="flex h-16 items-center justify-between gap-4 border-b border-slate-800/80 bg-[#080c18]/95 px-4 backdrop-blur-xl">
          <div className="flex items-center gap-3 min-w-0">
            <h1 className="truncate text-lg font-semibold tracking-tight">Command Center</h1>
            {refreshing && <Spinner className="h-4 w-4" />}
          </div>
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="hidden sm:flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Base Sepolia
            </div>

            {!walletAddress ? (
              <button
                type="button"
                onClick={() => setConnectOpen(true)}
                className="rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2 text-sm font-semibold text-white shadow-glow hover:opacity-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#080c18]"
              >
                Connect Wallet
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setOnboardOpen(true)}
                  disabled={!userId || onboarded}
                  title={onboarded ? "Swarm already created" : !userId ? "Complete wallet link first" : "Register 5 ERC-8004 agents"}
                  aria-label={onboarded ? "Onboarding already complete" : "Onboard swarm"}
                  className="rounded-full border border-indigo-500/45 bg-indigo-500/15 px-4 py-2 text-sm font-semibold text-indigo-200 hover:bg-indigo-500/25 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-indigo-500/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#080c18]"
                >
                  Onboard Swarm
                </button>
                <div className="relative">
                <button
                  type="button"
                  onClick={() => setWalletMenuOpen((v) => !v)}
                  className="flex items-center gap-2 rounded-full border border-slate-600 bg-slate-900/80 py-1.5 pl-1.5 pr-3 text-sm hover:border-indigo-500/50"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-cyan-400 text-xs font-bold text-white">
                    {walletAddress.slice(2, 4).toUpperCase()}
                  </span>
                  <span className="font-mono text-slate-200">{shortenAddr(walletAddress)}</span>
                  <svg className="h-4 w-4 text-slate-500" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
                {walletMenuOpen && (
                  <>
                    <button type="button" className="fixed inset-0 z-40 cursor-default" aria-label="Close" onClick={() => setWalletMenuOpen(false)} />
                    <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-2xl border border-slate-700/80 bg-[#0f1629] p-4 shadow-2xl shadow-black/50">
                      <div className="mb-4 flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Connected</span>
                        <button type="button" onClick={() => setWalletMenuOpen(false)} className="text-slate-500 hover:text-white">
                          ✕
                        </button>
                      </div>
                      <div className="mb-4 flex flex-col items-center">
                        <div className="mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-cyan-400 text-lg font-bold">
                          {walletAddress.slice(2, 4).toUpperCase()}
                        </div>
                        <p className="font-mono text-sm text-indigo-300">{shortenAddr(walletAddress)}</p>
                        <p className="mt-1 text-xs text-slate-500">Base Sepolia</p>
                      </div>
                      <div className="space-y-2 rounded-xl bg-slate-900/80 p-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-500">ETH</span>
                          <span className="font-mono">{ethBal}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">USDC</span>
                          <span className="font-mono">{usdcBal}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleDisconnect}
                        className="mt-4 w-full rounded-xl border border-rose-500/50 py-2.5 text-sm font-semibold text-rose-400 hover:bg-rose-500/10"
                      >
                        Disconnect
                      </button>
                    </div>
                  </>
                )}
              </div>
              </>
            )}
          </div>
        </header>

        {/* Main tabs */}
        <div className="border-b border-slate-800/60 bg-[#060a14]/80 px-4">
          <div className="flex gap-1 overflow-x-auto py-2">
            {MAIN_TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setMainTab(t.id)}
                className={clsx(
                  "whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                  mainTab === t.id
                    ? "bg-slate-800 text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-200"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {mainTab === "overview" && (
            <div className="space-y-6 max-w-6xl mx-auto">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {metrics.map((m) => (
                  <div
                    key={m.label}
                    className="rounded-2xl border border-slate-800/80 bg-gradient-to-b from-slate-900/90 to-slate-950 p-5 shadow-card"
                  >
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{m.label}</p>
                    <p className="mt-2 text-2xl font-semibold tracking-tight text-white">{m.value}</p>
                    <p className="mt-1 text-xs text-slate-500">{m.sub}</p>
                  </div>
                ))}
              </div>

              {user?.bannerLine && (
                <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/5 px-5 py-4 text-sm font-medium text-emerald-100/90">
                  {user.bannerLine}
                </div>
              )}

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={runCycle}
                  disabled={cycleLoading || !onboarded}
                  className="rounded-xl border border-slate-600 bg-slate-800/50 px-6 py-3 text-sm font-semibold transition-colors hover:border-slate-500 hover:bg-slate-800 disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050814]"
                >
                  {cycleLoading ? <Spinner /> : null} Run prediction loop
                </button>
              </div>

              <p className="text-sm text-slate-500">
                Session:{" "}
                <span className="font-mono text-slate-300">{userId || "—"}</span>
                {onboarded ? <span className="ml-2 text-emerald-400">· Onboarded</span> : null}
              </p>
            </div>
          )}

          {mainTab === "swarm" && (
            <div className="max-w-6xl mx-auto space-y-4">
              <h2 className="text-lg font-semibold">Swarm agents</h2>
              <p className="text-sm text-slate-400">
                Token IDs are live ERC-721 Agent Identity mints on the{" "}
                {identityRegistry ? (
                  <a href={`${EXPLORER}/address/${identityRegistry}`} target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline">
                    ERC-8004 Identity Registry
                  </a>
                ) : (
                  "ERC-8004 Identity Registry"
                )}
                . OwnerBadge (VBOB) is a separate one-per-wallet soulbound badge — not used for per-agent identities.
              </p>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {(agents.length ? agents : ["Orchestrator", "DataAgent", "ConsensusAgent", "PrivacyAgent", "ExecutorAgent"]).map((name) => {
                  const tid = user?.swarmAgents?.[name];
                  const meta = user?.swarmMeta?.[name];
                  const tokenHref =
                    identityRegistry && tid ? `${EXPLORER}/token/${identityRegistry}?a=${encodeURIComponent(tid)}` : null;
                  const regTx = meta?.txHash;
                  const txHref = regTx && /^0x[a-fA-F0-9]{64}$/.test(regTx) ? `${EXPLORER}/tx/${regTx}` : null;
                  return (
                    <div key={name} className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 shadow-card">
                      <p className="font-semibold text-indigo-200">{name}</p>
                      <p className="mt-2 font-mono text-xs text-slate-300">Token ID: {tid || "—"}</p>
                      {tokenHref ? (
                        <a href={tokenHref} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs font-medium text-cyan-400 hover:underline">
                          View on BaseScan (NFT) →
                        </a>
                      ) : null}
                      {txHref ? (
                        <div className="mt-1">
                          <a href={txHref} target="_blank" rel="noreferrer" className="text-xs text-slate-500 hover:text-indigo-300">
                            Register tx ↗
                          </a>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {mainTab === "trade" && (
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-5">
                <h3 className="font-semibold mb-3">Human instruction</h3>
                <input
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm"
                  value={instruction}
                  onChange={(e) => setInstruction(e.target.value)}
                />
                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={runCycle}
                    disabled={cycleLoading}
                    className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold disabled:opacity-50"
                  >
                    {cycleLoading ? <Spinner /> : null} Run full prediction loop
                  </button>
                  <label className="flex items-center gap-2 text-sm text-slate-400">
                    <input type="checkbox" checked={fullAutonomy} onChange={(e) => setFullAutonomy(e.target.checked)} />
                    Full autonomy
                  </label>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-5">
                <h3 className="font-semibold mb-3">VeriBond — stake</h3>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                    value={stakingForm.agentId}
                    onChange={(e) => setStakingForm((s) => ({ ...s, agentId: e.target.value }))}
                  />
                  <input
                    className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                    placeholder="predictionId"
                    value={stakingForm.predictionId}
                    onChange={(e) => setStakingForm((s) => ({ ...s, predictionId: e.target.value }))}
                  />
                  <input
                    className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                    value={stakingForm.amount}
                    onChange={(e) => setStakingForm((s) => ({ ...s, amount: e.target.value }))}
                  />
                  <input
                    className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                    value={stakingForm.confidence}
                    onChange={(e) => setStakingForm((s) => ({ ...s, confidence: e.target.value }))}
                  />
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={trustLoading}
                    onClick={() =>
                      trustAction(
                        "/trust/stake",
                        {
                          agentId: stakingForm.agentId,
                          predictionId: stakingForm.predictionId || `manual-${Date.now()}`,
                          amount: Math.max(1, Number(stakingForm.amount)),
                          confidence: Number(stakingForm.confidence)
                        },
                        "Stake"
                      )
                    }
                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium"
                  >
                    Stake
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      trustAction(
                        "/trust/resolve",
                        {
                          agentId: stakingForm.agentId,
                          predictionId: stakingForm.predictionId || `manual-${Date.now()}`,
                          stakeId: stakingForm.stakeId || null,
                          isCorrect: stakingForm.isCorrect
                        },
                        "Resolve"
                      )
                    }
                    className="rounded-lg border border-slate-600 px-4 py-2 text-sm"
                  >
                    Resolve
                  </button>
                </div>
              </div>
            </div>
          )}

          {mainTab === "history" && (
            <div className="max-w-4xl mx-auto">
              <h2 className="text-lg font-semibold mb-4">Prediction history</h2>
              <div className="max-h-[480px] space-y-2 overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900/20 p-4">
                {history.length === 0 ? <p className="text-slate-500">No events yet.</p> : null}
                {[...history].reverse().slice(0, 40).map((ev, i) => (
                  <div key={i} className="border-b border-slate-800/50 py-2 text-sm">
                    <span className="text-indigo-300">{ev.type}</span>{" "}
                    <span className="text-slate-500 text-xs">{ev.timestamp}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {mainTab === "settings" && (
            <div className="max-w-xl mx-auto space-y-4 text-sm text-slate-400">
              <h2 className="text-lg font-semibold text-white">Wallet & security</h2>
              <p>
                Predy links your wallet via a signed message — we never ask for your private key in the browser UI. On-chain actions use your
                wallet (MetaMask, etc.) for ERC-8004 registration.
              </p>
              <p>
                For API-side staking to work without pasting a key, use the same account as <code className="text-indigo-300">PRIVATE_KEY</code>{" "}
                on the server, or execute stakes from contracts directly.
              </p>
            </div>
          )}
        </main>
      </div>

      {/* Connect modal */}
      {connectOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-[#0f1629] p-6 shadow-2xl">
            <div className="mb-6 flex justify-between">
              <h2 className="text-lg font-semibold">Connect wallet</h2>
              <button type="button" onClick={() => setConnectOpen(false)} className="text-slate-500 hover:text-white">
                ✕
              </button>
            </div>
            <p className="mb-4 text-sm text-slate-400">Choose how you want to connect to Predy on Base Sepolia.</p>
            <div className="space-y-3">
              <button
                type="button"
                onClick={handleMetaMaskConnect}
                disabled={linkLoading}
                className="flex w-full items-center gap-3 rounded-xl border border-slate-700 bg-slate-900/50 px-4 py-3 text-left hover:border-indigo-500/50"
              >
                <span className="text-2xl">🦊</span>
                <div>
                  <div className="font-medium">MetaMask</div>
                  <div className="text-xs text-slate-500">Injected browser wallet</div>
                </div>
                {linkLoading ? <Spinner className="ml-auto" /> : null}
              </button>
              <button
                type="button"
                onClick={handleMetaMaskConnect}
                disabled={linkLoading}
                className="flex w-full items-center gap-3 rounded-xl border border-slate-700 bg-slate-900/50 px-4 py-3 text-left opacity-90 hover:border-indigo-500/50"
              >
                <span className="text-2xl">🌈</span>
                <div>
                  <div className="font-medium">Rainbow / Rabby / Coinbase</div>
                  <div className="text-xs text-slate-500">Same EIP-1193 flow as MetaMask</div>
                </div>
              </button>
              <div className="rounded-xl border border-dashed border-slate-700 px-4 py-3 text-xs text-slate-500">
                WalletConnect v2: add <code className="text-indigo-400">NEXT_PUBLIC_WC_PROJECT_ID</code> to enable mobile wallets in a future
                update.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Onboard modal */}
      {onboardOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-[#0f1629] p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="mb-4 flex justify-between">
              <h2 className="text-lg font-semibold">Create your personal swarm</h2>
              <button
                type="button"
                onClick={() => {
                  setOnboardOpen(false);
                  setAckFiveTx(false);
                }}
                className="text-slate-500 hover:text-white"
              >
                ✕
              </button>
            </div>
            <p className="mb-4 text-xs leading-relaxed text-slate-400">
              Agents are <strong className="text-slate-200">real ERC-721 tokens</strong> on the ERC-8004 Identity Registry (Base Sepolia). Each
              register() mints a verifiable Agent Identity — token IDs are the numbers you see in the app and on BaseScan.
            </p>
            <div className="space-y-3">
              <input
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm"
                placeholder="Display name (min 2 characters)"
                value={onboardName}
                onChange={(e) => setOnboardName(e.target.value)}
                autoComplete="name"
              />
              <input
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm"
                placeholder="Email"
                type="email"
                value={onboardEmail}
                onChange={(e) => setOnboardEmail(e.target.value)}
                autoComplete="email"
              />
              <div>
                <label className="text-xs text-slate-500">Background</label>
                <select
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm"
                  value={onboardBg}
                  onChange={(e) => setOnboardBg(e.target.value)}
                >
                  {BG_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500">Crypto experience</label>
                <select
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm"
                  value={onboardExp}
                  onChange={(e) => setOnboardExp(e.target.value)}
                >
                  {EXP_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <input
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm"
                placeholder="Optional goal"
                value={onboardGoal}
                onChange={(e) => setOnboardGoal(e.target.value)}
              />
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-700/80 bg-slate-950/80 p-3 text-sm text-slate-300">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-600"
                  checked={ackFiveTx}
                  onChange={(e) => setAckFiveTx(e.target.checked)}
                />
                <span>
                  I understand I will <strong className="text-white">sign 5 separate transactions</strong> in my wallet to register the 5 agents
                  (Orchestrator + 4 agents) on the Identity Registry. All transactions are signed by my connected wallet.
                </span>
              </label>
            </div>
            <p className="mt-3 text-xs text-slate-500">
              Note: Wallets like MetaMask require one confirmation per transaction; batch-approval for multiple contract calls is not universally
              supported yet.
            </p>
            <button
              type="button"
              disabled={onboardLoading || !canSubmitOnboard}
              onClick={runOnboard}
              className="mt-4 w-full rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 py-3 text-sm font-bold text-white shadow-glow disabled:cursor-not-allowed disabled:opacity-40"
            >
              {onboardLoading ? (
                <>
                  <Spinner className="mr-2 inline" /> Registering on-chain…
                </>
              ) : (
                "Create Swarm"
              )}
            </button>
            <p className="mt-3 text-center text-xs text-slate-500">Profile and swarm are stored in Predy&apos;s database, keyed by your wallet.</p>
          </div>
        </div>
      )}

      {toast && (
        <div
          className={clsx(
            "fixed bottom-6 right-6 z-[200] max-w-sm rounded-xl border px-4 py-3 text-sm shadow-xl",
            toast.type === "ok" ? "border-emerald-500/40 bg-emerald-950/90 text-emerald-100" : "border-rose-500/40 bg-rose-950/90 text-rose-100"
          )}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}
