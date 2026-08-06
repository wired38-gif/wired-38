/**
 * MYK.IO — TheOptimizer
 * Standalone AI prompt analysis and research tool.
 * Accessible at /optimizer (separate from the Entrata Training Hub at /).
 */
import React, { useState, useEffect, useCallback } from "react";
import {
  Zap, LogIn, LogOut, KeyRound, ChevronRight, Loader2,
  BarChart2, Sparkles, DollarSign, Copy, Check, AlertCircle,
  Rss, Newspaper, ExternalLink,
} from "lucide-react";
import { AIResearchFeed } from "./components/entrata/AIResearchFeed";

// ─── Types ────────────────────────────────────────────────────────────────────

interface TierOption {
  tier: number;
  name: string;
  costEstimate: number;
  focus: string;
  explanation: string;
}

interface AnalysisResult {
  analysis: string;
  options: TierOption[];
}

interface RefineResult {
  title: string;
  content: string;
  estimatedTokens: number;
  milestones: string[];
  keyRecommendations: string[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const LLM_OPTIONS = [
  "Gemini 2.5 Flash",
  "Claude 3.5 Sonnet",
  "GPT-4o",
  "Llama-3 (OpenRouter)",
];

const TIER_STYLES = [
  { border: "border-emerald-700/50", bg: "bg-emerald-950/20", badge: "bg-emerald-900/40 text-emerald-300 border-emerald-700/50", icon: <DollarSign size={14} className="text-emerald-400" /> },
  { border: "border-indigo-700/50",  bg: "bg-indigo-950/20",  badge: "bg-indigo-900/40 text-indigo-300 border-indigo-700/50",   icon: <Sparkles size={14} className="text-indigo-400" /> },
  { border: "border-amber-700/50",   bg: "bg-amber-950/20",   badge: "bg-amber-900/40 text-amber-300 border-amber-700/50",      icon: <BarChart2 size={14} className="text-amber-400" /> },
];

function CopyButton({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      onClick={() => navigator.clipboard.writeText(text).then(() => { setDone(true); setTimeout(() => setDone(false), 1800); })}
      className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-slate-300 border border-slate-700 hover:border-slate-500 rounded px-1.5 py-0.5 transition-all"
    >
      {done ? <Check size={10} className="text-emerald-400" /> : <Copy size={10} />}
      {done ? "Copied" : "Copy"}
    </button>
  );
}

// ─── Sub-views ────────────────────────────────────────────────────────────────

/** Admin login form for TheOptimizer API access */
function LoginPanel({ onLogin }: { onLogin: () => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      onLogin();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <Zap size={28} className="text-indigo-400" />
            <span className="text-3xl font-black tracking-tight text-white">MYK<span className="text-indigo-400">.IO</span></span>
          </div>
          <p className="text-sm text-slate-400">TheOptimizer — AI Prompt Intelligence</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] text-slate-500 uppercase tracking-wider mb-1.5 font-semibold">Username</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
              placeholder="admin"
            />
          </div>
          <div>
            <label className="block text-[11px] text-slate-500 uppercase tracking-wider mb-1.5 font-semibold">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-400 bg-red-950/30 border border-red-900/50 rounded-xl px-3 py-2">
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-bold py-3 rounded-xl transition-all"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <LogIn size={16} />}
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <p className="text-center text-[11px] text-slate-600 mt-6">
          Requires ADMIN_USERNAME + ADMIN_PASSWORD environment variables.
        </p>
      </div>
    </div>
  );
}

/** Main optimizer: analyze prompt → pick tier → refine */
function OptimizerPanel({ onLogout }: { onLogout: () => void }) {
  const [prompt, setPrompt] = useState("");
  const [domain, setDomain] = useState("");
  const [selectedLlm, setSelectedLlm] = useState(LLM_OPTIONS[0]);

  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [analysisError, setAnalysisError] = useState("");

  const [selectedTier, setSelectedTier] = useState<number | null>(null);
  const [refining, setRefining] = useState(false);
  const [result, setResult] = useState<RefineResult | null>(null);
  const [refineError, setRefineError] = useState("");

  async function handleAnalyze(e: React.FormEvent) {
    e.preventDefault();
    if (!prompt.trim()) return;
    setAnalyzing(true);
    setAnalysisError("");
    setAnalysis(null);
    setResult(null);
    setSelectedTier(null);
    try {
      const res = await fetch("/api/analyze-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, domain, selectedLlm }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analysis failed");
      setAnalysis(data as AnalysisResult);
    } catch (err: any) {
      setAnalysisError(err.message);
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleRefine(tier: number) {
    if (!analysis) return;
    setSelectedTier(tier);
    setRefining(true);
    setRefineError("");
    setResult(null);
    const optionData = analysis.options.find(o => o.tier === tier);
    try {
      const res = await fetch("/api/refine-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, tier, domain, optionData, selectedLlm }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Refinement failed");
      setResult(data as RefineResult);
    } catch (err: any) {
      setRefineError(err.message);
    } finally {
      setRefining(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Top bar */}
      <header className="border-b border-slate-800 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap size={20} className="text-indigo-400" />
          <span className="text-lg font-black tracking-tight">MYK<span className="text-indigo-400">.IO</span></span>
          <span className="text-xs text-slate-500 font-medium ml-1">TheOptimizer</span>
        </div>
        <button onClick={onLogout}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-white transition-colors border border-slate-800 hover:border-slate-600 rounded-lg px-3 py-1.5">
          <LogOut size={12} />
          Sign out
        </button>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">

        {/* ── Prompt Input ── */}
        <form onSubmit={handleAnalyze} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Your Prompt / Project Request
            </label>
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              rows={5}
              required
              placeholder="Describe your project, feature, or AI task in plain language…"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
            />
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Domain (optional)</label>
              <input
                type="text"
                value={domain}
                onChange={e => setDomain(e.target.value)}
                placeholder="e.g. SaaS, real estate, e-commerce…"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
            <div className="flex-1">
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Target LLM</label>
              <select
                value={selectedLlm}
                onChange={e => setSelectedLlm(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
              >
                {LLM_OPTIONS.map(llm => <option key={llm}>{llm}</option>)}
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={analyzing || !prompt.trim()}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-bold py-3 rounded-xl transition-all"
          >
            {analyzing ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
            {analyzing ? "Analyzing…" : "Analyze & Generate Options"}
          </button>
        </form>

        {analysisError && (
          <div className="flex items-start gap-2 text-sm text-red-400 bg-red-950/30 border border-red-900/50 rounded-xl px-4 py-3">
            <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
            <div><p className="font-semibold">Analysis error</p><p className="text-red-500/80 text-xs mt-0.5">{analysisError}</p></div>
          </div>
        )}

        {/* ── Analysis Result: 3 Tier Options ── */}
        {analysis && (
          <div className="space-y-4">
            <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl">
              <p className="text-xs text-slate-400 leading-relaxed">
                <span className="font-semibold text-slate-300">Analysis: </span>
                {analysis.analysis}
              </p>
            </div>

            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Choose an Execution Tier</div>

            <div className="grid gap-3">
              {analysis.options.map((opt, i) => {
                const style = TIER_STYLES[i] ?? TIER_STYLES[1];
                const isSelected = selectedTier === opt.tier;
                const isLoading = refining && selectedTier === opt.tier;
                return (
                  <button
                    key={opt.tier}
                    onClick={() => handleRefine(opt.tier)}
                    disabled={refining}
                    className={`text-left p-4 rounded-xl border transition-all ${style.bg} ${
                      isSelected ? style.border : "border-slate-800 hover:border-slate-600"
                    } disabled:opacity-60`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1.5">
                          {style.icon}
                          <span className="text-sm font-bold text-white">{opt.name}</span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${style.badge}`}>
                            Option {opt.tier}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mb-1">{opt.focus}</p>
                        <p className="text-[11px] text-slate-500 leading-relaxed">{opt.explanation}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-sm font-bold text-slate-300">~{opt.costEstimate.toLocaleString()}</div>
                        <div className="text-[10px] text-slate-600">tokens</div>
                        {isLoading
                          ? <Loader2 size={14} className="animate-spin text-indigo-400 mt-2 ml-auto" />
                          : <ChevronRight size={14} className="text-slate-600 mt-2 ml-auto" />
                        }
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {refineError && (
          <div className="flex items-start gap-2 text-sm text-red-400 bg-red-950/30 border border-red-900/50 rounded-xl px-4 py-3">
            <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
            <div><p className="font-semibold">Refinement error</p><p className="text-red-500/80 text-xs mt-0.5">{refineError}</p></div>
          </div>
        )}

        {/* ── Refined Result ── */}
        {result && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white">{result.title}</h2>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-500">~{result.estimatedTokens?.toLocaleString()} tokens</span>
                <CopyButton text={result.content} />
              </div>
            </div>

            {/* Markdown content */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 text-sm text-slate-300 leading-relaxed whitespace-pre-wrap font-mono text-xs overflow-x-auto max-h-96 overflow-y-auto">
              {result.content}
            </div>

            {/* Milestones */}
            {result.milestones?.length > 0 && (
              <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Milestones</h3>
                <ul className="space-y-2">
                  {result.milestones.map((m, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-600/20 border border-indigo-600/40 flex items-center justify-center text-[10px] font-bold text-indigo-400">{i + 1}</span>
                      {m}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recommendations */}
            {result.keyRecommendations?.length > 0 && (
              <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Token-Saving Recommendations</h3>
                <ul className="space-y-2">
                  {result.keyRecommendations.map((r, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                      <span className="flex-shrink-0 text-emerald-400 mt-0.5">✓</span>
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Tab layout wrapping Optimizer + Research ─────────────────────────────────

const APP_TABS = [
  { id: "optimize" as const, label: "Optimize",      icon: <Zap size={14} /> },
  { id: "research" as const, label: "AI Research",   icon: <Rss size={14} /> },
] as const;

type AppTab = typeof APP_TABS[number]["id"];

export default function TheOptimizerApp() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [tab, setTab] = useState<AppTab>("optimize");

  // Check auth status on mount
  useEffect(() => {
    fetch("/api/status")
      .then(r => r.json())
      .then(d => setAuthenticated(Boolean(d.authenticated)))
      .catch(() => setAuthenticated(false));
  }, []);

  async function handleLogout() {
    await fetch("/api/logout", { method: "POST" });
    setAuthenticated(false);
  }

  if (authenticated === null) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-indigo-400" />
      </div>
    );
  }

  if (!authenticated) {
    return <LoginPanel onLogin={() => setAuthenticated(true)} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      {/* Header */}
      <header className="flex-shrink-0 border-b border-slate-800 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Zap size={20} className="text-indigo-400" />
          <span className="text-lg font-black tracking-tight">MYK<span className="text-indigo-400">.IO</span></span>
          <span className="text-xs text-slate-500 font-medium">TheOptimizer</span>

          {/* Tab switcher */}
          <div className="flex ml-4 bg-slate-900 border border-slate-800 rounded-lg p-0.5">
            {APP_TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  tab === t.id
                    ? "bg-indigo-600 text-white"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="/"
            className="text-xs text-slate-600 hover:text-slate-300 transition-colors border border-slate-800 hover:border-slate-600 rounded-lg px-3 py-1.5"
          >
            ← Entrata Training
          </a>
          <button onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-white transition-colors border border-slate-800 hover:border-slate-600 rounded-lg px-3 py-1.5">
            <LogOut size={12} />
            Sign out
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {tab === "optimize" && (
          <div className="h-full overflow-y-auto">
            <OptimizerContent />
          </div>
        )}
        {tab === "research" && (
          <div className="h-full">
            <AIResearchFeed />
          </div>
        )}
      </div>
    </div>
  );
}

/** The optimizer form/results, extracted so it can scroll independently */
function OptimizerContent() {
  const [prompt, setPrompt] = useState("");
  const [domain, setDomain] = useState("");
  const [selectedLlm, setSelectedLlm] = useState(LLM_OPTIONS[0]);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [analysisError, setAnalysisError] = useState("");
  const [selectedTier, setSelectedTier] = useState<number | null>(null);
  const [refining, setRefining] = useState(false);
  const [result, setResult] = useState<RefineResult | null>(null);
  const [refineError, setRefineError] = useState("");

  async function handleAnalyze(e: React.FormEvent) {
    e.preventDefault();
    if (!prompt.trim()) return;
    setAnalyzing(true);
    setAnalysisError("");
    setAnalysis(null);
    setResult(null);
    setSelectedTier(null);
    try {
      const res = await fetch("/api/analyze-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, domain, selectedLlm }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analysis failed");
      setAnalysis(data as AnalysisResult);
    } catch (err: any) {
      setAnalysisError(err.message);
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleRefine(tier: number) {
    if (!analysis) return;
    setSelectedTier(tier);
    setRefining(true);
    setRefineError("");
    setResult(null);
    const optionData = analysis.options.find(o => o.tier === tier);
    try {
      const res = await fetch("/api/refine-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, tier, domain, optionData, selectedLlm }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Refinement failed");
      setResult(data as RefineResult);
    } catch (err: any) {
      setRefineError(err.message);
    } finally {
      setRefining(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white mb-1">Prompt Optimizer</h1>
        <p className="text-sm text-slate-400">Paste your request and get 3 cost-tiered execution plans — then refine to your target LLM.</p>
      </div>

      <form onSubmit={handleAnalyze} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Your Prompt / Project Request</label>
          <textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            rows={5}
            required
            placeholder="Describe your project, feature, or AI task in plain language…"
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
          />
        </div>
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Domain (optional)</label>
            <input type="text" value={domain} onChange={e => setDomain(e.target.value)}
              placeholder="e.g. SaaS, real estate, e-commerce…"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-colors" />
          </div>
          <div className="flex-1">
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Target LLM</label>
            <select value={selectedLlm} onChange={e => setSelectedLlm(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors">
              {LLM_OPTIONS.map(l => <option key={l}>{l}</option>)}
            </select>
          </div>
        </div>
        <button type="submit" disabled={analyzing || !prompt.trim()}
          className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-bold py-3 rounded-xl transition-all">
          {analyzing ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
          {analyzing ? "Analyzing…" : "Analyze & Generate Options"}
        </button>
      </form>

      {analysisError && (
        <div className="flex items-start gap-2 text-sm text-red-400 bg-red-950/30 border border-red-900/50 rounded-xl px-4 py-3">
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
          <div><p className="font-semibold">Analysis error</p><p className="text-red-500/80 text-xs mt-0.5">{analysisError}</p></div>
        </div>
      )}

      {analysis && (
        <div className="space-y-4">
          <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl">
            <p className="text-xs text-slate-400 leading-relaxed">
              <span className="font-semibold text-slate-300">Analysis: </span>{analysis.analysis}
            </p>
          </div>
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Choose an Execution Tier</div>
          <div className="grid gap-3">
            {analysis.options.map((opt, i) => {
              const style = TIER_STYLES[i] ?? TIER_STYLES[1];
              const isLoading = refining && selectedTier === opt.tier;
              return (
                <button key={opt.tier} onClick={() => handleRefine(opt.tier)} disabled={refining}
                  className={`text-left p-4 rounded-xl border transition-all ${style.bg} ${
                    selectedTier === opt.tier ? style.border : "border-slate-800 hover:border-slate-600"
                  } disabled:opacity-60`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1.5">
                        {style.icon}
                        <span className="text-sm font-bold text-white">{opt.name}</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${style.badge}`}>Option {opt.tier}</span>
                      </div>
                      <p className="text-xs text-slate-400 mb-1">{opt.focus}</p>
                      <p className="text-[11px] text-slate-500 leading-relaxed">{opt.explanation}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-sm font-bold text-slate-300">~{opt.costEstimate.toLocaleString()}</div>
                      <div className="text-[10px] text-slate-600">tokens</div>
                      {isLoading ? <Loader2 size={14} className="animate-spin text-indigo-400 mt-2 ml-auto" />
                                 : <ChevronRight size={14} className="text-slate-600 mt-2 ml-auto" />}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {refineError && (
        <div className="flex items-start gap-2 text-sm text-red-400 bg-red-950/30 border border-red-900/50 rounded-xl px-4 py-3">
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
          <div><p className="font-semibold">Refinement error</p><p className="text-red-500/80 text-xs mt-0.5">{refineError}</p></div>
        </div>
      )}

      {result && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white">{result.title}</h2>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-500">~{result.estimatedTokens?.toLocaleString()} tokens</span>
              <CopyButton text={result.content} />
            </div>
          </div>
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 text-xs text-slate-300 leading-relaxed whitespace-pre-wrap font-mono overflow-x-auto max-h-96 overflow-y-auto">
            {result.content}
          </div>
          {result.milestones?.length > 0 && (
            <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Milestones</h3>
              <ul className="space-y-2">
                {result.milestones.map((m, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-600/20 border border-indigo-600/40 flex items-center justify-center text-[10px] font-bold text-indigo-400">{i + 1}</span>
                    {m}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {result.keyRecommendations?.length > 0 && (
            <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Token-Saving Recommendations</h3>
              <ul className="space-y-2">
                {result.keyRecommendations.map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                    <span className="flex-shrink-0 text-emerald-400 mt-0.5">✓</span>
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
