import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  X, Send, Loader2, User, Minimize2, RotateCcw, Crown,
  Ticket, CheckCircle2, ChevronDown
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: Date;
  action?: "create-ticket" | "view-products";
}

interface TicketForm {
  name: string;
  email: string;
  issueType: string;
  description: string;
}

// ─── Quick-access question chips ─────────────────────────────────────────────

const QUICK_QUESTIONS = [
  "What products do you offer?",
  "How do I place a custom order?",
  "What are your prices?",
  "How long does shipping take?",
  "What's your return policy?",
  "I need help with my order",
];

const ISSUE_TYPES = [
  "Order Status / Tracking",
  "Order Issue / Problem",
  "New Custom Order Request",
  "Pricing / Quote Request",
  "Shipping Question",
  "Returns / Refunds",
  "Design Question",
  "Other",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseReply(text: string): { clean: string; action?: "create-ticket" | "view-products" } {
  const ticketMatch = text.includes("[ACTION:create-ticket]");
  const productsMatch = text.includes("[ACTION:view-products]");
  const clean = text
    .replace(/\[ACTION:create-ticket\]/g, "")
    .replace(/\[ACTION:view-products\]/g, "")
    .trim();

  if (ticketMatch) return { clean, action: "create-ticket" };
  if (productsMatch) return { clean, action: "view-products" };
  return { clean };
}

function renderText(text: string) {
  const lines = text.split("\n");
  return lines.map((line, i) => {
    if (line.startsWith("- ") || line.startsWith("• ")) {
      const content = line.replace(/^[-•]\s*/, "");
      return (
        <div key={i} className="flex gap-2 my-0.5">
          <span className="text-pink-400 flex-shrink-0 mt-0.5">•</span>
          <span dangerouslySetInnerHTML={{ __html: formatInline(content) }} />
        </div>
      );
    }
    if (/^\d+\.\s/.test(line)) {
      const num = line.match(/^(\d+)\./)?.[1];
      const content = line.replace(/^\d+\.\s*/, "");
      return (
        <div key={i} className="flex gap-2 my-0.5">
          <span className="text-pink-400 flex-shrink-0 font-bold text-xs mt-0.5 w-3">{num}.</span>
          <span dangerouslySetInnerHTML={{ __html: formatInline(content) }} />
        </div>
      );
    }
    if (line.startsWith("**") && line.endsWith("**")) {
      return (
        <div
          key={i}
          className="font-bold text-white mt-1"
          dangerouslySetInnerHTML={{ __html: formatInline(line) }}
        />
      );
    }
    if (!line.trim()) return <div key={i} className="h-1" />;
    return <div key={i} dangerouslySetInnerHTML={{ __html: formatInline(line) }} />;
  });
}

function formatInline(text: string) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
    .replace(/`(.+?)`/g, '<code class="bg-slate-700 text-pink-300 px-1 rounded text-[10px] font-mono">$1</code>');
}

// ─── Queen Avatar (circular crown image or stylised fallback) ─────────────────

