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

// ─── Constants ────────────────────────────────────────────────────────────────

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

// Brand colours (kept in one place for consistency)
const BRAND = {
  gradientBg: "linear-gradient(135deg, #be185d 0%, #9d174d 60%, #7c1d6f 100%)",
  gradientBtn: "linear-gradient(135deg, #db2777, #9d174d)",
  panelBg: "#0f172a",
  bubbleBg: "rgba(30,41,59,1)",       // fully opaque so text is always readable
  inputBg: "rgba(30,41,59,1)",
  borderPink: "rgba(236,72,153,0.35)",
  borderPinkFocus: "rgba(236,72,153,0.8)",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseReply(text: string): { clean: string; action?: "create-ticket" | "view-products" } {
  const isTicket = text.includes("[ACTION:create-ticket]");
  const isProducts = text.includes("[ACTION:view-products]");
  const clean = text
    .replace(/\[ACTION:create-ticket\]/g, "")
    .replace(/\[ACTION:view-products\]/g, "")
    .trim();
  if (isTicket) return { clean, action: "create-ticket" };
  if (isProducts) return { clean, action: "view-products" };
  return { clean };
}

// Renders text with markdown-like formatting using real JSX
// (avoids dangerouslySetInnerHTML so Tailwind classes are never at risk of being purged)
function renderText(text: string) {
  return text.split("\n").map((line, i) => {
    if (!line.trim()) return <div key={i} style={{ height: 4 }} />;

    // Bullet
    if (/^[-•]\s/.test(line)) {
      return (
        <div key={i} style={{ display: "flex", gap: 6, marginTop: 2 }}>
          <span style={{ color: "#f9a8d4", flexShrink: 0, marginTop: 1 }}>•</span>
          <span>{inlineFormat(line.replace(/^[-•]\s*/, ""))}</span>
        </div>
      );
    }

    // Numbered list
    const numMatch = line.match(/^(\d+)\.\s+(.*)/);
    if (numMatch) {
      return (
        <div key={i} style={{ display: "flex", gap: 6, marginTop: 2 }}>
          <span style={{ color: "#f9a8d4", flexShrink: 0, fontWeight: 700, fontSize: 11, marginTop: 1, minWidth: 14 }}>
            {numMatch[1]}.
          </span>
          <span>{inlineFormat(numMatch[2])}</span>
        </div>
      );
    }

    return <div key={i}>{inlineFormat(line)}</div>;
  });
}

// Renders inline bold and code as real React elements
function inlineFormat(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const re = /(\*\*(.+?)\*\*|`(.+?)`)/g;
  let last = 0;
  let m: RegExpExecArray | null;

  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));

    if (m[0].startsWith("**")) {
      parts.push(
        <strong key={m.index} style={{ color: "#ffffff", fontWeight: 700 }}>
          {m[2]}
        </strong>
      );
    } else {
      parts.push(
        <code
          key={m.index}
          style={{
            background: "rgba(51,65,85,0.9)",
            color: "#f9a8d4",
            padding: "0 4px",
            borderRadius: 4,
            fontSize: 10,
            fontFamily: "monospace",
          }}
        >
          {m[3]}
        </code>
      );
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts.length === 1 ? parts[0] : <>{parts}</>;
}

// ─── Queen Avatar ─────────────────────────────────────────────────────────────

function QueenAvatar({ size = "md", className = "" }: { size?: "sm" | "md" | "lg"; className?: string }) {
  const [imgErr, setImgErr] = useState(false);
  const px = { sm: 28, md: 32, lg: 42 };
  const iconPx = { sm: 12, md: 14, lg: 20 };
  const dim = px[size];

  if (!imgErr) {
    return (
      <img
        src="/queen-avatar.png"
        alt="Queen"
        onError={() => setImgErr(true)}
        className={className}
        style={{
          width: dim,
          height: dim,
          borderRadius: "50%",
          objectFit: "cover",
          flexShrink: 0,
          boxShadow: "0 0 0 2px rgba(236,72,153,0.5)",
        }}
      />
    );
  }

  return (
    <div
      className={className}
      style={{
        width: dim,
        height: dim,
        borderRadius: "50%",
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: BRAND.gradientBg,
        boxShadow: "0 0 0 2px rgba(236,72,153,0.5)",
      }}
    >
      <Crown size={iconPx[size]} color="#fde047" />
    </div>
  );
}

// ─── Support Ticket Form ──────────────────────────────────────────────────────

