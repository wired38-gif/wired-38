import React, { useState, useRef, useEffect, useCallback } from "react";
import { X, Send, Loader2, User, Minimize2, RotateCcw, Crown, Ticket, CheckCircle2 } from "lucide-react";

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

const QUICK_QUESTIONS = [
  "What products do you offer?",
  "How do I place a custom order?",
  "What are your prices?",
  "How long does shipping take?",
  "Tell me about the creator",
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

function parseReply(text: string): { clean: string; action?: "create-ticket" | "view-products" } {
  const hasTicket = text.includes("[ACTION:create-ticket]");
  const clean = text.replace(/\[ACTION:create-ticket\]/g, "").replace(/\[ACTION:view-products\]/g, "").trim();
  return hasTicket ? { clean, action: "create-ticket" } : { clean };
}

function formatInline(text: string) {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/`(.+?)`/g, "<code>$1</code>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>");
}

function renderText(text: string) {
  return text.split("\n").map((line, i) => {
    if (line.startsWith("- ") || line.startsWith("• ")) {
      return (
        <div key={i} className="flex gap-2 my-0.5">
          <span className="text-pink-400 flex-shrink-0">•</span>
          <span dangerouslySetInnerHTML={{ __html: formatInline(line.replace(/^[-•]\s*/, "")) }} />
        </div>
      );
    }
    if (/^\d+\.\s/.test(line)) {
      const num = line.match(/^(\d+)\./)?.[1];
      return (
        <div key={i} className="flex gap-2 my-0.5">
          <span className="text-pink-400 font-bold text-xs w-3 flex-shrink-0">{num}.</span>
          <span dangerouslySetInnerHTML={{ __html: formatInline(line.replace(/^\d+\.\s*/, "")) }} />
        </div>
      );
    }
    if (!line.trim()) return <div key={i} className="h-1" />;
    return <div key={i} dangerouslySetInnerHTML={{ __html: formatInline(line) }} />;
  });
}

function QueenAvatar({ size = 32, ring = false }: { size?: number; ring?: boolean }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        className={`rounded-full flex-shrink-0 flex items-center justify-center ${ring ? "ring-2 ring-yellow-400" : ""}`}
        style={{ width: size, height: size, background: "linear-gradient(135deg,#db2777,#9d174d)" }}
      >
        <Crown size={size * 0.4} className="text-yellow-300" />
      </div>
    );
  }

  return (
    <img
      src="/queen-avatar.png"
      alt="Queen"
      className={`rounded-full object-cover flex-shrink-0 ${ring ? "ring-2 ring-yellow-400" : ""}`}
      style={{ width: size, height: size }}
      onError={() => setFailed(true)}
    />
  );
}

