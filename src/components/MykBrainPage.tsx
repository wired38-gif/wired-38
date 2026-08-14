import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Send, Loader2, User, RotateCcw, Brain,
  Wifi, WifiOff, Zap, Clock,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: Date;
}

interface StatusData {
  status: string;
  hasApiKey: boolean;
  authConfigured: boolean;
  authenticated: boolean;
  timestamp: string;
}

// ─── Text rendering ───────────────────────────────────────────────────────────

function formatInline(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
    .replace(/`(.+?)`/g, '<code class="bg-slate-700 text-indigo-300 px-1.5 py-0.5 rounded text-[11px] font-mono">$1</code>');
}

function renderText(text: string) {
  return text.split("\n").map((line, i) => {
    if (line.startsWith("- ") || line.startsWith("• ")) {
      const content = line.replace(/^[-•]\s*/, "");
      return (
        <div key={i} className="flex gap-2 my-0.5">
          <span className="text-indigo-400 flex-shrink-0 mt-0.5">•</span>
          <span dangerouslySetInnerHTML={{ __html: formatInline(content) }} />
        </div>
      );
    }
    if (/^\d+\.\s/.test(line)) {
      const num = line.match(/^(\d+)\./)?.[1];
      const content = line.replace(/^\d+\.\s*/, "");
      return (
        <div key={i} className="flex gap-2 my-0.5">
          <span className="text-indigo-400 flex-shrink-0 font-bold text-xs mt-0.5 w-3">{num}.</span>
          <span dangerouslySetInnerHTML={{ __html: formatInline(content) }} />
        </div>
      );
    }
    if (line.startsWith("# ")) {
      return (
        <div key={i} className="text-base font-black text-white mt-2 mb-1">
          {line.replace(/^# /, "")}
        </div>
      );
    }
    if (line.startsWith("## ")) {
      return (
        <div key={i} className="text-sm font-bold text-white mt-1.5 mb-0.5">
          {line.replace(/^## /, "")}
        </div>
      );
    }
    if (!line.trim()) return <div key={i} className="h-1.5" />;
    return <div key={i} dangerouslySetInnerHTML={{ __html: formatInline(line) }} />;
  });
}

// ─── Status bar ───────────────────────────────────────────────────────────────

function StatusBar({ status, uptime }: { status: StatusData | null; uptime: number }) {
  const online = status?.status === "ok";
  const minutes = Math.floor(uptime / 60);
  const seconds = uptime % 60;
  const uptimeStr = minutes > 0
    ? `${minutes}m ${String(seconds).padStart(2, "0")}s`
    : `${seconds}s`;

  return (
    <div className={`flex items-center gap-3 px-4 py-2 border-b text-xs font-medium flex-shrink-0 ${
      online
        ? "bg-emerald-950/40 border-emerald-900/40 text-emerald-400"
        : "bg-rose-950/40 border-rose-900/40 text-rose-400"
    }`}>
      {online ? (
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
          </span>
          <Wifi size={12} />
          <span>Online</span>
        </div>
      ) : (
        <div className="flex items-center gap-1.5">
          <WifiOff size={12} />
          <span>Offline</span>
        </div>
      )}

      <span className="text-slate-600">·</span>

      {online && status?.hasApiKey ? (
        <div className="flex items-center gap-1 text-indigo-400">
          <Zap size={11} />
          <span>Gemini connected</span>
        </div>
      ) : (
        <span className={online ? "text-amber-500" : "text-rose-600"}>
          {online ? "No API key — fallback mode" : "Cannot reach server"}
        </span>
      )}

      {online && (
        <>
          <span className="text-slate-600">·</span>
          <div className="flex items-center gap-1 text-slate-500">
            <Clock size={10} />
            <span>Up {uptimeStr}</span>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Main MykBrainPage ────────────────────────────────────────────────────────

const QUICK_PROMPTS = [
  "What is the current app status?",
  "How do I optimize a prompt for Claude?",
  "Explain the 3 cost tiers",
  "How do I use the TheOptimizer?",
  "What's the best model for coding?",
];

export function MykBrainPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      text: "Hey — I'm Myk's Brain, the AI assistant for MYK.IO. I can help you optimize prompts, explain the cost tiers, check app status, or just answer questions. What's on your mind?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<StatusData | null>(null);
  const [uptime, setUptime] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const historyRef = useRef<Array<{ role: "user" | "model"; parts: Array<{ text: string }> }>>([]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  // Poll status endpoint
  useEffect(() => {
    async function checkStatus() {
      try {
        const res = await fetch("/api/status");
        if (res.ok) {
          const data = await res.json() as StatusData;
          setStatus(data);
        } else {
          setStatus(null);
        }
      } catch {
        setStatus(null);
      }
    }
    checkStatus();
    const interval = setInterval(checkStatus, 15_000);
    return () => clearInterval(interval);
  }, []);

  // Uptime counter
  useEffect(() => {
    const interval = setInterval(() => setUptime(s => s + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      text: text.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);
    historyRef.current.push({ role: "user", parts: [{ text: text.trim() }] });

    try {
      const res = await fetch("/api/myk-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text.trim(),
          history: historyRef.current.slice(0, -1),
        }),
      });

      const data = await res.json() as { reply?: string; error?: string };
      const raw = data.reply ?? data.error ?? "Something went wrong — please try again.";

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        text: raw,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMsg]);
      historyRef.current.push({ role: "model", parts: [{ text: raw }] });
    } catch {
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          text: "Network error — please check your connection and try again.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  function handleReset() {
    historyRef.current = [];
    setMessages([
      {
        id: "reset-" + Date.now(),
        role: "assistant",
        text: "Chat cleared! What would you like to know?",
        timestamp: new Date(),
      },
    ]);
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* ── Header ─────────────────────────────────────── */}
      <header className="flex-shrink-0 bg-slate-900 border-b border-slate-800 px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-900/40">
            <Brain size={18} className="text-white" />
          </div>
          <div>
            <div className="text-sm font-black text-white tracking-tight leading-none">Myk's Brain</div>
            <div className="text-[10px] text-slate-500 mt-0.5">MYK.IO · AI Assistant</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Online / offline pill */}
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border ${
            status?.status === "ok"
              ? "bg-emerald-950/50 border-emerald-800/60 text-emerald-400"
              : "bg-rose-950/50 border-rose-800/60 text-rose-400"
          }`}>
            {status?.status === "ok" ? (
              <>
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
                </span>
                ONLINE
              </>
            ) : (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                OFFLINE
              </>
            )}
          </div>

          <button
            onClick={handleReset}
            title="Clear chat"
            className="p-2 text-slate-500 hover:text-slate-300 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </header>

      {/* ── Status bar ─────────────────────────────────── */}
      <StatusBar status={status} uptime={uptime} />

      {/* ── Messages ───────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4">
        {messages.map(msg => (
          <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
            {/* Avatar */}
            <div className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center self-start ${
              msg.role === "assistant"
                ? "bg-gradient-to-br from-indigo-600 to-violet-600 shadow-lg shadow-indigo-900/30"
                : "bg-slate-700"
            }`}>
              {msg.role === "assistant"
                ? <Brain size={14} className="text-white" />
                : <User size={14} className="text-slate-300" />
              }
            </div>

            {/* Bubble */}
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed space-y-0.5 ${
              msg.role === "user"
                ? "bg-indigo-600 text-white rounded-tr-sm"
                : "bg-slate-800 text-slate-200 rounded-tl-sm border border-slate-700/50"
            }`}>
              {renderText(msg.text)}
              <div className={`text-[10px] mt-1.5 ${
                msg.role === "user" ? "text-indigo-300" : "text-slate-600"
              }`}>
                {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isLoading && (
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center">
              <Brain size={14} className="text-white" />
            </div>
            <div className="bg-slate-800 rounded-2xl rounded-tl-sm px-4 py-3 border border-slate-700/50 flex items-center gap-2">
              <Loader2 size={13} className="text-indigo-400 animate-spin" />
              <span className="text-sm text-slate-400">Thinking…</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Quick prompts ───────────────────────────────── */}
      {messages.length === 1 && (
        <div className="px-4 pb-3 flex-shrink-0">
          <div className="text-[10px] text-slate-600 uppercase tracking-wider mb-2 font-semibold">Quick questions</div>
          <div className="flex flex-wrap gap-2">
            {QUICK_PROMPTS.map(q => (
              <button
                key={q}
                onClick={() => sendMessage(q)}
                className="text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-indigo-500/50 text-slate-400 hover:text-white px-3 py-1.5 rounded-xl transition-all font-medium"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Input ──────────────────────────────────────── */}
      <div className="flex-shrink-0 border-t border-slate-800 bg-slate-900/80 px-4 py-3">
        <form
          onSubmit={e => { e.preventDefault(); sendMessage(input); }}
          className="flex items-center gap-2"
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Message Myk's Brain…"
            disabled={isLoading}
            className="flex-1 bg-slate-800 border border-slate-700 focus:border-indigo-500 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none transition-colors"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="flex-shrink-0 w-11 h-11 flex items-center justify-center bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl transition-all shadow-lg shadow-indigo-900/40"
          >
            <Send size={15} />
          </button>
        </form>
        <p className="text-[10px] text-slate-600 text-center mt-2">
          Powered by MYK.IO · AI responses may be inaccurate
        </p>
      </div>
    </div>
  );
}