function QueenAvatar({
  size = "md",
  className = "",
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const [imgError, setImgError] = useState(false);
  const sizes = { sm: "w-7 h-7", md: "w-8 h-8", lg: "w-10 h-10" };
  const iconSizes = { sm: 12, md: 14, lg: 18 };

  if (!imgError) {
    return (
      <img
        src="/queen-avatar.png"
        alt="Queen"
        className={`${sizes[size]} rounded-full object-cover flex-shrink-0 ring-1 ring-pink-500/40 ${className}`}
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <div
      className={`${sizes[size]} rounded-full flex-shrink-0 flex items-center justify-center ${className}`}
      style={{
        background: "linear-gradient(135deg, #be185d 0%, #9d174d 50%, #7c1d6f 100%)",
        boxShadow: "0 0 0 1px rgba(236,72,153,0.4)",
      }}
    >
      <Crown size={iconSizes[size]} className="text-yellow-300" />
    </div>
  );
}

// ─── Support Ticket Form ──────────────────────────────────────────────────────

interface TicketFormPanelProps {
  onSubmit: (ticket: TicketForm) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

function TicketFormPanel({ onSubmit, onCancel, isSubmitting }: TicketFormPanelProps) {
  const [form, setForm] = useState<TicketForm>({
    name: "",
    email: "",
    issueType: ISSUE_TYPES[0],
    description: "",
  });

  const set = (field: keyof TicketForm) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  const canSubmit =
    form.name.trim() &&
    form.email.trim() &&
    form.description.trim() &&
    !isSubmitting;

  return (
    <div className="p-3 space-y-2.5">
      <div className="flex items-center gap-2 mb-3">
        <Ticket size={14} className="text-pink-400 flex-shrink-0" />
        <span className="text-xs font-bold text-white">Create Support Ticket</span>
      </div>

      <div>
        <label className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block mb-1">
          Your Name *
        </label>
        <input
          type="text"
          value={form.name}
          onChange={set("name")}
          placeholder="Full name"
          className="w-full bg-slate-800 border border-slate-700 focus:border-pink-500 rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-500 outline-none transition-colors"
        />
      </div>

      <div>
        <label className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block mb-1">
          Email Address *
        </label>
        <input
          type="email"
          value={form.email}
          onChange={set("email")}
          placeholder="your@email.com"
          className="w-full bg-slate-800 border border-slate-700 focus:border-pink-500 rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-500 outline-none transition-colors"
        />
      </div>

      <div>
        <label className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block mb-1">
          Issue Type *
        </label>
        <div className="relative">
          <select
            value={form.issueType}
            onChange={set("issueType")}
            className="w-full appearance-none bg-slate-800 border border-slate-700 focus:border-pink-500 rounded-lg px-3 py-2 text-xs text-white outline-none transition-colors pr-7"
          >
            {ISSUE_TYPES.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
        </div>
      </div>

      <div>
        <label className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block mb-1">
          Description *
        </label>
        <textarea
          value={form.description}
          onChange={set("description")}
          placeholder="Describe your question or issue in detail…"
          rows={3}
          className="w-full bg-slate-800 border border-slate-700 focus:border-pink-500 rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-500 outline-none transition-colors resize-none"
        />
      </div>

      <div className="flex gap-2 pt-1">
        <button
          onClick={onCancel}
          className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition-all"
        >
          Cancel
        </button>
        <button
          onClick={() => onSubmit(form)}
          disabled={!canSubmit}
          className="flex-1 py-2 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5"
        >
          {isSubmitting ? (
            <>
              <Loader2 size={11} className="animate-spin" /> Submitting…
            </>
          ) : (
            <>
              <Ticket size={11} /> Submit Ticket
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Main QueenChatAgent Component ───────────────────────────────────────────

export function QueenChatAgent() {
  const [isOpen, setIsOpen] = useState(false);
  const [panel, setPanel] = useState<"chat" | "ticket">("chat");
  const [ticketSuccess, setTicketSuccess] = useState<string | null>(null);
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);
  const [unread, setUnread] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [input, setInput] = useState("");

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      text: "Hey there! 👑 I'm Queen, your guide to Queenscustoms.shop. Whether you want to place a custom order, check pricing, or need help with an existing order — I've got you! What can I help you with today?",
      timestamp: new Date(),
    },
  ]);

  const historyRef = useRef<Array<{ role: "user" | "model"; parts: Array<{ text: string }> }>>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      setUnread(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, panel]);

  const sendMessage = useCallback(
    async (text: string) => {
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
        const res = await fetch("/api/queen-chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: text.trim(),
            history: historyRef.current.slice(0, -1),
          }),
        });

        const data = await res.json() as { reply?: string; error?: string };
        const raw = data.reply ?? data.error ?? "I'm having a moment — please try again!";
        const { clean, action } = parseReply(raw);

        const assistantMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          text: clean,
          timestamp: new Date(),
          action,
        };

        setMessages(prev => [...prev, assistantMsg]);
        historyRef.current.push({ role: "model", parts: [{ text: raw }] });

        if (!isOpen) setUnread(prev => prev + 1);
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
    },
    [isLoading, isOpen]
  );

  async function handleTicketSubmit(ticket: TicketForm) {
    setIsSubmittingTicket(true);
    try {
      const res = await fetch("/api/queen-ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ticket),
      });
      const data = await res.json() as { success?: boolean; ticketId?: string; message?: string; error?: string };

      if (data.success && data.message) {
        setTicketSuccess(data.message);
        // After a moment, go back to chat and add a confirmation message
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
          setPanel("chat");
          setTicketSuccess(null);
          setMessages(prev => [
            ...prev,
            {
              id: Date.now().toString(),
              role: "assistant",
              text: `✅ ${data.message ?? "Your ticket was submitted!"}`,
              timestamp: new Date(),
            },
          ]);
        }, 2500);
      } else {
        setTicketSuccess(data.error ?? "Something went wrong. Please try again.");
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => setTicketSuccess(null), 3000);
      }
    } catch {
      setTicketSuccess("Network error. Please try again.");
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setTicketSuccess(null), 3000);
    } finally {
      setIsSubmittingTicket(false);
    }
  }

  function handleReset() {
    historyRef.current = [];
    setPanel("chat");
    setMessages([
      {
        id: "welcome-" + Date.now(),
        role: "assistant",
        text: "Chat cleared! What can Queen help you with today? 👑",
        timestamp: new Date(),
      },
    ]);
  }

  return (
    <>
      {/* ── Floating Bubble ─────────────────────────────── */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-5 z-50 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 group"
        style={{
          background: isOpen
            ? "linear-gradient(135deg, #374151 0%, #1f2937 100%)"
            : "linear-gradient(135deg, #db2777 0%, #9d174d 60%, #7c1d6f 100%)",
          boxShadow: isOpen
            ? "0 4px 20px rgba(0,0,0,0.4)"
            : "0 4px 24px rgba(219,39,119,0.5), 0 0 0 0 rgba(219,39,119,0.4)",
          transform: isOpen ? "scale(0.95)" : undefined,
        }}
        title="Chat with Queen"
      >
        {isOpen ? (
          <X size={22} className="text-white" />
        ) : (
          <div className="relative">
            <QueenAvatar size="lg" className="w-full h-full" />
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow">
                {unread}
              </span>
            )}
          </div>
        )}
      </button>

      {/* ── Chat Panel ──────────────────────────────────── */}
      {isOpen && (
        <div
          className="fixed bottom-24 right-3 sm:right-5 z-50 w-[calc(100vw-24px)] sm:w-80 md:w-96 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
          style={{
            height: "min(540px, calc(100dvh - 110px))",
            background: "#0f172a",
            border: "1px solid rgba(219,39,119,0.25)",
            boxShadow: "0 25px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(219,39,119,0.15)",
          }}
        >
          {/* Header */}
          <div
            className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
            style={{
              background: "linear-gradient(135deg, #9d174d 0%, #7c1d6f 100%)",
              borderBottom: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <QueenAvatar size="md" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-white leading-tight flex items-center gap-1.5">
                Queen
                <span className="text-yellow-300 text-xs">👑</span>
              </div>
              <div className="text-[10px] text-pink-200/70 leading-tight">
                Queenscustoms.shop · Custom Boutique
              </div>
            </div>

            {/* Ticket shortcut */}
            <button
              onClick={() => { setPanel(panel === "ticket" ? "chat" : "ticket"); setTicketSuccess(null); }}
              title={panel === "ticket" ? "Back to chat" : "Create support ticket"}
              className={`p-1.5 rounded-lg transition-colors ${
                panel === "ticket"
                  ? "bg-white/20 text-white"
                  : "text-white/60 hover:text-white hover:bg-white/10"
              }`}
            >
              <Ticket size={14} />
            </button>

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

          {/* ── Ticket Panel ── */}
          {panel === "ticket" && (
            <div className="flex-1 overflow-y-auto bg-slate-900/60">
              {ticketSuccess ? (
                <div className="h-full flex flex-col items-center justify-center p-6 text-center">
                  <CheckCircle2 size={44} className="text-emerald-400 mb-3" />
                  <div className="text-sm font-bold text-emerald-400 mb-1">Ticket Submitted!</div>
                  <p className="text-xs text-slate-400 leading-relaxed max-w-xs">{ticketSuccess}</p>
                </div>
              ) : (
                <TicketFormPanel
                  onSubmit={handleTicketSubmit}
                  onCancel={() => setPanel("chat")}
                  isSubmitting={isSubmittingTicket}
                />
              )}
            </div>
          )}

          {/* ── Chat Panel ── */}
          {panel === "chat" && (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {messages.map(msg => (
                  <div key={msg.id} className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                    {/* Avatar */}
                    {msg.role === "assistant" ? (
                      <QueenAvatar size="sm" className="flex-shrink-0 self-end mb-1" />
                    ) : (
                      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center self-end mb-1">
                        <User size={12} className="text-slate-300" />
                      </div>
                    )}

                    {/* Bubble */}
                    <div
                      className={`max-w-[78%] rounded-2xl px-3 py-2.5 text-xs leading-relaxed ${
                        msg.role === "user"
                          ? "text-white rounded-tr-sm"
                          : "text-slate-200 rounded-tl-sm"
                      }`}
                      style={
                        msg.role === "user"
                          ? { background: "linear-gradient(135deg, #db2777, #9d174d)" }
                          : { background: "rgba(30,41,59,0.9)", border: "1px solid rgba(219,39,119,0.15)" }
                      }
                    >
                      <div className="space-y-0.5">{renderText(msg.text)}</div>

                      {/* Action Button */}
                      {msg.action === "create-ticket" && (
                        <button
                          onClick={() => setPanel("ticket")}
                          className="mt-2 w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-[11px] font-bold transition-all text-white"
                          style={{ background: "linear-gradient(135deg, #db2777, #9d174d)" }}
                        >
                          <Ticket size={11} />
                          Create Support Ticket
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {/* Loading */}
                {isLoading && (
                  <div className="flex gap-2">
                    <QueenAvatar size="sm" className="self-end mb-1" />
                    <div
                      className="rounded-2xl rounded-tl-sm px-3 py-2.5 flex items-center gap-2"
                      style={{ background: "rgba(30,41,59,0.9)", border: "1px solid rgba(219,39,119,0.15)" }}
                    >
                      <Loader2 size={12} className="text-pink-400 animate-spin" />
                      <span className="text-xs text-slate-400">Queen is typing…</span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Quick Questions (shown on first load only) */}
              {messages.length === 1 && (
                <div className="px-3 pb-2 flex-shrink-0">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1.5 font-semibold">
                    Popular questions
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_QUESTIONS.slice(0, 5).map(q => (
                      <button
                        key={q}
                        onClick={() => sendMessage(q)}
                        className="text-[10px] border text-slate-300 hover:text-white px-2.5 py-1.5 rounded-xl transition-all font-medium"
                        style={{
                          background: "rgba(30,41,59,0.8)",
                          borderColor: "rgba(219,39,119,0.3)",
                        }}
                        onMouseEnter={e => {
                          (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(219,39,119,0.7)";
                          (e.currentTarget as HTMLButtonElement).style.background = "rgba(157,23,77,0.3)";
                        }}
                        onMouseLeave={e => {
                          (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(219,39,119,0.3)";
                          (e.currentTarget as HTMLButtonElement).style.background = "rgba(30,41,59,0.8)";
                        }}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input */}
              <div
                className="border-t p-3 flex-shrink-0"
                style={{ borderColor: "rgba(219,39,119,0.2)", background: "rgba(15,23,42,0.8)" }}
              >
                <form
                  onSubmit={e => { e.preventDefault(); sendMessage(input); }}
                  className="flex items-center gap-2"
                >
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="Ask Queen anything…"
                    disabled={isLoading}
                    className="flex-1 rounded-xl px-3 py-2 text-sm text-white placeholder:text-slate-500 outline-none transition-colors"
                    style={{
                      background: "rgba(30,41,59,0.9)",
                      border: "1px solid rgba(219,39,119,0.25)",
                    }}
                    onFocus={e => {
                      (e.currentTarget as HTMLInputElement).style.borderColor = "rgba(219,39,119,0.7)";
                    }}
                    onBlur={e => {
                      (e.currentTarget as HTMLInputElement).style.borderColor = "rgba(219,39,119,0.25)";
                    }}
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || isLoading}
                    className="flex-shrink-0 w-9 h-9 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl transition-all"
                    style={{ background: "linear-gradient(135deg, #db2777, #9d174d)" }}
                  >
                    <Send size={14} />
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