interface TicketFormPanelProps {
  onSubmit: (t: TicketForm) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

function TicketFormPanel({ onSubmit, onCancel, isSubmitting }: TicketFormPanelProps) {
  const [form, setForm] = useState<TicketForm>({ name: "", email: "", issueType: ISSUE_TYPES[0], description: "" });
  const set = (f: keyof TicketForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(p => ({ ...p, [f]: e.target.value }));
  const canSubmit = form.name.trim() && form.email.trim() && form.description.trim() && !isSubmitting;

  const fieldStyle: React.CSSProperties = {
    width: "100%",
    background: "#1e293b",
    border: "1px solid rgba(236,72,153,0.35)",
    borderRadius: 10,
    padding: "9px 12px",
    color: "#f1f5f9",           // slate-100 — bright, always readable
    fontSize: 13,
    outline: "none",
    boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: 10,
    fontWeight: 700,
    color: "#cbd5e1",          // slate-300 — clearly visible label
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    marginBottom: 5,
  };

  return (
    <div style={{ padding: 14, overflowY: "auto", maxHeight: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 14 }}>
        <Ticket size={14} color="#f472b6" />
        <span style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9" }}>Create Support Ticket</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div>
          <label style={labelStyle}>Your Name *</label>
          <input type="text" value={form.name} onChange={set("name")} placeholder="Full name" style={fieldStyle}
            onFocus={e => (e.target.style.borderColor = BRAND.borderPinkFocus)}
            onBlur={e => (e.target.style.borderColor = BRAND.borderPink)} />
        </div>

        <div>
          <label style={labelStyle}>Email Address *</label>
          <input type="email" value={form.email} onChange={set("email")} placeholder="your@email.com" style={fieldStyle}
            onFocus={e => (e.target.style.borderColor = BRAND.borderPinkFocus)}
            onBlur={e => (e.target.style.borderColor = BRAND.borderPink)} />
        </div>

        <div>
          <label style={labelStyle}>Issue Type *</label>
          <div style={{ position: "relative" }}>
            <select value={form.issueType} onChange={set("issueType")}
              style={{ ...fieldStyle, paddingRight: 28, appearance: "none", cursor: "pointer" }}>
              {ISSUE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <ChevronDown size={12} color="#94a3b8"
              style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
          </div>
        </div>

        <div>
          <label style={labelStyle}>Description *</label>
          <textarea value={form.description} onChange={set("description")}
            placeholder="Describe your question or issue…" rows={3}
            style={{ ...fieldStyle, resize: "none", lineHeight: 1.5 }}
            onFocus={e => (e.target.style.borderColor = BRAND.borderPinkFocus)}
            onBlur={e => (e.target.style.borderColor = BRAND.borderPink)} />
        </div>

        <div style={{ display: "flex", gap: 8, paddingTop: 4 }}>
          <button onClick={onCancel}
            style={{ flex: 1, padding: "9px 0", background: "#1e293b", border: "1px solid #334155",
              color: "#cbd5e1", fontSize: 12, fontWeight: 600, borderRadius: 10, cursor: "pointer" }}>
            Cancel
          </button>
          <button onClick={() => onSubmit(form)} disabled={!canSubmit}
            style={{ flex: 1, padding: "9px 0", background: canSubmit ? BRAND.gradientBtn : "#4b5563",
              border: "none", color: "#fff", fontSize: 12, fontWeight: 700, borderRadius: 10,
              cursor: canSubmit ? "pointer" : "not-allowed", display: "flex", alignItems: "center",
              justifyContent: "center", gap: 5 }}>
            {isSubmitting ? <><Loader2 size={11} className="animate-spin" /> Submitting…</> : <><Ticket size={11} /> Submit Ticket</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function QueenChatAgent() {
  const [isOpen, setIsOpen] = useState(false);
  const [panel, setPanel] = useState<"chat" | "ticket">("chat");
  const [ticketMsg, setTicketMsg] = useState<string | null>(null);
  const [ticketOk, setTicketOk] = useState(false);
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

  useEffect(() => {
    if (isOpen) {
      setUnread(0);
      setTimeout(() => inputRef.current?.focus(), 120);
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, panel]);

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
      const raw = data.reply ?? data.error ?? "I'm having a moment — please try again!";
      const { clean, action } = parseReply(raw);
      const assistantMsg: Message = { id: (Date.now() + 1).toString(), role: "assistant", text: clean, timestamp: new Date(), action };
      setMessages(p => [...p, assistantMsg]);
      historyRef.current.push({ role: "model", parts: [{ text: raw }] });
      if (!isOpen) setUnread(p => p + 1);
    } catch {
      setMessages(p => [...p, { id: (Date.now() + 1).toString(), role: "assistant",
        text: "Network error — please check your connection and try again.", timestamp: new Date() }]);
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
      const data = await res.json() as { success?: boolean; ticketId?: string; message?: string; error?: string };
      if (data.success) {
        setTicketMsg(data.message ?? "Ticket submitted!");
        setTicketOk(true);
        setTimeout(() => {
          setPanel("chat");
          setTicketMsg(null);
          setTicketOk(false);
          setMessages(p => [...p, {
            id: Date.now().toString(), role: "assistant",
            text: `✅ ${data.message ?? "Your ticket was submitted!"}`, timestamp: new Date(),
          }]);
        }, 2600);
      } else {
        setTicketMsg(data.error ?? "Something went wrong. Please try again.");
        setTicketOk(false);
        setTimeout(() => setTicketMsg(null), 3000);
      }
    } catch {
      setTicketMsg("Network error. Please try again.");
      setTicketOk(false);
      setTimeout(() => setTicketMsg(null), 3000);
    } finally {
      setIsSubmittingTicket(false);
    }
  }

  function handleReset() {
    historyRef.current = [];
    setPanel("chat");
    setMessages([{ id: "welcome-" + Date.now(), role: "assistant",
      text: "Chat cleared! What can Queen help you with today? 👑", timestamp: new Date() }]);
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      {/* ── Floating Button ── */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        title="Chat with Queen — Queenscustoms.shop"
        style={{
          position: "fixed",
          bottom: 24,
          right: 20,
          zIndex: 9999,
          width: 58,
          height: 58,
          borderRadius: "50%",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: isOpen ? "#374151" : BRAND.gradientBg,
          boxShadow: isOpen
            ? "0 4px 18px rgba(0,0,0,0.5)"
            : "0 4px 24px rgba(190,24,93,0.55), 0 0 0 3px rgba(190,24,93,0.2)",
          transition: "all 0.25s ease",
          transform: isOpen ? "scale(0.93)" : "scale(1)",
        }}
      >
        {isOpen ? (
          <X size={22} color="#ffffff" />
        ) : (
          <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <QueenAvatar size="lg" />
            {unread > 0 && (
              <span style={{
                position: "absolute", top: -6, right: -6,
                width: 18, height: 18, background: "#ef4444", borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 10, fontWeight: 700, color: "#fff",
              }}>
                {unread}
              </span>
            )}
          </div>
        )}
      </button>

      {/* ── Chat Panel ── */}
      {isOpen && (
        <div style={{
          position: "fixed",
          bottom: 92,
          right: 12,
          zIndex: 9998,
          width: "min(calc(100vw - 24px), 380px)",
          height: "min(540px, calc(100dvh - 112px))",
          background: BRAND.panelBg,
          border: `1px solid ${BRAND.borderPink}`,
          borderRadius: 18,
          boxShadow: "0 24px 56px rgba(0,0,0,0.65), 0 0 0 1px rgba(190,24,93,0.15)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}>

          {/* Header */}
          <div style={{
            background: BRAND.gradientBg,
            padding: "10px 14px",
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexShrink: 0,
            borderBottom: "1px solid rgba(255,255,255,0.12)",
          }}>
            <QueenAvatar size="md" />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#ffffff", lineHeight: 1.2, display: "flex", alignItems: "center", gap: 5 }}>
                Queen <span style={{ fontSize: 13 }}>👑</span>
              </div>
              <div style={{ fontSize: 11, color: "#fce7f3", lineHeight: 1.3, marginTop: 1 }}>
                Queenscustoms.shop · Custom Boutique
              </div>
            </div>
            <button onClick={() => { setPanel(p => p === "ticket" ? "chat" : "ticket"); setTicketMsg(null); }}
              title={panel === "ticket" ? "Back to chat" : "Create support ticket"}
              style={{ padding: 6, background: panel === "ticket" ? "rgba(255,255,255,0.2)" : "transparent",
                border: "none", cursor: "pointer", borderRadius: 8, color: "rgba(255,255,255,0.85)",
                display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.15s" }}>
              <Ticket size={15} color="inherit" />
            </button>
            <button onClick={handleReset} title="Clear chat"
              style={{ padding: 6, background: "transparent", border: "none", cursor: "pointer",
                borderRadius: 8, color: "rgba(255,255,255,0.7)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <RotateCcw size={13} color="inherit" />
            </button>
            <button onClick={() => setIsOpen(false)}
              style={{ padding: 6, background: "transparent", border: "none", cursor: "pointer",
                borderRadius: 8, color: "rgba(255,255,255,0.7)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Minimize2 size={14} color="inherit" />
            </button>
          </div>

          {/* ── Ticket Panel ── */}
          {panel === "ticket" && (
            <div style={{ flex: 1, overflowY: "auto", background: "rgba(15,23,42,0.97)" }}>
              {ticketMsg ? (
                <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center",
                  justifyContent: "center", padding: 24, textAlign: "center", gap: 10 }}>
                  {ticketOk
                    ? <CheckCircle2 size={44} color="#34d399" />
                    : <span style={{ fontSize: 28 }}>⚠️</span>}
                  <p style={{ fontSize: 13, color: ticketOk ? "#6ee7b7" : "#fca5a5", lineHeight: 1.5, maxWidth: 280 }}>
                    {ticketMsg}
                  </p>
                </div>
              ) : (
                <TicketFormPanel onSubmit={handleTicketSubmit} onCancel={() => setPanel("chat")} isSubmitting={isSubmittingTicket} />
              )}
            </div>
          )}

          {/* ── Chat Panel ── */}
          {panel === "chat" && (
            <>
              {/* Messages */}
              <div style={{ flex: 1, overflowY: "auto", padding: "12px 12px 6px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {messages.map(msg => (
                    <div key={msg.id} style={{ display: "flex", gap: 8,
                      flexDirection: msg.role === "user" ? "row-reverse" : "row", alignItems: "flex-end" }}>
                      {/* Avatar */}
                      {msg.role === "assistant"
                        ? <QueenAvatar size="sm" />
                        : <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#334155",
                            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <User size={13} color="#94a3b8" />
                          </div>
                      }
                      {/* Bubble */}
                      <div style={{
                        maxWidth: "78%",
                        borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                        padding: "10px 12px",
                        fontSize: 13,
                        lineHeight: 1.55,
                        color: "#f1f5f9",          // slate-100 — bright white-ish, always readable
                        background: msg.role === "user" ? BRAND.gradientBtn : BRAND.bubbleBg,
                        border: msg.role === "user" ? "none" : `1px solid ${BRAND.borderPink}`,
                      }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                          {renderText(msg.text)}
                        </div>

                        {/* Ticket CTA */}
                        {msg.action === "create-ticket" && (
                          <button onClick={() => setPanel("ticket")}
                            style={{ marginTop: 8, width: "100%", padding: "8px 0",
                              background: BRAND.gradientBtn, border: "none", borderRadius: 12,
                              color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer",
                              display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                            <Ticket size={11} color="#fff" /> Create Support Ticket
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Typing indicator */}
                  {isLoading && (
                    <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
                      <QueenAvatar size="sm" />
                      <div style={{ borderRadius: "18px 18px 18px 4px", padding: "10px 14px",
                        background: BRAND.bubbleBg, border: `1px solid ${BRAND.borderPink}`,
                        display: "flex", alignItems: "center", gap: 7 }}>
                        <Loader2 size={13} color="#f472b6" className="animate-spin" />
                        <span style={{ fontSize: 12, color: "#cbd5e1" }}>Queen is typing…</span>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Quick Questions */}
              {messages.length === 1 && (
                <div style={{ padding: "0 12px 10px", flexShrink: 0 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8",
                    textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 7 }}>
                    Popular questions
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {QUICK_QUESTIONS.slice(0, 5).map(q => (
                      <button key={q} onClick={() => sendMessage(q)}
                        style={{ fontSize: 11, fontWeight: 600, color: "#e2e8f0",   // bright enough to read
                          background: "#1e293b", border: `1px solid ${BRAND.borderPink}`,
                          padding: "6px 11px", borderRadius: 12, cursor: "pointer", transition: "all 0.15s" }}
                        onMouseEnter={e => {
                          (e.currentTarget as HTMLButtonElement).style.background = "rgba(157,23,77,0.35)";
                          (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(236,72,153,0.7)";
                          (e.currentTarget as HTMLButtonElement).style.color = "#fff";
                        }}
                        onMouseLeave={e => {
                          (e.currentTarget as HTMLButtonElement).style.background = "#1e293b";
                          (e.currentTarget as HTMLButtonElement).style.borderColor = BRAND.borderPink;
                          (e.currentTarget as HTMLButtonElement).style.color = "#e2e8f0";
                        }}>
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input row */}
              <div style={{
                padding: "10px 12px",
                flexShrink: 0,
                borderTop: `1px solid ${BRAND.borderPink}`,
                background: "rgba(15,23,42,0.95)",
              }}>
                <form onSubmit={e => { e.preventDefault(); sendMessage(input); }}
                  style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="Ask Queen anything…"
                    disabled={isLoading}
                    style={{
                      flex: 1,
                      background: BRAND.inputBg,
                      border: `1px solid ${BRAND.borderPink}`,
                      borderRadius: 12,
                      padding: "9px 14px",
                      fontSize: 13,
                      color: "#f1f5f9",          // bright text in input
                      outline: "none",
                    }}
                    onFocus={e => (e.target.style.borderColor = BRAND.borderPinkFocus)}
                    onBlur={e => (e.target.style.borderColor = BRAND.borderPink)}
                  />
                  <button type="submit" disabled={!input.trim() || isLoading}
                    style={{ width: 38, height: 38, flexShrink: 0,
                      background: input.trim() && !isLoading ? BRAND.gradientBtn : "#374151",
                      border: "none", borderRadius: 12, cursor: input.trim() && !isLoading ? "pointer" : "not-allowed",
                      display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.2s" }}>
                    <Send size={15} color="#ffffff" />
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
