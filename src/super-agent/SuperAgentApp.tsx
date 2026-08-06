import React, { useState, useEffect, useCallback } from "react";
import {
  Bot, MessageSquare, Database, Settings, Zap, Menu, X,
  ChevronLeft, Plus, Wifi, WifiOff, Brain
} from "lucide-react";
import type { SAStatus, SAConversationSummary, ActiveView } from "./types";
import { ChatPanel } from "./components/ChatPanel";
import { KnowledgeBasePanel } from "./components/KnowledgeBasePanel";
import { SettingsPanel } from "./components/SettingsPanel";
import { ConversationSidebar } from "./components/ConversationSidebar";

const MODEL_OPTIONS = [
  { value: "gemini-2.0-flash",      label: "Gemini 2.0 Flash",    badge: "Fast",    color: "text-blue-400" },
  { value: "gemini-2.5-flash",      label: "Gemini 2.5 Flash",    badge: "Balanced",color: "text-indigo-400" },
  { value: "gemini-2.5-pro",        label: "Gemini 2.5 Pro",      badge: "Smart",   color: "text-violet-400" },
  { value: "gemini-2.0-flash-lite", label: "Gemini Flash Lite",   badge: "Cheapest",color: "text-cyan-400" },
  { value: "ollama/llama3",         label: "Llama 3 (Local)",     badge: "Free",    color: "text-emerald-400" },
  { value: "ollama/mistral",        label: "Mistral (Local)",     badge: "Free",    color: "text-emerald-400" },
  { value: "ollama/codellama",      label: "Code Llama (Local)",  badge: "Free",    color: "text-emerald-400" },
  { value: "ollama/phi3",           label: "Phi-3 Mini (Local)",  badge: "Free",    color: "text-emerald-400" },
];

