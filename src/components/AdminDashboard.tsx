import React, { useState, useEffect, useCallback } from "react";
import {
  Crown, Ticket, Users, LogOut, Loader2, AlertCircle,
  CheckCircle2, Clock, Eye, EyeOff, RefreshCw, Mail,
  Calendar, Tag, FileText, ChevronDown, ChevronUp,
  Lock, Shield
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

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

interface Trainee {
  name: string;
  email: string;
  property: string;
  pin: string;
  createdAt: string;
  lastActiveAt: string;
  completedWorkflows: number;
  workflowsStarted: number;
}

// ─── Login Panel ──────────────────────────────────────────────────────────────

function AdminLogin({ onLogin }: { onLogin: () => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
        credentials: "include",
      });
      const data = await res.json() as { authenticated?: boolean; error?: string };
      if (data.authenticated) {
        onLogin();
      } else {
        setError(data.error ?? "Invalid credentials.");
      }
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-5">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: "linear-gradient(135deg, #9d174d, #7c1d6f)" }}
          >
            <Crown size={32} className="text-yellow-300" />
          </div>
          <h1 className="text-xl font-black text-white">Queenscustoms Admin</h1>
          <p className="text-xs text-slate-500 mt-1">Sign in to manage tickets and accounts</p>
        </div>

        {/* Card */}
        <div className="bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden">
          <div
            className="px-6 py-3 flex items-center gap-2"
            style={{ background: "linear-gradient(135deg, rgba(157,23,77,0.3), rgba(124,29,111,0.3))" }}
          >
            <Shield size={14} className="text-pink-400" />
            <span className="text-xs font-semibold text-pink-300">Administrator Access</span>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                autoFocus
                placeholder="admin"
                className="w-full bg-slate-800 border border-slate-700 focus:border-pink-500 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 outline-none transition-colors text-sm"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-800 border border-slate-700 focus:border-pink-500 rounded-xl px-4 py-3 pr-10 text-white placeholder:text-slate-600 outline-none transition-colors text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/30 rounded-xl px-3 py-2.5">
                <AlertCircle size={13} className="text-rose-400 flex-shrink-0" />
                <p className="text-xs text-rose-300">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !username || !password}
              className="w-full py-3.5 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: "linear-gradient(135deg, #db2777, #9d174d)" }}
            >
              {loading ? (
                <><Loader2 size={15} className="animate-spin" /> Signing in…</>
              ) : (
                <><Lock size={14} /> Sign In</>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-[11px] text-slate-600 mt-4">
          Set ADMIN_USERNAME &amp; ADMIN_PASSWORD in server environment
        </p>
      </div>
    </div>
  );
}

// ─── Ticket Card ──────────────────────────────────────────────────────────────

function TicketCard({ ticket }: { ticket: SupportTicket }) {
  const [expanded, setExpanded] = useState(false);

  const statusConfig = {
    open: { label: "Open", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/30" },
    "in-progress": { label: "In Progress", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/30" },
    resolved: { label: "Resolved", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/30" },
  };

  const cfg = statusConfig[ticket.status];

  return (
    <div className="bg-slate-800/60 border border-slate-700 rounded-xl overflow-hidden hover:border-pink-500/30 transition-colors">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 flex items-start gap-3 text-left"
      >
        <div
          className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center mt-0.5"
          style={{ background: "rgba(157,23,77,0.2)" }}
        >
          <Ticket size={14} className="text-pink-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-white font-mono">{ticket.id}</span>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.color}`}>
              {cfg.label}
            </span>
            <span className="text-[10px] text-slate-500 ml-auto flex-shrink-0">
              {new Date(ticket.createdAt).toLocaleDateString()}
            </span>
          </div>
          <div className="text-xs text-slate-300 font-medium mt-0.5 truncate">{ticket.name}</div>
          <div className="text-[10px] text-slate-500 truncate">{ticket.issueType}</div>
        </div>
        {expanded ? (
          <ChevronUp size={14} className="text-slate-500 flex-shrink-0 mt-1" />
        ) : (
          <ChevronDown size={14} className="text-slate-500 flex-shrink-0 mt-1" />
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-slate-700/60 pt-3 space-y-2">
          <div className="flex items-center gap-2 text-xs">
            <Mail size={11} className="text-slate-500 flex-shrink-0" />
            <a href={`mailto:${ticket.email}`} className="text-pink-400 hover:text-pink-300 transition-colors">
              {ticket.email}
            </a>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <Tag size={11} className="text-slate-500 flex-shrink-0" />
            <span className="text-slate-300">{ticket.issueType}</span>
          </div>
          <div className="flex items-start gap-2 text-xs">
            <FileText size={11} className="text-slate-500 flex-shrink-0 mt-0.5" />
            <p className="text-slate-300 leading-relaxed">{ticket.description}</p>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-slate-600">
            <Clock size={10} className="flex-shrink-0" />
            <span>Submitted {new Date(ticket.createdAt).toLocaleString()}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Trainee Row ─────────────────────────────────────────────────────────────

function TraineeRow({ trainee }: { trainee: Trainee }) {
  return (
    <div className="bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-3 flex items-center gap-3 hover:border-indigo-500/30 transition-colors">
      <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
        <span className="text-xs font-black text-indigo-300">
          {trainee.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-bold text-white truncate">{trainee.name}</div>
        <div className="text-[10px] text-slate-500 truncate">{trainee.email} · {trainee.property}</div>
      </div>
      <div className="text-right flex-shrink-0 space-y-0.5">
        <div className="text-[10px] text-emerald-400 font-semibold">
          {trainee.completedWorkflows} done
        </div>
        <div className="text-[10px] text-slate-500">
          {trainee.workflowsStarted} started
        </div>
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const [tab, setTab] = useState<"tickets" | "trainees">("tickets");
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [trainees, setTrainees] = useState<Trainee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"all" | "open" | "in-progress" | "resolved">("all");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [ticketRes, traineeRes] = await Promise.all([
        fetch("/api/admin/queen-tickets", { credentials: "include" }),
        fetch("/api/admin/trainees", { credentials: "include" }),
      ]);

      if (ticketRes.status === 401 || traineeRes.status === 401) {
        onLogout();
        return;
      }

      const ticketData = await ticketRes.json() as { tickets?: SupportTicket[]; error?: string };
      const traineeData = await traineeRes.json() as { trainees?: Trainee[]; error?: string };

      if (ticketData.tickets) setTickets(ticketData.tickets);
      if (traineeData.trainees) setTrainees(traineeData.trainees);
    } catch {
      setError("Failed to load data. Please refresh.");
    } finally {
      setLoading(false);
    }
  }, [onLogout]);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function handleLogout() {
    await fetch("/api/logout", { method: "POST", credentials: "include" });
    onLogout();
  }

  const openTickets = tickets.filter(t => t.status === "open").length;
  const filteredTickets =
    filter === "all" ? tickets : tickets.filter(t => t.status === filter);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header
        className="sticky top-0 z-20 border-b"
        style={{
          background: "linear-gradient(135deg, rgba(157,23,77,0.95), rgba(124,29,111,0.95))",
          backdropFilter: "blur(12px)",
          borderColor: "rgba(255,255,255,0.1)",
        }}
      >
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center gap-3">
          <Crown size={20} className="text-yellow-300 flex-shrink-0" />
          <span className="font-black text-white text-sm flex-1">
            Queenscustoms Admin
          </span>
          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg text-xs font-semibold transition-colors"
          >
            <LogOut size={13} />
            Sign out
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-slate-900 border border-pink-500/20 rounded-2xl p-4 text-center">
            <div className="text-2xl font-black text-pink-400">{tickets.length}</div>
            <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mt-0.5">Total Tickets</div>
          </div>
          <div className="bg-slate-900 border border-amber-500/20 rounded-2xl p-4 text-center">
            <div className="text-2xl font-black text-amber-400">{openTickets}</div>
            <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mt-0.5">Open</div>
          </div>
          <div className="bg-slate-900 border border-indigo-500/20 rounded-2xl p-4 text-center">
            <div className="text-2xl font-black text-indigo-400">{trainees.length}</div>
            <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mt-0.5">Trainees</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-4 bg-slate-900 border border-slate-800 rounded-xl p-1">
          <button
            onClick={() => setTab("tickets")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
              tab === "tickets"
                ? "text-white"
                : "text-slate-500 hover:text-slate-300"
            }`}
            style={tab === "tickets" ? { background: "linear-gradient(135deg, rgba(219,39,119,0.3), rgba(157,23,77,0.3))" } : {}}
          >
            <Ticket size={13} />
            Support Tickets
            {openTickets > 0 && (
              <span className="bg-amber-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">
                {openTickets}
              </span>
            )}
          </button>
          <button
            onClick={() => setTab("trainees")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
              tab === "trainees"
                ? "text-white"
                : "text-slate-500 hover:text-slate-300"
            }`}
            style={tab === "trainees" ? { background: "rgba(99,102,241,0.2)" } : {}}
          >
            <Users size={13} />
            Trainees
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/30 rounded-xl px-4 py-3 mb-4">
            <AlertCircle size={14} className="text-rose-400 flex-shrink-0" />
            <p className="text-xs text-rose-300">{error}</p>
          </div>
        )}

        {/* Loading */}
        {loading && !error && (
          <div className="flex items-center justify-center py-16 gap-3">
            <Loader2 size={20} className="text-pink-400 animate-spin" />
            <span className="text-sm text-slate-500">Loading…</span>
          </div>
        )}

        {/* Tickets Tab */}
        {!loading && tab === "tickets" && (
          <div>
            {/* Filter bar */}
            <div className="flex gap-1.5 mb-4 flex-wrap">
              {(["all", "open", "in-progress", "resolved"] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`text-[10px] font-bold px-3 py-1.5 rounded-lg border transition-all capitalize ${
                    filter === f
                      ? "text-white"
                      : "text-slate-500 border-slate-700 hover:border-slate-500 hover:text-slate-300"
                  }`}
                  style={
                    filter === f
                      ? {
                          background: "linear-gradient(135deg, rgba(219,39,119,0.3), rgba(157,23,77,0.3))",
                          borderColor: "rgba(219,39,119,0.5)",
                        }
                      : {}
                  }
                >
                  {f === "all" ? `All (${tickets.length})` : f}
                </button>
              ))}
            </div>

            {filteredTickets.length === 0 ? (
              <div className="text-center py-16">
                <CheckCircle2 size={36} className="text-slate-700 mx-auto mb-3" />
                <p className="text-sm text-slate-600">
                  {filter === "all" ? "No support tickets yet." : `No ${filter} tickets.`}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredTickets.map(t => (
                  <TicketCard key={t.id} ticket={t} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Trainees Tab */}
        {!loading && tab === "trainees" && (
          <div>
            {trainees.length === 0 ? (
              <div className="text-center py-16">
                <Users size={36} className="text-slate-700 mx-auto mb-3" />
                <p className="text-sm text-slate-600">No trainees registered yet.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {trainees.map(t => (
                  <TraineeRow key={t.email} trainee={t} />
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

// ─── Admin App (login gate + dashboard) ───────────────────────────────────────

export function AdminApp() {
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/status", { credentials: "include" })
      .then(r => r.json() as Promise<{ authenticated?: boolean }>)
      .then(d => setAuthed(d.authenticated ?? false))
      .catch(() => setAuthed(false));
  }, []);

  if (authed === null) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 size={28} className="text-pink-500 animate-spin" />
      </div>
    );
  }

  if (!authed) {
    return <AdminLogin onLogin={() => setAuthed(true)} />;
  }

  return <AdminDashboard onLogout={() => setAuthed(false)} />;
}
