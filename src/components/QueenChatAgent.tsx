import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  X, Send, Loader2, User, Minimize2, RotateCcw,
  Crown, Ticket, ChevronDown, ChevronUp, CheckCircle2,
  AlertCircle, Sparkles
} from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: Date;
  type?: "support-ticket-form" | "support-ticket-confirm" | "normal";
}

interface SupportTicket {
  name: string;
  email: string;
  subject: string;
  message: string;
  category: "order" | "custom" | "shipping" | "return" | "general";
}

const TICKET_CATEGORIES = [
  { value: "order", label: "Order Status" },
  { value: "custom", label: "Custom Request" },
  { value: "shipping", label: "Shipping / Delivery" },
  { value: "return", label: "Return / Exchange" },
  { value: "general", label: "General Question" },
] as const;

const QUICK_QUESTIONS = [
  "What custom items do you offer?",
  "How do I place a custom order?",
  "What are your shipping times?",
  "Tell me about the creator",
  "Can I return an item?",
  "Create a support ticket",
];

function formatInline(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-pink-200 font-semibold">$1</strong>')
    .replace(/`(.+?)`/g, '<code class="bg-pink-900/40 text-pink-300 px-1 rounded text-[10px] font-mono">$1</code>');
}

function renderText(text: string) {
  const lines = text.split("\n");
  return lines.map((line, i) => {
    if (line.startsWith("- ") || line.startsWith("• ")) {
      const content = line.replace(/^[-•]\s*/, "");
      return (
        <div key={i} className="flex gap-2 my-0.5">
          <span className="text-pink-400 flex-shrink-0 mt-0.5">♛</span>
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
      return <div key={i} className="font-bold text-white mt-1" dangerouslySetInnerHTML={{ __html: formatInline(line) }} />;
    }
    if (!line.trim()) return <div key={i} className="h-1" />;
    return <div key={i} dangerouslySetInnerHTML={{ __html: formatInline(line) }} />;
  });
}

function QueenAvatar({ size = 32, className = "" }: { size?: number; className?: string }) {
  const [src, setSrc] = useState<string>("/queen-avatar.jpg");
  const [failed, setFailed] = useState(false);

  function handleError() {
    if (src === "/queen-avatar.jpg") {
      setSrc("/queen-avatar.svg");
    } else {
      setFailed(true);
    }
  }

  if (failed) {
    return (
      <div
        className={`rounded-full flex-shrink-0 flex items-center justify-center ${className}`}
        style={{
          width: size,
          height: size,
          background: "linear-gradient(135deg, #d63384 0%, #8b0057 100%)",
          fontSize: size * 0.45,
        }}
      >
        👑
      </div>
    );
  }

  return (
    <div
      className={`rounded-full overflow-hidden flex-shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      <img
        src={src}
        alt="Queen"
        className="w-full h-full object-cover"
        onError={handleError}
      />
    </div>
  );
}

function SupportTicketForm({ onSubmit, onCancel }: {
  onSubmit: (ticket: SupportTicket) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<SupportTicket>({
    name: "",
    email: "",
    subject: "",
    message: "",
    category: "general",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof SupportTicket, string>>>({});
  const [submitting, setSubmitting] = useState(false);

  function validate(): boolean {
    const newErrors: Partial<Record<keyof SupportTicket, string>> = {};
    if (!form.name.trim()) newErrors.name = "Name is required";
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) newErrors.email = "Valid email required";
    if (!form.subject.trim()) newErrors.subject = "Subject is required";
    if (!form.message.trim()) newErrors.message = "Message is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/queen-ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        // Call onSubmit before clearing submitting state so the parent can
        // unmount this form cleanly without triggering state-on-unmounted warnings.
        onSubmit(form);
        return;
      } else {
        const data = await res.json();
        setErrors({ message: data.error || "Failed to submit ticket. Please try again." });
        setSubmitting(false);
      }
    } catch {
      setErrors({ message: "Network error. Please try again." });
      setSubmitting(false);
    }
  }

  const inputCls = "w-full bg-black/30 border border-pink-900/50 focus:border-pink-500 rounded-xl px-3 py-2 text-xs text-white placeholder:text-pink-900 outline-none transition-colors";
  const errorCls = "text-[10px] text-red-400 mt-0.5";

  return (
    <form onSubmit={handleSubmit} className="space-y-2 text-xs">
      <div className="text-[11px] font-bold text-pink-300 mb-1 flex items-center gap-1">
        <Ticket size={11} /> Submit a Support Ticket
      </div>

      <div>
        <select
          value={form.category}
          onChange={e => setForm(p => ({ ...p, category: e.target.value as SupportTicket["category"] }))}
          className={inputCls + " appearance-none cursor-pointer"}
        >
          {TICKET_CATEGORIES.map(c => (
            <option key={c.value} value={c.value} className="bg-gray-900">{c.label}</option>
          ))}
        </select>
      </div>

      <div>
        <input
          type="text"
          placeholder="Your name *"
          value={form.name}
          onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
          className={inputCls}
        />
        {errors.name && <div className={errorCls}>{errors.name}</div>}
      </div>

      <div>
        <input
          type="email"
          placeholder="Your email *"
          value={form.email}
          onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
          className={inputCls}
        />
        {errors.email && <div className={errorCls}>{errors.email}</div>}
      </div>

      <div>
        <input
          type="text"
          placeholder="Subject *"
          value={form.subject}
          onChange={e => setForm(p => ({ ...p, subject: e.target.value }))}
          className={inputCls}
        />
        {errors.subject && <div className={errorCls}>{errors.subject}</div>}
      </div>

      <div>
        <textarea
          placeholder="Describe your issue or question… *"
          value={form.message}
          onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
          rows={3}
          className={inputCls + " resize-none"}
        />
        {errors.message && <div className={errorCls}>{errors.message}</div>}
      </div>

      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2 border border-pink-900/50 text-pink-400 rounded-xl text-[11px] font-semibold hover:bg-pink-900/20 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 py-2 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 disabled:opacity-50 text-white rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1"
        >
          {submitting ? <Loader2 size={11} className="animate-spin" /> : <Send size={11} />}
          {submitting ? "Sending…" : "Submit"}
        </button>
      </div>
    </form>
  );
}

export function QueenChatAgent() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showTicketForm, setShowTicketForm] = useState(false);
  const ticketSuccessTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      text: "Hey gorgeous! 👑 I'm Queen — your personal guide to Queenscustoms.shop. Whether you want to explore our custom creations, learn about the designer behind the magic, track an order, or get help with anything else — I've got you covered. What can I do for you today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [unread, setUnread] = useState(0);
  const [ticketSuccess, setTicketSuccess] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const historyRef = useRef<Array<{ role: "user" | "model"; parts: Array<{ text: string }> }>>([]);

  useEffect(() => {
    if (isOpen) {
      setUnread(0);
      setIsMinimized(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isMinimized]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;

    // Ticket form trigger
    if (
      text.toLowerCase().includes("support ticket") ||
      text.toLowerCase().includes("create ticket") ||
      text.toLowerCase().includes("submit ticket") ||
      text.toLowerCase().includes("open ticket")
    ) {
      setMessages(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "user",
          text,
          timestamp: new Date(),
        },
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          text: "Of course! Let me pull up the support form for you. Fill in your details and I'll make sure the team hears you. 💌",
          timestamp: new Date(),
          type: "support-ticket-form",
        },
      ]);
      setInput("");
      setShowTicketForm(true);
      return;
    }

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

      const data = await res.json();
      const raw = data.reply ?? data.error ?? "I had a little hiccup there. Mind trying again?";

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        text: raw,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMsg]);
      historyRef.current.push({ role: "model", parts: [{ text: raw }] });
      if (!isOpen) setUnread(prev => prev + 1);
    } catch {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        text: "Looks like we hit a network snag. Check your connection and try again, darling!",
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, isOpen]);

  function handleTicketSubmit(ticket: SupportTicket) {
    setShowTicketForm(false);
    setTicketSuccess(true);
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: "assistant",
      text: `✅ **Ticket submitted!**\n\nThank you, ${ticket.name}! Your support request has been received. We'll get back to you at **${ticket.email}** as soon as possible — usually within 24–48 hours. Is there anything else I can help you with today?`,
      timestamp: new Date(),
    }]);
    if (ticketSuccessTimer.current) clearTimeout(ticketSuccessTimer.current);
    ticketSuccessTimer.current = setTimeout(() => setTicketSuccess(false), 3000);
  }

  useEffect(() => {
    return () => {
      if (ticketSuccessTimer.current) clearTimeout(ticketSuccessTimer.current);
    };
  }, []);

  function handleReset() {
    historyRef.current = [];
    setShowTicketForm(false);
    setMessages([{
      id: "welcome-" + Date.now(),
      role: "assistant",
      text: "Chat cleared! 👑 What would you like to know about Queenscustoms.shop?",
      timestamp: new Date(),
    }]);
  }

  return (
    <>
      {/* Floating Bubble */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Chat with Queen"
        className={`fixed bottom-6 right-5 z-50 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 group ${
          isOpen
            ? "w-12 h-12 bg-gray-800 hover:bg-gray-700 scale-95"
            : "w-16 h-16 hover:scale-110"
        }`}
        style={isOpen ? {} : {
          background: "linear-gradient(135deg, #d63384 0%, #8b0057 100%)",
          boxShadow: "0 0 0 3px #ffd700, 0 8px 32px rgba(214,51,132,0.5)",
        }}
      >
        {isOpen ? (
          <X size={22} className="text-white" />
        ) : (
          <div className="relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-lg leading-none">👑</div>
            <QueenAvatar size={48} />
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white z-10">
                {unread}
              </span>
            )}
          </div>
        )}
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div
          className="fixed bottom-28 right-4 z-50 w-[calc(100vw-32px)] sm:w-96 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          style={{
            height: isMinimized ? "auto" : "min(520px, calc(100dvh - 160px))",
            background: "linear-gradient(180deg, #0d0009 0%, #16000d 100%)",
            border: "1px solid rgba(214,51,132,0.3)",
            boxShadow: "0 0 40px rgba(214,51,132,0.2), 0 20px 60px rgba(0,0,0,0.8)",
          }}
        >
          {/* Header */}
          <div
            className="px-4 py-3 flex items-center gap-3 flex-shrink-0 cursor-pointer"
            style={{
              background: "linear-gradient(90deg, #8b0057 0%, #d63384 50%, #8b0057 100%)",
              borderBottom: "1px solid rgba(255,215,0,0.3)",
            }}
            onClick={() => setIsMinimized(m => !m)}
          >
            <div className="ring-2 ring-yellow-400 rounded-full flex-shrink-0">
              <QueenAvatar size={36} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-white flex items-center gap-1 leading-tight">
                Queen
                <span className="text-yellow-300 text-base">👑</span>
              </div>
              <div className="text-[10px] text-pink-200/70 leading-tight">Queenscustoms.shop · Always here for you</div>
            </div>

            {isLoading && (
              <div className="flex gap-0.5">
                {[0, 1, 2].map(i => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 bg-pink-300 rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            )}

            <button
              onClick={e => { e.stopPropagation(); handleReset(); }}
              title="Clear chat"
              className="p-1.5 text-pink-200/60 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
            >
              <RotateCcw size={13} />
            </button>
            <button
              onClick={e => { e.stopPropagation(); setIsMinimized(m => !m); }}
              className="p-1.5 text-pink-200/60 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
            >
              {isMinimized ? <ChevronUp size={14} /> : <Minimize2 size={14} />}
            </button>
          </div>

          {!isMinimized && (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-thin">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                    {/* Avatar */}
                    {msg.role === "assistant" ? (
                      <QueenAvatar size={28} />
                    ) : (
                      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gray-700 flex items-center justify-center">
                        <User size={12} className="text-gray-300" />
                      </div>
                    )}

                    {/* Bubble */}
                    <div
                      className={`max-w-[80%] rounded-2xl px-3 py-2.5 text-xs leading-relaxed ${
                        msg.role === "user"
                          ? "rounded-tr-sm text-white"
                          : "rounded-tl-sm text-pink-100"
                      }`}
                      style={msg.role === "user"
                        ? { background: "linear-gradient(135deg, #9c005e, #d63384)" }
                        : { background: "rgba(214,51,132,0.08)", border: "1px solid rgba(214,51,132,0.15)" }
                      }
                    >
                      <div className="space-y-0.5">
                        {renderText(msg.text)}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Inline support ticket form */}
                {showTicketForm && (
                  <div
                    className="rounded-2xl p-3"
                    style={{ background: "rgba(214,51,132,0.08)", border: "1px solid rgba(214,51,132,0.2)" }}
                  >
                    <SupportTicketForm
                      onSubmit={handleTicketSubmit}
                      onCancel={() => {
                        setShowTicketForm(false);
                        setMessages(prev => [...prev, {
                          id: Date.now().toString(),
                          role: "assistant",
                          text: "No problem! Is there anything else I can help you with?",
                          timestamp: new Date(),
                        }]);
                      }}
                    />
                  </div>
                )}

                {/* Ticket success toast */}
                {ticketSuccess && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-emerald-300"
                    style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)" }}
                  >
                    <CheckCircle2 size={13} />
                    Ticket submitted successfully!
                  </div>
                )}

                {/* Loading dots */}
                {isLoading && (
                  <div className="flex gap-2">
                    <QueenAvatar size={28} />
                    <div
                      className="rounded-2xl rounded-tl-sm px-3 py-2.5 flex items-center gap-2"
                      style={{ background: "rgba(214,51,132,0.08)", border: "1px solid rgba(214,51,132,0.15)" }}
                    >
                      <div className="flex gap-1">
                        {[0, 1, 2].map(i => (
                          <div
                            key={i}
                            className="w-1.5 h-1.5 bg-pink-400 rounded-full animate-bounce"
                            style={{ animationDelay: `${i * 0.15}s` }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Quick Questions — shown on first message only */}
              {messages.length === 1 && !showTicketForm && (
                <div className="px-3 pb-2 flex-shrink-0">
                  <div className="text-[10px] text-pink-700 uppercase tracking-wider mb-1.5 font-semibold">Ask me anything</div>
                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_QUESTIONS.map(q => (
                      <button
                        key={q}
                        onClick={() => sendMessage(q)}
                        className="text-[10px] text-pink-300 hover:text-white px-2.5 py-1.5 rounded-xl transition-all font-medium"
                        style={{
                          background: "rgba(214,51,132,0.08)",
                          border: "1px solid rgba(214,51,132,0.25)",
                        }}
                        onMouseEnter={e => {
                          (e.currentTarget as HTMLButtonElement).style.background = "rgba(214,51,132,0.2)";
                          (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(214,51,132,0.6)";
                        }}
                        onMouseLeave={e => {
                          (e.currentTarget as HTMLButtonElement).style.background = "rgba(214,51,132,0.08)";
                          (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(214,51,132,0.25)";
                        }}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Support ticket quick-access button */}
              {!showTicketForm && messages.length > 1 && (
                <div className="px-3 pb-1 flex-shrink-0">
                  <button
                    onClick={() => sendMessage("Create a support ticket")}
                    className="flex items-center gap-1.5 text-[10px] text-pink-400 hover:text-pink-200 transition-colors font-medium"
                  >
                    <Ticket size={10} /> Create support ticket
                  </button>
                </div>
              )}

              {/* Input bar */}
              {!showTicketForm && (
                <div
                  className="border-t p-3 flex-shrink-0"
                  style={{ borderColor: "rgba(214,51,132,0.2)" }}
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
                      className="flex-1 rounded-xl px-3 py-2 text-sm text-white placeholder:text-pink-900 outline-none transition-colors"
                      style={{
                        background: "rgba(214,51,132,0.06)",
                        border: "1px solid rgba(214,51,132,0.2)",
                      }}
                      onFocus={e => {
                        (e.currentTarget as HTMLInputElement).style.borderColor = "rgba(214,51,132,0.6)";
                      }}
                      onBlur={e => {
                        (e.currentTarget as HTMLInputElement).style.borderColor = "rgba(214,51,132,0.2)";
                      }}
                    />
                    <button
                      type="submit"
                      disabled={!input.trim() || isLoading}
                      className="flex-shrink-0 w-9 h-9 flex items-center justify-center text-white rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{ background: "linear-gradient(135deg, #9c005e, #d63384)" }}
                    >
                      <Send size={14} />
                    </button>
                  </form>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </>
  );
}
