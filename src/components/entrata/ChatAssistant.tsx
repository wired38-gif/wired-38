import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  MessageCircle, X, Send, Loader2, Bot, User,
  ChevronRight, Minimize2, Sparkles, RotateCcw
} from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: Date;
  navigateTo?: string;
}

interface ChatAssistantProps {
  onNavigate: (workflowId: string) => void;
}

const QUICK_QUESTIONS = [
  "How do I process a move-in?",
  "What is SODA?",
  "How do I create a work order?",
  "How do I post a late fee?",
  "What is Notice to Vacate?",
  "How do I run the daily report?",
];

// Parse the [NAVIGATE:workflow_id] tag out of the reply
function parseReply(text: string): { clean: string; navigateTo?: string } {
  const match = text.match(/\[NAVIGATE:([a-z\-]+)\]/);
  if (match) {
    return {
      clean: text.replace(/\[NAVIGATE:[a-z\-]+\]/g, "").trim(),
      navigateTo: match[1],
    };
  }
  return { clean: text };
}

// Simple markdown-ish renderer for bold, bullets, inline code
function renderText(text: string) {
  const lines = text.split("\n");
  return lines.map((line, i) => {
    // Bullet point
    if (line.startsWith("- ") || line.startsWith("• ")) {
      const content = line.replace(/^[-•]\s*/, "");
      return (
        <div key={i} className="flex gap-2 my-0.5">
          <span className="text-indigo-400 flex-shrink-0 mt-0.5">•</span>
          <span dangerouslySetInnerHTML={{ __html: formatInline(content) }} />
        </div>
      );
    }
    // Numbered list
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
    // Heading (line starting with **)
    if (line.startsWith("**") && line.endsWith("**")) {
      return <div key={i} className="font-bold text-white mt-1" dangerouslySetInnerHTML={{ __html: formatInline(line) }} />;
    }
    // Empty line = spacing
    if (!line.trim()) return <div key={i} className="h-1" />;
    return <div key={i} dangerouslySetInnerHTML={{ __html: formatInline(line) }} />;
  });
}

function formatInline(text: string) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
    .replace(/`(.+?)`/g, '<code class="bg-slate-700 text-indigo-300 px-1 rounded text-[10px] font-mono">$1</code>');
}