export default function SuperAgentApp() {
  const [status, setStatus] = useState<SAStatus | null>(null);
  const [activeView, setActiveView] = useState<ActiveView>("chat");
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<SAConversationSummary[]>([]);
  const [selectedModel, setSelectedModel] = useState("gemini-2.0-flash");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchStatus = useCallback(async () => {
    try {
      const r = await fetch("/api/sa/status");
      const data = await r.json() as SAStatus;
      setStatus(data);
    } catch {
      // ignore
    }
  }, []);

  const fetchConversations = useCallback(async () => {
    try {
      const r = await fetch("/api/sa/conversations");
      const data = await r.json() as { conversations: SAConversationSummary[] };
      setConversations(data.conversations);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    Promise.all([fetchStatus(), fetchConversations()]).finally(() => setLoading(false));
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, [fetchStatus, fetchConversations]);

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

  const selectConversation = useCallback((id: string) => {
    setActiveConversationId(id);
    setActiveView("chat");
    setMobileSidebarOpen(false);
  }, []);

  const availableModels = MODEL_OPTIONS.filter(m => {
    if (m.value.startsWith("ollama/")) return status?.ollama.available;
    return true;
  });

  if (loading) {
    return (
      <div className="h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-slate-400 text-sm">Loading Super Agent…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-slate-950 text-white flex overflow-hidden">
      {/* Mobile sidebar backdrop */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 border-r border-slate-800 flex flex-col
        transform transition-transform duration-300 ease-in-out
        lg:relative lg:translate-x-0 lg:flex lg:flex-shrink-0
        ${mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"}
        ${sidebarOpen ? "lg:flex" : "lg:hidden"}
      `}>
        {/* Sidebar Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Brain size={14} className="text-white" />
            </div>
            <div>
              <div className="text-sm font-bold text-white leading-none">MYK Super Agent</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Designs by Myk LLC</div>
            </div>
          </div>
          <button
            onClick={() => { setSidebarOpen(false); setMobileSidebarOpen(false); }}
            className="p-1 text-slate-500 hover:text-white rounded-lg hover:bg-slate-800 lg:flex hidden"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => setMobileSidebarOpen(false)}
            className="p-1 text-slate-500 hover:text-white rounded-lg hover:bg-slate-800 lg:hidden"
          >
            <X size={16} />
          </button>
        </div>

        {/* New Chat Button */}
        <div className="px-3 pt-3 flex-shrink-0">
          <button
            onClick={createConversation}
            className="w-full flex items-center gap-2 px-3 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-sm font-semibold transition-colors"
          >
            <Plus size={15} />
            New Conversation
          </button>
        </div>

        {/* Nav Items */}
        <div className="px-3 py-2 flex gap-1 flex-shrink-0">
          {[
            { id: "chat" as ActiveView, icon: MessageSquare, label: "Chat" },
            { id: "kb" as ActiveView, icon: Database, label: "Knowledge" },
            { id: "settings" as ActiveView, icon: Settings, label: "Settings" },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => { setActiveView(item.id); setMobileSidebarOpen(false); }}
              className={`flex-1 flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg text-[10px] font-semibold transition-colors ${
                activeView === item.id
                  ? "bg-violet-600/20 text-violet-300 border border-violet-500/30"
                  : "text-slate-500 hover:text-slate-300 hover:bg-slate-800"
              }`}
            >
              <item.icon size={14} />
              {item.label}
            </button>
          ))}
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto px-3 pb-3">
          <ConversationSidebar
            conversations={conversations}
            activeId={activeConversationId}
            onSelect={selectConversation}
            onDelete={deleteConversation}
            onRefresh={fetchConversations}
          />
        </div>

        {/* Status Bar */}
        <div className="flex-shrink-0 border-t border-slate-800 px-3 py-2 space-y-1">
          <div className="flex items-center gap-2">
            {status?.geminiConfigured ? (
              <div className="flex items-center gap-1.5 text-[10px] text-emerald-400">
                <Wifi size={10} />
                <span>Gemini ready</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-[10px] text-amber-400">
                <WifiOff size={10} />
                <span>No Gemini key</span>
              </div>
            )}
            {status?.ollama.available && (
              <div className="flex items-center gap-1 text-[10px] text-emerald-400 ml-auto">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>Ollama ({status.ollama.models.length})</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 text-[10px] text-slate-600">
            <Database size={9} />
            <span>{status?.kbSize ?? 0} KB entries</span>
            <MessageSquare size={9} className="ml-auto" />
            <span>{status?.conversationCount ?? 0} convos</span>
          </div>
        </div>
      </aside>

      {/* Main Area */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top Bar */}
        <header className="flex-shrink-0 h-12 bg-slate-950 border-b border-slate-800 flex items-center px-4 gap-3">
          {/* Sidebar toggle */}
          <button
            onClick={() => { setSidebarOpen(s => !s); setMobileSidebarOpen(true); }}
            className="p-1.5 text-slate-500 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <Menu size={18} />
          </button>

          {/* Brand */}
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-md flex items-center justify-center">
              <Bot size={13} className="text-white" />
            </div>
            <span className="text-sm font-bold text-white hidden sm:block">Super Agent</span>
            <span className="text-[10px] text-slate-600 hidden md:block">by Designs by Myk LLC</span>
          </div>

          <div className="flex-1" />

          {/* Model selector */}
          <div className="flex items-center gap-2">
            <Zap size={12} className="text-violet-400 hidden sm:block" />
            <select
              value={selectedModel}
              onChange={e => setSelectedModel(e.target.value)}
              className="text-xs bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-slate-300 focus:outline-none focus:border-violet-500 cursor-pointer"
            >
              {availableModels.map(m => (
                <option key={m.value} value={m.value}>
                  {m.label} [{m.badge}]
                </option>
              ))}
            </select>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-hidden">
          {activeView === "chat" && (
            <ChatPanel
              conversationId={activeConversationId}
              selectedModel={selectedModel}
              onConversationCreated={(id) => {
                setActiveConversationId(id);
                fetchConversations();
              }}
              onConversationUpdated={fetchConversations}
              onNewChat={createConversation}
            />
          )}
          {activeView === "kb" && (
            <KnowledgeBasePanel onStatusRefresh={fetchStatus} />
          )}
          {activeView === "settings" && (
            <SettingsPanel status={status} onRefresh={fetchStatus} />
          )}
        </main>
      </div>
    </div>
  );
}
