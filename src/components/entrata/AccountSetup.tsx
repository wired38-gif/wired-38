import React, { useState, useRef, useEffect } from "react";
import {
  BookOpen, Loader2, AlertCircle, ChevronRight,
  Mail, Lock, User, Building2, Key, CheckCircle2, Eye, EyeOff, Copy, Check
} from "lucide-react";

export interface AccountData {
  email: string;
  name: string;
  property: string;
  pin: string;
  progress: Record<string, unknown>;
  completedWorkflows: string[];
}

interface AccountSetupProps {
  onSuccess: (account: AccountData) => void;
}

type Step = "email" | "returning-pin" | "invite-code" | "register" | "welcome";

function Field({
  label, type = "text", value, onChange, placeholder, autoFocus, required, icon,
}: {
  label: string; type?: string; value: string; onChange: (v: string) => void;
  placeholder?: string; autoFocus?: boolean; required?: boolean;
  icon?: React.ReactNode;
}) {
  const [show, setShow] = useState(false);
  const isPassword = type === "password";
  return (
    <div>
      <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
        {label}{required && <span className="text-rose-400 ml-0.5">*</span>}
      </label>
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">{icon}</div>
        )}
        <input
          autoFocus={autoFocus}
          type={isPassword && show ? "text" : type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full bg-slate-800 border border-slate-700 focus:border-indigo-500 rounded-xl py-3 text-white placeholder:text-slate-600 outline-none transition-colors text-sm ${icon ? "pl-10 pr-4" : "px-4"} ${isPassword ? "pr-10" : ""}`}
        />
        {isPassword && (
          <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
            {show ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        )}
      </div>
    </div>
  );
}

function PinBox({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const refs = Array.from({ length: 6 }, () => useRef<HTMLInputElement>(null));
  useEffect(() => { refs[0].current?.focus(); }, []);

  function onDigit(i: number, val: string) {
    if (!/^\d*$/.test(val)) return;
    const next = [...value];
    next[i] = val.slice(-1);
    onChange(next);
    if (val && i < 5) refs[i + 1].current?.focus();
  }
  function onKey(i: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !value[i] && i > 0) refs[i - 1].current?.focus();
  }

  return (
    <div className="flex justify-center gap-2">
      {value.map((d, i) => (
        <input
          key={i}
          ref={refs[i]}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={d}
          onChange={e => onDigit(i, e.target.value)}
          onKeyDown={e => onKey(i, e)}
          className={`w-11 h-14 text-center text-xl font-black rounded-xl border-2 outline-none transition-all bg-slate-800 text-white ${d ? "border-indigo-500 bg-slate-700" : "border-slate-600 focus:border-indigo-500"}`}
        />
      ))}
    </div>
  );
}

function PinDisplay({ pin }: { pin: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(pin).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  }
  return (
    <div className="bg-slate-800 border-2 border-indigo-500/50 rounded-2xl p-5 text-center">
      <div className="text-xs text-slate-400 uppercase tracking-widest mb-2 font-semibold">Your Access PIN</div>
      <div className="flex items-center justify-center gap-3">
        <span className="text-4xl font-black text-white tracking-[0.3em]">{pin}</span>
        <button onClick={copy} className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-400 hover:text-white transition-colors">
          {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
        </button>
      </div>
      <div className="text-xs text-amber-400 mt-3 font-semibold">⚠ Save this PIN — you'll need it to log back in</div>
    </div>
  );
}

export function AccountSetup({ onSuccess }: AccountSetupProps) {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [existingName, setExistingName] = useState("");
  const [pin, setPin] = useState(["", "", "", "", "", ""]);
  const [inviteCode, setInviteCode] = useState("");
  const [name, setName] = useState("");
  const [propertyName, setPropertyName] = useState("");
  const [generatedPin, setGeneratedPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleEmailContinue(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/auth/check-email", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (data.exists) {
        setExistingName(data.name);
        setStep("returning-pin");
      } else {
        setStep("invite-code");
      }
    } catch { setError("Connection error. Please try again."); }
    finally { setLoading(false); }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    const fullPin = pin.join("");
    if (fullPin.length < 6) { setError("Enter all 6 digits."); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), pin: fullPin }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); setPin(["","","","","",""]); }
      else {
        onSuccess({
          email: data.email, name: data.name, property: data.property, pin: fullPin,
          progress: data.progress ?? {}, completedWorkflows: data.completedWorkflows ?? [],
        });
      }
    } catch { setError("Connection error."); }
    finally { setLoading(false); }
  }

  function handleInviteCodeNext(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteCode.trim()) return;
    setError("");
    setStep("register");
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !propertyName.trim()) { setError("Please fill in all fields."); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteCode: inviteCode.trim(), email: email.trim(), name: name.trim(), property: propertyName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); }
      else { setGeneratedPin(data.pin); setStep("welcome"); }
    } catch { setError("Connection error."); }
    finally { setLoading(false); }
  }

  function handleEnterApp() {
    onSuccess({
      email: email.trim(), name, property: propertyName, pin: generatedPin,
      progress: {}, completedWorkflows: [],
    });
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-5">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-gradient-to-br from-[#003087] to-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-indigo-900/50 border border-indigo-500/30">
          <BookOpen size={36} className="text-white" />
        </div>
        <h1 className="text-2xl font-black text-white mb-1">Entrata Training Hub</h1>
        <p className="text-sm text-slate-400">Property Management Operations Training</p>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden">

        {/* ── STEP 1: Email ── */}
        {step === "email" && (
          <form onSubmit={handleEmailContinue} className="p-7">
            <h2 className="text-base font-black text-white mb-1">Welcome!</h2>
            <p className="text-xs text-slate-400 mb-5 leading-relaxed">Enter your email to sign in or create your training account.</p>
            <div className="space-y-4 mb-5">
              <Field label="Email Address" type="email" value={email} onChange={setEmail} placeholder="you@yourproperty.com" autoFocus required icon={<Mail size={15} />} />
            </div>
            {error && <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/30 rounded-xl px-3 py-2.5 mb-4"><AlertCircle size={14} className="text-rose-400 flex-shrink-0" /><p className="text-xs text-rose-300">{error}</p></div>}
            <button type="submit" disabled={loading || !email.trim()} className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-900/40">
              {loading ? <Loader2 size={16} className="animate-spin" /> : <><ChevronRight size={16} />Continue</>}
            </button>
          </form>
        )}

        {/* ── STEP 2a: Returning user — PIN ── */}
        {step === "returning-pin" && (
          <form onSubmit={handleLogin} className="p-7">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 size={16} className="text-emerald-400" />
              <h2 className="text-base font-black text-white">Welcome back, {existingName.split(" ")[0]}!</h2>
            </div>
            <p className="text-xs text-slate-400 mb-5">Enter your 6-digit PIN to continue your training.</p>
            <div className="mb-5">
              <PinBox value={pin} onChange={setPin} />
            </div>
            {error && <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/30 rounded-xl px-3 py-2.5 mb-4"><AlertCircle size={14} className="text-rose-400 flex-shrink-0" /><p className="text-xs text-rose-300">{error}</p></div>}
            <button type="submit" disabled={loading || pin.some(d => !d)} className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-900/40">
              {loading ? <Loader2 size={16} className="animate-spin" /> : <><Lock size={14} />Sign In</>}
            </button>
            <button type="button" onClick={() => { setStep("email"); setPin(["","","","","",""]); setError(""); }} className="w-full mt-2 py-2 text-slate-500 hover:text-slate-300 text-xs font-semibold transition-colors">
              ← Use a different email
            </button>
          </form>
        )}

        {/* ── STEP 2b: Invite code ── */}
        {step === "invite-code" && (
          <form onSubmit={handleInviteCodeNext} className="p-7">
            <h2 className="text-base font-black text-white mb-1">Create Your Account</h2>
            <p className="text-xs text-slate-400 mb-5 leading-relaxed">No account found for <span className="text-white font-semibold">{email}</span>. Enter the invite code from your manager to register.</p>
            <div className="space-y-4 mb-5">
              <Field label="Invite Code" value={inviteCode} onChange={v => setInviteCode(v.toUpperCase())} placeholder="e.g. ENTRATA2026" autoFocus required icon={<Key size={15} />} />
            </div>
            {error && <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/30 rounded-xl px-3 py-2.5 mb-4"><AlertCircle size={14} className="text-rose-400 flex-shrink-0" /><p className="text-xs text-rose-300">{error}</p></div>}
            <button type="submit" disabled={!inviteCode.trim()} className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-900/40">
              <ChevronRight size={16} />Continue
            </button>
            <button type="button" onClick={() => { setStep("email"); setError(""); }} className="w-full mt-2 py-2 text-slate-500 hover:text-slate-300 text-xs font-semibold transition-colors">← Back</button>
          </form>
        )}

        {/* ── STEP 3: Registration form ── */}
        {step === "register" && (
          <form onSubmit={handleRegister} className="p-7">
            <h2 className="text-base font-black text-white mb-1">Tell Us About Yourself</h2>
            <p className="text-xs text-slate-400 mb-5">Your info personalizes your training and certificate.</p>
            <div className="space-y-3 mb-5">
              <Field label="Full Name" value={name} onChange={setName} placeholder="e.g. Sarah Johnson" autoFocus required icon={<User size={15} />} />
              <Field label="Email" value={email} onChange={() => {}} placeholder="" icon={<Mail size={15} />} />
              <Field label="Property / Community Name" value={propertyName} onChange={setPropertyName} placeholder="e.g. Elmwood Gardens" required icon={<Building2 size={15} />} />
            </div>
            {error && <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/30 rounded-xl px-3 py-2.5 mb-4"><AlertCircle size={14} className="text-rose-400 flex-shrink-0" /><p className="text-xs text-rose-300">{error}</p></div>}
            <button type="submit" disabled={loading || !name.trim() || !propertyName.trim()} className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-900/40">
              {loading ? <Loader2 size={16} className="animate-spin" /> : <><CheckCircle2 size={14} />Create My Account</>}
            </button>
            <button type="button" onClick={() => { setStep("invite-code"); setError(""); }} className="w-full mt-2 py-2 text-slate-500 hover:text-slate-300 text-xs font-semibold transition-colors">← Back</button>
          </form>
        )}

        {/* ── STEP 4: Welcome + PIN reveal ── */}
        {step === "welcome" && (
          <div className="p-7">
            <div className="text-center mb-5">
              <div className="w-14 h-14 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-3 border-2 border-emerald-500/40">
                <CheckCircle2 size={28} className="text-emerald-400" />
              </div>
              <h2 className="text-lg font-black text-white mb-1">Account Created!</h2>
              <p className="text-xs text-slate-400">Welcome to Entrata Training, <span className="text-white font-semibold">{name}</span></p>
              <p className="text-xs text-slate-500 mt-0.5">{propertyName}</p>
            </div>
            <PinDisplay pin={generatedPin} />
            <p className="text-[11px] text-slate-500 text-center mt-3 mb-5 leading-relaxed">
              Next time, log in with your email <span className="text-slate-300">{email}</span> and this PIN. Keep it somewhere safe.
            </p>
            <button
              onClick={handleEnterApp}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-900/40 text-base"
            >
              Start Training <ChevronRight size={18} />
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="bg-slate-800/50 border-t border-slate-800 px-6 py-2.5 text-center">
          <p className="text-[10px] text-slate-600">Need an invite code? Contact your property manager.</p>
        </div>
      </div>
    </div>
  );
}
