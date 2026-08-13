import React, { useState, useEffect, useCallback } from "react";
import {
  Bot, MessageSquare, Database, Settings, Menu, X,
  Plus, Wifi, WifiOff, Brain, Lock, Eye, EyeOff, LogOut,
  Globe, Sparkles, ChevronLeft, ChevronRight
} from "lucide-react";
import type { SAStatus, SAConversationSummary, ActiveView } from "./types";
import { ChatPanel } from "./components/ChatPanel";
import { KnowledgeBasePanel } from "./components/KnowledgeBasePanel";
import { SettingsPanel } from "./components/SettingsPanel";
import { ConversationSidebar } from "./components/ConversationSidebar";
import { PortalPanel } from "./components/PortalPanel";

// Google retired the gemini-2.0 models (404 from the API) — keep this list to
// currently active catalog models only.
const MODEL_OPTIONS = [
  { value: "gemini-3.6-flash",      label: "Gemini 3.6 Flash",    badge: "Fast",     requires: "gemini" },
  { value: "gemini-2.5-flash",      label: "Gemini 2.5 Flash",    badge: "Balanced", requires: "gemini" },
  { value: "gemini-2.5-pro",        label: "Gemini 2.5 Pro",      badge: "Smart",    requires: "gemini" },
  { value: "gemini-3.5-flash-lite", label: "Gemini 3.5 Flash Lite", badge: "Cheapest", requires: "gemini" },
  { value: "apple/foundation",      label: "Apple AI",             badge: "On-Device",requires: "apple"  },
  { value: "ollama/llama3",         label: "Llama 3",              badge: "Local",    requires: "ollama" },
  { value: "ollama/mistral",        label: "Mistral",              badge: "Local",    requires: "ollama" },
  { value: "ollama/codellama",      label: "Code Llama",           badge: "Local",    requires: "ollama" },
];

// ── PIN Gate ──────────────────────────────────────────────────────────────────

function PinGate({ onSuccess }: { onSuccess: () => void }) {
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin.trim()) return;
    setLoading(true);
    setError("");
    try {
      const r = await fetch("/api/sa/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: pin.trim() }),
      });
      const data = await r.json() as { authenticated?: boolean; error?: string };
      if (data.authenticated) { onSuccess(); }
      else { setError(data.error || "Incorrect PIN."); setPin(""); }
    } catch { setError("Connection error. Try again."); }
    finally { setLoading(false); }
  };

  return (
    <div className="h-screen bg-slate-950 flex items-center justify-center px-4 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-blue-600/5 rounded-full blur-2xl" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="relative inline-block mb-4">
            <div className="w-20 h-20 bg-gradient-to-br from-violet-500 via-indigo-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto shadow-2xl shadow-violet-900/50">
              <Brain size={36} className="text-white" />
            </div>
            <div className="absolute -inset-1 bg-gradient-to-br from-violet-500 to-blue-600 rounded-2xl blur opacity-30 animate-pulse" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">MYK Super Agent</h1>
          <p className="text-sm text-slate-500 mt-1">Designs by Myk LLC · SA.Mykbrands.com</p>
        </div>

        {/* PIN form */}
        <div className="bg-slate-900/80 backdrop-blur border border-slate-800/80 rounded-2xl p-6 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider flex items-center gap-1.5">
                <Lock size={11} />
                Access PIN
              </label>
              <div className="relative">
                <input
                  type={showPin ? "text" : "password"}
                  value={pin}
                  onChange={e => setPin(e.target.value)}
                  placeholder="••••••••"
                  autoFocus
                  className="w-full bg-slate-800/80 border border-slate-700 focus:border-violet-500 rounded-xl px-4 py-3.5 text-white text-xl tracking-[0.3em] placeholder-slate-700 focus:outline-none transition-all focus:shadow-lg focus:shadow-violet-900/20 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPin(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400 transition-colors p-1"
                >
                  {showPin ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p className="text-sm text-red-400 text-center">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={!pin.trim() || loading}
              className="w-full py-3.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all shadow-lg shadow-violet-900/30 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Sparkles size={16} />
              )}
              {loading ? "Verifying…" : "Enter Super Agent"}
            </button>
          </form>
          <p className="text-center text-[11px] text-slate-700 mt-4">
            30-day session · works on all devices
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────

