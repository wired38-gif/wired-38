import React, { useState, useEffect, useCallback } from "react";
import { Crown, LogOut, RefreshCw, Ticket, CheckCircle2, Clock, AlertCircle, Eye, EyeOff, ArrowLeft } from "lucide-react";

interface SupportTicket {
  id: string;
  name: string;
  email: string;
  issueType: string;
  description: string;
  status: "open" | "in-progress" | "resolved";
  createdAt: string;
  updatedAt: string;
}

interface AdminDashboardProps {
  onNavigate: (path: string) => void;
}

const STATUS_CONFIG = {
  open:         { label: "Open",        color: "text-red-400",    bg: "bg-red-500/10",    border: "border-red-500/30",    icon: <AlertCircle size={12} /> },
  "in-progress":{ label: "In Progress", color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/30", icon: <Clock size={12} /> },
  resolved:     { label: "Resolved",    color: "text-emerald-400",bg: "bg-emerald-500/10",border: "border-emerald-500/30",icon: <CheckCircle2 size={12} /> },
} as const;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function LoginForm({ onLogin }: { onLogin: () => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json() as { authenticated?: boolean; error?: string };
      if (data.authenticated) {
        onLogin();
      } else {
        setError(data.error ?? "Invalid credentials.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const inputCls = "w-full rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none transition-colors bg-slate-800/80 border border-slate-700 focus:border-pink-500";

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#0d0009" }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: "linear-gradient(135deg,#db2777,#9d174d)" }}>
            <Crown size={28} className="text-yellow-300" />
          </div>
          <h1 className="text-2xl font-black text-white">Admin Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">Queenscustoms.shop</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-slate-400 uppercase tracking-wider font-semibold block mb-1.5">Username</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Admin username"
              autoComplete="username"
              className={inputCls}
            />
          </div>

          <div>
            <label className="text-xs text-slate-400 uppercase tracking-wider font-semibold block mb-1.5">Password</label>
            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Admin password"
                autoComplete="current-password"
                className={inputCls + " pr-10"}
              />
              <button type="button" onClick={() => setShowPass(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="text-sm text-red-400 flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
              <AlertCircle size={14} /> {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !username || !password}
            className="w-full py-3 text-white font-bold rounded-xl transition-all disabled:opacity-40"
            style={{ background: "linear-gradient(135deg,#db2777,#9d174d)" }}
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}

export function AdminDashboard({ onNavigate }: AdminDashboardProps) {
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<"all" | "open" | "in-progress" | "resolved">("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  async function checkAuth() {
    try {
      const res = await fetch("/api/admin/me");
      const data = await res.json() as { authenticated: boolean };
      setAuthed(data.authenticated);
    } catch {
      setAuthed(false);
    } finally {
      setChecking(false);
    }
  }

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/tickets");
      const data = await res.json() as { tickets: SupportTicket[] };
      setTickets(data.tickets ?? []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void checkAuth(); }, []);
  useEffect(() => { if (authed) void fetchTickets(); }, [authed, fetchTickets]);

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    setAuthed(false);
  }

  async function updateStatus(id: string, status: SupportTicket["status"]) {
    try {
      await fetch(`/api/admin/tickets/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      setTickets(prev => prev.map(t => t.id === id ? { ...t, status, updatedAt: new Date().toISOString() } : t));
    } catch { /* ignore */ }
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0d0009" }}>
        <div className="w-6 h-6 border-2 border-pink-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!authed) return <LoginForm onLogin={() => { setAuthed(true); }} />;

  const filtered = filter === "all" ? tickets : tickets.filter(t => t.status === filter);
  const counts = { all: tickets.length, open: tickets.filter(t => t.status === "open").length, "in-progress": tickets.filter(t => t.status === "in-progress").length, resolved: tickets.filter(t => t.status === "resolved").length };

  return (
    <div className="min-h-screen" style={{ background: "#0d0009" }}>
      {/* Header */}
      <div className="sticky top-0 z-40 border-b px-4 h-14 flex items-center gap-3" style={{ background: "rgba(13,0,9,0.95)", backdropFilter: "blur(12px)", borderColor: "rgba(219,39,119,0.2)" }}>
        <button onClick={() => onNavigate("/")} className="p-1.5 text-slate-500 hover:text-white rounded-lg transition-colors">
          <ArrowLeft size={16} />
        </button>
        <Crown size={18} className="text-yellow-400" />
        <span className="text-sm font-bold text-white flex-1">Admin · Queenscustoms.shop</span>
        <button onClick={() => void fetchTickets()} className="p-1.5 text-slate-500 hover:text-white rounded-lg transition-colors" title="Refresh">
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
        </button>
        <button onClick={handleLogout} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-white transition-colors">
          <LogOut size={14} /> Sign out
        </button>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {(["all","open","in-progress","resolved"] as const).map(s => {
            const cfg = s === "all" ? { label: "Total", color: "text-white", bg: "bg-white/5", border: "border-white/10", icon: <Ticket size={14} /> } : STATUS_CONFIG[s];
            return (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`rounded-xl p-4 text-left border transition-all ${cfg.bg} ${cfg.border} ${filter === s ? "ring-1 ring-pink-500" : ""}`}
              >
                <div className={`flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider mb-1 ${cfg.color}`}>
                  {cfg.icon} {cfg.label}
                </div>
                <div className={`text-2xl font-black ${cfg.color}`}>{counts[s]}</div>
              </button>
            );
          })}
        </div>

        {/* Tickets */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-600">
            <Ticket size={32} className="mx-auto mb-3 opacity-40" />
            <p className="text-sm">No {filter === "all" ? "" : filter} tickets yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(ticket => {
              const cfg = STATUS_CONFIG[ticket.status];
              const isExpanded = expanded === ticket.id;
              return (
                <div
                  key={ticket.id}
                  className="rounded-2xl border transition-all"
                  style={{ background: "rgba(219,39,119,0.04)", borderColor: "rgba(219,39,119,0.15)" }}
                >
                  <button
                    className="w-full px-4 py-3.5 flex items-start gap-3 text-left"
                    onClick={() => setExpanded(isExpanded ? null : ticket.id)}
                  >
                    <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full border flex-shrink-0 mt-0.5 ${cfg.color} ${cfg.bg} ${cfg.border}`}>
                      {cfg.icon} {cfg.label}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="text-xs font-bold text-white">{ticket.name}</span>
                        <span className="text-[10px] text-slate-500">{ticket.email}</span>
                        <span className="text-[10px] font-mono text-pink-700">{ticket.id}</span>
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5 truncate">{ticket.issueType} — {ticket.description.slice(0, 80)}{ticket.description.length > 80 ? "…" : ""}</div>
                      <div className="text-[10px] text-slate-600 mt-0.5">{formatDate(ticket.createdAt)}</div>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t px-4 py-4 space-y-4" style={{ borderColor: "rgba(219,39,119,0.1)" }}>
                      <div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-1">Description</div>
                        <p className="text-sm text-slate-300 leading-relaxed">{ticket.description}</p>
                      </div>

                      <div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-2">Update Status</div>
                        <div className="flex gap-2 flex-wrap">
                          {(["open","in-progress","resolved"] as const).map(s => {
                            const c = STATUS_CONFIG[s];
                            return (
                              <button
                                key={s}
                                onClick={() => void updateStatus(ticket.id, s)}
                                className={`flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-full border transition-all ${c.color} ${c.bg} ${c.border} ${ticket.status === s ? "ring-1 ring-pink-500 opacity-100" : "opacity-60 hover:opacity-100"}`}
                              >
                                {c.icon} {c.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <a
                        href={`mailto:${ticket.email}?subject=Re: Your Queenscustoms.shop Request (${ticket.id})`}
                        className="inline-flex items-center gap-1.5 text-xs text-pink-400 hover:text-pink-300 transition-colors"
                      >
                        Reply via email →
                      </a>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