export function ChatAssistant({ onNavigate }: ChatAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      text: "Hi! I'm Entrata AI — your expert trainer for all things Entrata. Ask me how to navigate any workflow, explain a term, or find a report. What can I help you with?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [unread, setUnread] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Gemini conversation history format
  const historyRef = useRef<Array<{ role: "user" | "model"; parts: Array<{ text: string }> }>>([]);

  useEffect(() => {
    if (isOpen) {
      setUnread(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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

    // Update Gemini history
    historyRef.current.push({ role: "user", parts: [{ text: text.trim() }] });

    try {
      const res = await fetch("/api/entrata-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text.trim(),
          history: historyRef.current.slice(0, -1), // exclude current message
        }),
      });

      const data = await res.json();
      const raw = data.reply ?? data.error ?? "Sorry, something went wrong. Try again.";
      const { clean, navigateTo } = parseReply(raw);

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        text: clean,
        timestamp: new Date(),
        navigateTo,
      };

      setMessages(prev => [...prev, assistantMsg]);
      historyRef.current.push({ role: "model", parts: [{ text: raw }] });

      if (!isOpen) setUnread(prev => prev + 1);
    } catch {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        text: "Network error. Please check your connection and try again.",
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, isOpen]);

  function handleReset() {
    historyRef.current = [];
    setMessages([{
      id: "welcome-" + Date.now(),
      role: "assistant",
      text: "Chat cleared! What would you like to know about Entrata?",
      timestamp: new Date(),
    }]);
  }

  return (
    <>
      {/* Floating Bubble — higher on mobile to clear the coach bar */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-24 right-4 sm:bottom-5 sm:right-5 z-40 w-12 h-12 sm:w-14 sm:h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 ${
          isOpen
            ? "bg-slate-700 hover:bg-slate-600 rotate-0 scale-95"
            : "bg-gradient-to-br from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 hover:scale-110"
        }`}
        title="Entrata AI Assistant"
      >
        {isOpen ? (
          <X size={22} className="text-white" />
        ) : (
          <div className="relative">
            <Sparkles size={24} className="text-white" />
            {unread > 0 && (
              <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white">
                {unread}
              </span>
            )}
          </div>
        )}
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-40 right-3 sm:bottom-24 sm:right-5 z-40 w-[calc(100vw-24px)] sm:w-80 md:w-96 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl shadow-black/50 flex flex-col overflow-hidden"
          style={{ height: "min(480px, calc(100dvh - 180px))" }}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-3 flex items-center gap-3 flex-shrink-0">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
              <Sparkles size={15} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-white leading-tight">Entrata AI</div>
              <div className="text-[10px] text-white/70 leading-tight">Expert trainer · Always available</div>
            </div>
            <button
              onClick={handleReset}
              title="Clear chat"
              className="p-1.5 text-white/60 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
            >
              <RotateCcw size={13} />
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 text-white/60 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
            >
              <Minimize2 size={14} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-thin">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                {/* Avatar */}
                <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${
                  msg.role === "assistant"
                    ? "bg-gradient-to-br from-indigo-600 to-violet-600"
                    : "bg-slate-700"
                }`}>
                  {msg.role === "assistant"
                    ? <Sparkles size={12} className="text-white" />
                    : <User size={12} className="text-slate-300" />
                  }
                </div>

                {/* Bubble */}
                <div className={`max-w-[78%] rounded-2xl px-3 py-2.5 text-xs leading-relaxed ${
                  msg.role === "user"
                    ? "bg-indigo-600 text-white rounded-tr-sm"
                    : "bg-slate-800 text-slate-200 rounded-tl-sm"
                }`}>
                  <div className="space-y-0.5">
                    {renderText(msg.text)}
                  </div>

                  {/* Navigate Button */}
                  {msg.navigateTo && (
                    <button
                      onClick={() => {
                        onNavigate(msg.navigateTo!);
                        setIsOpen(false);
                      }}
                      className="mt-2 w-full flex items-center justify-center gap-1.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold rounded-xl transition-all"
                    >
                      <ChevronRight size={12} />
                      Open This Workflow
                    </button>
                  )}
                </div>
              </div>
            ))}

            {/* Loading */}
            {isLoading && (
              <div className="flex gap-2">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center flex-shrink-0">
                  <Sparkles size={12} className="text-white" />
                </div>
                <div className="bg-slate-800 rounded-2xl rounded-tl-sm px-3 py-2.5 flex items-center gap-2">
                  <Loader2 size={12} className="text-indigo-400 animate-spin" />
                  <span className="text-xs text-slate-400">Thinking…</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Questions */}
          {messages.length === 1 && (
            <div className="px-3 pb-2 flex-shrink-0">
              <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1.5 font-semibold">Quick questions</div>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_QUESTIONS.slice(0, 4).map(q => (
                  <button
                    key={q}
                    onClick={() => sendMessage(q)}
                    className="text-[10px] bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-indigo-500/50 text-slate-300 hover:text-white px-2.5 py-1.5 rounded-xl transition-all font-medium"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="border-t border-slate-800 p-3 flex-shrink-0">
            <form
              onSubmit={e => { e.preventDefault(); sendMessage(input); }}
              className="flex items-center gap-2"
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Ask anything about Entrata…"
                disabled={isLoading}
                className="flex-1 bg-slate-800 border border-slate-700 focus:border-indigo-500 rounded-xl px-3 py-2 text-sm text-white placeholder:text-slate-500 outline-none transition-colors"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="flex-shrink-0 w-9 h-9 flex items-center justify-center bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl transition-all"
              >
                <Send size={14} />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