export default function SuperAgentApp() {
  const [status, setStatus] = useState<SAStatus | null>(null);
  const [pinGranted, setPinGranted] = useState(false);
  const [activeView, setActiveView] = useState<ActiveView>("chat");
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<SAConversationSummary[]>([]);
  const [selectedModel, setSelectedModel] = useState("gemini-3.6-flash");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [portalOpen, setPortalOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchStatus = useCallback(async () => {
    try {
      const r = await fetch("/api/sa/status");
      const data = await r.json() as SAStatus;
      setStatus(data);
    } catch { /* ignore */ }
  }, []);

  const fetchConversations = useCallback(async () => {
    try {
      const r = await fetch("/api/sa/conversations");
      const data = await r.json() as { conversations: SAConversationSummary[] };
      setConversations(data.conversations);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        const r = await fetch("/api/sa/status");
        const data = await r.json() as SAStatus;
        setStatus(data);
        if (!data.pinRequired || data.saAuthenticated) setPinGranted(true);
      } finally { setLoading(false); }
    };
    init();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  useEffect(() => {
    if (pinGranted) fetchConversations();
  }, [pinGranted, fetchConversations]);

  const createConversation = useCallback(async () => {
    const r = await fetch("/api/sa/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "New Conversation" }),
    });
    const conv = await r.json() as { id: string };
    setActiveConversationId(conv.id);
    setActiveView("chat");
    setMobileSidebarOpen(false);
    await fetchConversations();
  }, [fetchConversations]);

  const deleteConversation = useCallback(async (id: string) => {
    await fetch(`/api/sa/conversations/${id}`, { method: "DELETE" });
    if (activeConversationId === id) setActiveConversationId(null);
    await fetchConversations();
  }, [activeConversationId, fetchConversations]);

  const handleLogout = useCallback(async () => {
    await fetch("/api/sa/logout", { method: "POST" });
    setPinGranted(false);
    setConversations([]);
    setActiveConversationId(null);
  }, []);

  const availableModels = MODEL_OPTIONS.filter(m => {
    if (m.requires === "ollama") return status?.ollama.available;
    if (m.requires === "apple") return status?.appleAI?.available;
    return true;
  });

  if (loading) {
    return (
      <div className="h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-14 h-14 border-2 border-violet-500/30 rounded-2xl flex items-center justify-center">
              <Brain size={24} className="text-violet-500" />
            </div>
            <div className="absolute inset-0 border-2 border-violet-500 rounded-2xl border-t-transparent animate-spin" />
          </div>
          <span className="text-slate-500 text-sm font-medium">Loading Super Agent…</span>
        </div>
      </div>
    );
  }

  if (status?.pinRequired && !pinGranted) {
    return <PinGate onSuccess={() => { setPinGranted(true); fetchConversations(); }} />;
  }

  const NAV_ITEMS = [
    { id: "chat" as ActiveView, icon: MessageSquare, label: "Chat" },
    { id: "kb" as ActiveView, icon: Database, label: "Memory" },
    { id: "settings" as ActiveView, icon: Settings, label: "Settings" },
  ];

  return (
    <div className="h-screen bg-slate-950 text-white flex overflow-hidden">
      {/* Subtle ambient gradient */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-64 w-96 h-64 bg-violet-600/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-80 w-80 h-80 bg-indigo-600/5 rounded-full blur-3xl" />
      </div>

      {/* Mobile backdrop */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden" onClick={() => setMobileSidebarOpen(false)} />
      )}

      {/* Left Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 flex flex-col
        bg-slate-900/95 backdrop-blur border-r border-slate-800/80
        transform transition-transform duration-300 ease-in-out
        lg:relative lg:translate-x-0
        ${mobileSidebarOpen ? "translate-x-0 w-72" : "-translate-x-full lg:translate-x-0"}
        ${sidebarOpen ? "lg:w-64" : "lg:w-16"}
      `}>
        {/* Logo */}
        <div className={`flex items-center border-b border-slate-800/80 flex-shrink-0 ${sidebarOpen ? "gap-3 px-4 py-4" : "justify-center px-2 py-4"}`}>
          <div className="relative flex-shrink-0">
            <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-violet-900/40">
              <Brain size={15} className="text-white" />
            </div>
            <div className="absolute -inset-0.5 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-lg blur opacity-20" />
          </div>
          {sidebarOpen && (
            <div className="flex-1 min-w-0">
              <div className="text-sm font-black text-white leading-none">MYK Agent</div>
              <div className="text-[10px] text-slate-500 mt-0.5">SA.Mykbrands.com</div>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(s => !s)}
            className="hidden lg:flex p-1 text-slate-600 hover:text-slate-300 rounded-lg hover:bg-slate-800 transition-colors flex-shrink-0"
          >
            {sidebarOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
          </button>
          <button onClick={() => setMobileSidebarOpen(false)} className="lg:hidden p-1 text-slate-600 hover:text-slate-300">
            <X size={16} />
          </button>
        </div>

        {/* New Chat */}
        <div className={`flex-shrink-0 ${sidebarOpen ? "px-3 pt-3" : "px-2 pt-3"}`}>
          <button
            onClick={createConversation}
            className={`w-full flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl font-semibold transition-all shadow-md shadow-violet-900/30 ${sidebarOpen ? "px-3 py-2 text-sm" : "justify-center p-2"}`}
          >
            <Plus size={15} />
            {sidebarOpen && "New Chat"}
          </button>
        </div>

        {/* Nav */}
        <div className={`flex-shrink-0 ${sidebarOpen ? "px-3 py-2 flex gap-1" : "px-2 py-2 flex flex-col gap-1"}`}>
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => { setActiveView(item.id); setMobileSidebarOpen(false); }}
              title={item.label}
              className={`flex items-center gap-2 rounded-xl transition-colors ${
                sidebarOpen ? "flex-1 flex-col py-1.5 text-[10px] font-semibold" : "justify-center p-2.5"
              } ${
                activeView === item.id
                  ? "bg-violet-600/20 text-violet-300 border border-violet-500/30"
                  : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/60"
              }`}
            >
              <item.icon size={14} />
              {sidebarOpen && item.label}
            </button>
          ))}
        </div>

        {/* Conversations */}
        {sidebarOpen && (
          <div className="flex-1 overflow-y-auto px-3 pb-3 min-h-0">
            <ConversationSidebar
              conversations={conversations}
              activeId={activeConversationId}
              onSelect={id => { setActiveConversationId(id); setActiveView("chat"); setMobileSidebarOpen(false); }}
              onDelete={deleteConversation}
              onRefresh={fetchConversations}
            />
          </div>
        )}

        {/* Status */}
        <div className={`flex-shrink-0 border-t border-slate-800/80 ${sidebarOpen ? "px-3 py-2" : "px-2 py-2"}`}>
          {sidebarOpen ? (
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                {status?.geminiConfigured
                  ? <div className="flex items-center gap-1.5 text-[10px] text-emerald-400"><Wifi size={9} />Gemini</div>
                  : <div className="flex items-center gap-1.5 text-[10px] text-red-400"><WifiOff size={9} />No API key</div>
                }
                {status?.appleAI?.available && <span className="text-[9px] text-slate-400 ml-auto"> Apple AI</span>}
                {status?.ollama.available && <span className="text-[9px] text-emerald-400 ml-auto">Ollama</span>}
              </div>
              {status?.pinRequired && (
                <button onClick={handleLogout} className="w-full flex items-center gap-1.5 justify-center text-[10px] text-slate-700 hover:text-slate-400 py-1 transition-colors">
                  <LogOut size={9} />Lock
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1">
              {status?.geminiConfigured
                ? <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" title="Gemini ready" />
                : <div className="w-1.5 h-1.5 rounded-full bg-red-400" title="No API key" />
              }
            </div>
          )}
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0 relative">
        {/* Top bar */}
        <header className="flex-shrink-0 h-13 bg-slate-950/80 backdrop-blur border-b border-slate-800/80 flex items-center px-4 gap-3">
          <button
            onClick={() => { if (window.innerWidth < 1024) setMobileSidebarOpen(true); else setSidebarOpen(s => !s); }}
            className="p-1.5 text-slate-500 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <Menu size={18} />
          </button>

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-md flex items-center justify-center flex-shrink-0">
              <Bot size={12} className="text-white" />
            </div>
            <span className="text-sm font-bold text-white hidden sm:block">Super Agent</span>
            <ChevronRight size={12} className="text-slate-700 hidden sm:block" />
            <span className="text-xs text-slate-500 hidden sm:block capitalize">{activeView}</span>
          </div>

          <div className="flex-1" />

          {/* Model selector */}
          <div className="flex items-center gap-2">
            <Sparkles size={11} className="text-violet-400 hidden sm:block" />
            <select
              value={selectedModel}
              onChange={e => setSelectedModel(e.target.value)}
              className="text-xs bg-slate-800/80 border border-slate-700/80 rounded-lg px-2 py-1.5 text-slate-300 focus:outline-none focus:border-violet-500 cursor-pointer backdrop-blur transition-colors hover:border-slate-600"
            >
              {availableModels.map(m => (
                <option key={m.value} value={m.value}>{m.label} [{m.badge}]</option>
              ))}
            </select>
          </div>

          {/* Portal toggle */}
          <button
            onClick={() => setPortalOpen(p => !p)}
            title="MYK Portal"
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
              portalOpen
                ? "bg-violet-600/20 text-violet-300 border-violet-500/40"
                : "text-slate-500 hover:text-slate-300 border-slate-700 hover:border-slate-600 hover:bg-slate-800"
            }`}
          >
            <Globe size={13} />
            <span className="hidden sm:block">Portal</span>
          </button>
        </header>

        {/* Content area */}
        <div className="flex-1 flex overflow-hidden min-h-0">
          {/* Main panel */}
          <div className="flex-1 overflow-hidden min-w-0">
            {activeView === "chat" && (
              <ChatPanel
                conversationId={activeConversationId}
                selectedModel={selectedModel}
                onConversationCreated={id => { setActiveConversationId(id); fetchConversations(); }}
                onConversationUpdated={fetchConversations}
                onNewChat={createConversation}
              />
            )}
            {activeView === "kb" && <KnowledgeBasePanel onStatusRefresh={fetchStatus} />}
            {activeView === "settings" && <SettingsPanel status={status} onRefresh={fetchStatus} />}
          </div>

          {/* Portal panel */}
          {portalOpen && (
            <div className="w-72 flex-shrink-0 overflow-hidden hidden md:block">
              <PortalPanel
                onSiteSelect={() => {}}
                activePortalUrl={null}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