function TicketFormPanel({
  onSubmit,
  onCancel,
  isSubmitting,
}: {
  onSubmit: (t: TicketForm) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}) {
  const [form, setForm] = useState<TicketForm>({ name: "", email: "", issueType: ISSUE_TYPES[0], description: "" });

  const set = (f: keyof TicketForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(p => ({ ...p, [f]: e.target.value }));

  const canSubmit = form.name.trim() && form.email.trim() && form.description.trim() && !isSubmitting;

  const inputCls = "w-full rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-500 outline-none transition-colors"
    + " bg-slate-800 border border-slate-700 focus:border-pink-500";

  return (
    <div className="p-3 space-y-2.5">
      <div className="flex items-center gap-2">
        <Ticket size={14} className="text-pink-400 flex-shrink-0" />
        <span className="text-xs font-bold text-white">Create Support Ticket</span>
      </div>

      <div>
        <label className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block mb-1">Issue Type</label>
        <select value={form.issueType} onChange={set("issueType")} className={inputCls + " cursor-pointer appearance-none"}>
          {ISSUE_TYPES.map(t => <option key={t} value={t} className="bg-slate-900">{t}</option>)}
        </select>
      </div>

      <div>
        <label className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block mb-1">Your Name *</label>
        <input type="text" value={form.name} onChange={set("name")} placeholder="Full name" className={inputCls} />
      </div>

      <div>
        <label className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block mb-1">Email Address *</label>
        <input type="email" value={form.email} onChange={set("email")} placeholder="your@email.com" className={inputCls} />
      </div>

      <div>
        <label className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block mb-1">Describe your issue *</label>
        <textarea value={form.description} onChange={set("description")} rows={3} placeholder="Tell us what's going on…" className={inputCls + " resize-none"} />
      </div>

      <div className="flex gap-2 pt-1">
        <button onClick={onCancel} className="flex-1 py-2 border border-slate-600 text-slate-400 hover:text-white hover:border-slate-400 rounded-lg text-[11px] font-semibold transition-colors">
          Cancel
        </button>
        <button
          onClick={() => canSubmit && onSubmit(form)}
          disabled={!canSubmit}
          className="flex-1 py-2 text-white rounded-lg text-[11px] font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1"
          style={{ background: "linear-gradient(135deg,#db2777,#9d174d)" }}
        >
          {isSubmitting ? <Loader2 size={11} className="animate-spin" /> : <Send size={11} />}
          {isSubmitting ? "Sending…" : "Submit"}
        </button>
      </div>
    </div>
  );
}

export function QueenChatAgent() {
  const [isOpen, setIsOpen] = useState(false);
  const [panel, setPanel] = useState<"chat" | "ticket">("chat");
  const [ticketStatus, setTicketStatus] = useState<string | null>(null);
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);
  const [unread, setUnread] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([{
    id: "welcome",
    role: "assistant",
    text: "Hey there! 👑 I'm Queen, your guide to Queenscustoms.shop. Whether you want to place a custom order, check pricing, or need help with an existing order — I've got you! What can I help you with today?",
    timestamp: new Date(),
  }]);

  const historyRef = useRef<Array<{ role: "user" | "model"; parts: Array<{ text: string }> }>>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

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
    const userMsg: Message = { id: Date.now().toString(), role: "user", text: text.trim(), timestamp: new Date() };
    setMessages(p => [...p, userMsg]);
    setInput("");
    setIsLoading(true);
    historyRef.current.push({ role: "user", parts: [{ text: text.trim() }] });

    try {
      const res = await fetch("/api/queen-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text.trim(), history: historyRef.current.slice(0, -1) }),
      });
      const data = await res.json() as { reply?: string; error?: string };
      const raw = data.reply ?? data.error ?? "I had a moment — please try again!";
      const { clean, action } = parseReply(raw);
      const assistantMsg: Message = { id: (Date.now() + 1).toString(), role: "assistant", text: clean, timestamp: new Date(), action };
      setMessages(p => [...p, assistantMsg]);
      historyRef.current.push({ role: "model", parts: [{ text: raw }] });
      if (!isOpen) setUnread(p => p + 1);
    } catch {
      setMessages(p => [...p, { id: (Date.now() + 1).toString(), role: "assistant", text: "Network error — check your connection and try again.", timestamp: new Date() }]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, isOpen]);

  async function handleTicketSubmit(ticket: TicketForm) {
    setIsSubmittingTicket(true);
    try {
      const res = await fetch("/api/queen-ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ticket),
      });
      const data = await res.json() as { success?: boolean; message?: string; error?: string };
      if (data.success && data.message) {
        setTicketStatus(data.message);
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
          setPanel("chat");
          setTicketStatus(null);
          setMessages(p => [...p, { id: Date.now().toString(), role: "assistant", text: `✅ ${data.message ?? "Ticket submitted!"}`, timestamp: new Date() }]);
        }, 2500);
      } else {
        setTicketStatus(data.error ?? "Something went wrong. Please try again.");
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => setTicketStatus(null), 3000);
      }
    } catch {
      setTicketStatus("Network error. Please try again.");
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setTicketStatus(null), 3000);
    } finally {
      setIsSubmittingTicket(false);
    }
  }

  function handleReset() {
    historyRef.current = [];
    setPanel("chat");
    setMessages([{ id: "welcome-" + Date.now(), role: "assistant", text: "Chat cleared! 👑 What can I help you with?", timestamp: new Date() }]);
  }

  const panelStyle: React.CSSProperties = {
    background: "linear-gradient(180deg,#0d0009 0%,#16000d 100%)",
    border: "1px solid rgba(219,39,119,0.3)",
    boxShadow: "0 0 40px rgba(219,39,119,0.2),0 20px 60px rgba(0,0,0,0.8)",
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setIsOpen(o => !o)}
        aria-label="Chat with Queen"
        className="fixed bottom-6 right-6 z-[9999] rounded-full transition-all duration-300"
        style={isOpen
          ? { width: 48, height: 48, background: "#1e1e2e", boxShadow: "0 4px 20px rgba(0,0,0,0.5)" }
          : {
              width: 64, height: 64,
              background: "linear-gradient(135deg,#db2777,#9d174d)",
              boxShadow: "0 0 0 3px #fbbf24, 0 8px 32px rgba(219,39,119,0.5)",
            }
        }
      >
        {isOpen ? (
          <X size={22} className="text-white mx-auto" />
        ) : (
          <div className="relative flex items-center justify-center w-full h-full">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-lg">👑</div>
            <QueenAvatar size={52} />
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white z-10">
                {unread}
              </span>
            )}
          </div>
        )}
      </button>

      {/* Chat window */}
      {isOpen && (
        <div
          className="fixed bottom-28 right-4 z-[9998] w-[calc(100vw-32px)] sm:w-96 rounded-2xl flex flex-col overflow-hidden"
          style={{ height: "min(560px,calc(100dvh-160px))", ...panelStyle }}
        >
          {/* Header */}
          <div
            className="px-4 py-3 flex items-center gap-3 flex-shrink-0"
            style={{ background: "linear-gradient(90deg,#9d174d 0%,#db2777 50%,#9d174d 100%)", borderBottom: "1px solid rgba(251,191,36,0.3)" }}
          >
            <QueenAvatar size={36} ring />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-white flex items-center gap-1">Queen <span className="text-yellow-300">👑</span></div>
              <div className="text-[10px] text-pink-200/70">Queenscustoms.shop · Always here for you</div>
            </div>
            {isLoading && (
              <div className="flex gap-0.5">
                {[0,1,2].map(i => (
                  <div key={i} className="w-1.5 h-1.5 bg-pink-300 rounded-full animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />
                ))}
              </div>
            )}
            <button onClick={handleReset} title="Clear chat" className="p-1.5 text-pink-200/60 hover:text-white rounded-lg hover:bg-white/10 transition-colors">
              <RotateCcw size={13} />
            </button>
            <button onClick={() => setIsOpen(false)} className="p-1.5 text-pink-200/60 hover:text-white rounded-lg hover:bg-white/10 transition-colors">
              <Minimize2 size={14} />
            </button>
          </div>

          {/* Body */}
          {panel === "ticket" ? (
            <div className="flex-1 overflow-y-auto">
              {ticketStatus ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 p-6 text-center">
                  <CheckCircle2 size={32} className="text-emerald-400" />
                  <p className="text-sm text-slate-300">{ticketStatus}</p>
                </div>
              ) : (
                <TicketFormPanel
                  onSubmit={handleTicketSubmit}
                  onCancel={() => setPanel("chat")}
                  isSubmitting={isSubmittingTicket}
                />
              )}
            </div>
          ) : (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {messages.map(msg => (
                  <div key={msg.id} className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                    {msg.role === "assistant" ? (
                      <QueenAvatar size={28} />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0">
                        <User size={12} className="text-slate-300" />
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] rounded-2xl px-3 py-2.5 text-xs leading-relaxed ${msg.role === "user" ? "rounded-tr-sm" : "rounded-tl-sm"}`}
                      style={msg.role === "user"
                        ? { background: "linear-gradient(135deg,#9d174d,#db2777)", color: "#fff" }
                        : { background: "rgba(219,39,119,0.08)", border: "1px solid rgba(219,39,119,0.15)", color: "#fce7f3" }}
                    >
                      <div className="space-y-0.5">{renderText(msg.text)}</div>
                      {msg.action === "create-ticket" && (
                        <button
                          onClick={() => setPanel("ticket")}
                          className="mt-2 w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-[11px] font-bold text-white transition-all"
                          style={{ background: "linear-gradient(135deg,#db2777,#9d174d)" }}
                        >
                          <Ticket size={11} /> Create Support Ticket
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex gap-2">
                    <QueenAvatar size={28} />
                    <div className="rounded-2xl rounded-tl-sm px-3 py-2.5 flex items-center gap-2" style={{ background: "rgba(219,39,119,0.08)", border: "1px solid rgba(219,39,119,0.15)" }}>
                      <div className="flex gap-1">
                        {[0,1,2].map(i => <div key={i} className="w-1.5 h-1.5 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />)}
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick chips */}
              {messages.length === 1 && (
                <div className="px-3 pb-2 flex-shrink-0">
                  <div className="text-[10px] text-pink-800 uppercase tracking-wider mb-1.5 font-semibold">Ask me anything</div>
                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_QUESTIONS.map(q => (
                      <button
                        key={q}
                        onClick={() => sendMessage(q)}
                        className="text-[10px] text-pink-300 hover:text-white px-2.5 py-1.5 rounded-xl transition-all font-medium"
                        style={{ background: "rgba(219,39,119,0.08)", border: "1px solid rgba(219,39,119,0.25)" }}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Ticket shortcut */}
              {messages.length > 1 && (
                <div className="px-3 pb-1 flex-shrink-0">
                  <button onClick={() => setPanel("ticket")} className="flex items-center gap-1 text-[10px] text-pink-600 hover:text-pink-400 transition-colors">
                    <Ticket size={10} /> Create support ticket
                  </button>
                </div>
              )}

              {/* Input */}
              <div className="border-t p-3 flex-shrink-0" style={{ borderColor: "rgba(219,39,119,0.2)" }}>
                <form onSubmit={e => { e.preventDefault(); sendMessage(input); }} className="flex items-center gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="Ask Queen anything…"
                    disabled={isLoading}
                    className="flex-1 rounded-xl px-3 py-2 text-sm text-white placeholder:text-slate-500 outline-none transition-colors"
                    style={{ background: "rgba(30,41,59,0.9)", border: "1px solid rgba(219,39,119,0.25)" }}
                    onFocus={e => { (e.currentTarget as HTMLInputElement).style.borderColor = "rgba(219,39,119,0.7)"; }}
                    onBlur={e => { (e.currentTarget as HTMLInputElement).style.borderColor = "rgba(219,39,119,0.25)"; }}
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || isLoading}
                    className="w-9 h-9 flex items-center justify-center text-white rounded-xl transition-all disabled:opacity-40 flex-shrink-0"
                    style={{ background: "linear-gradient(135deg,#db2777,#9d174d)" }}
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
