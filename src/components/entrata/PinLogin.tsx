import React, { useState, useRef, useEffect } from "react";
import { BookOpen, Loader2, AlertCircle, ChevronRight, Lock } from "lucide-react";

interface PinLoginProps {
  onSuccess: (pin: string, name: string, progress: Record<string, unknown>, completedWorkflows: string[]) => void;
}

export function PinLogin({ onSuccess }: PinLoginProps) {
  const [pin, setPin] = useState(["", "", "", ""]);
  const [name, setName] = useState("");
  const [step, setStep] = useState<"pin" | "name">("pin");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  useEffect(() => {
    inputRefs[0].current?.focus();
  }, []);

  function handlePinDigit(index: number, value: string) {
    if (!/^\d*$/.test(value)) return;
    const next = [...pin];
    next[index] = value.slice(-1);
    setPin(next);
    setError("");
    if (value && index < 3) {
      inputRefs[index + 1].current?.focus();
    }
    if (next.every(d => d) && index === 3) {
      verifyPin(next.join(""));
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !pin[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  }

  async function verifyPin(fullPin: string) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/pin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: fullPin, name: name || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Invalid PIN");
        setPin(["", "", "", ""]);
        setTimeout(() => inputRefs[0].current?.focus(), 50);
      } else {
        // If they've used this PIN before, go straight in
        if (data.name && !data.name.startsWith("Trainee ")) {
          onSuccess(fullPin, data.name, data.progress ?? {}, data.completedWorkflows ?? []);
        } else {
          setStep("name");
        }
      }
    } catch {
      setError("Could not connect. Please try again.");
      setPin(["", "", "", ""]);
    } finally {
      setLoading(false);
    }
  }

  async function handleNameSubmit(e: React.FormEvent) {
    e.preventDefault();
    const fullPin = pin.join("");
    setLoading(true);
    try {
      const res = await fetch("/api/pin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: fullPin, name: name.trim() || "Trainee" }),
      });
      const data = await res.json();
      if (res.ok) {
        onSuccess(fullPin, data.name, data.progress ?? {}, data.completedWorkflows ?? []);
      }
    } catch {
      setError("Could not save. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6">
      {/* Logo / Header */}
      <div className="text-center mb-10">
        <div className="w-20 h-20 bg-gradient-to-br from-[#003087] to-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-2xl shadow-indigo-900/50 border border-indigo-500/30">
          <BookOpen size={36} className="text-white" />
        </div>
        <h1 className="text-2xl font-black text-white mb-1">Entrata Training Hub</h1>
        <p className="text-sm text-slate-400">Property Management Operations</p>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden">
        {step === "pin" ? (
          <div className="p-8">
            <div className="flex items-center gap-2 mb-2">
              <Lock size={16} className="text-indigo-400" />
              <h2 className="text-base font-bold text-white">Enter Your Access PIN</h2>
            </div>
            <p className="text-xs text-slate-400 mb-8 leading-relaxed">
              Your 4-digit PIN was provided by your property manager. Each PIN tracks your individual progress.
            </p>

            {/* PIN boxes */}
            <div className="flex justify-center gap-3 mb-6">
              {pin.map((digit, i) => (
                <input
                  key={i}
                  ref={inputRefs[i]}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handlePinDigit(i, e.target.value)}
                  onKeyDown={e => handleKeyDown(i, e)}
                  className={`w-14 h-16 text-center text-2xl font-black rounded-2xl border-2 outline-none transition-all duration-150 bg-slate-800 text-white caret-indigo-400 ${
                    digit
                      ? "border-indigo-500 bg-slate-700"
                      : "border-slate-600 focus:border-indigo-500"
                  }`}
                />
              ))}
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/30 rounded-xl px-3 py-2.5 mb-4">
                <AlertCircle size={14} className="text-rose-400 flex-shrink-0" />
                <p className="text-xs text-rose-300">{error}</p>
              </div>
            )}

            {loading && (
              <div className="flex items-center justify-center gap-2 text-indigo-400 py-2">
                <Loader2 size={16} className="animate-spin" />
                <span className="text-sm">Verifying…</span>
              </div>
            )}
          </div>
        ) : (
          /* Name entry */
          <form onSubmit={handleNameSubmit} className="p-8">
            <h2 className="text-base font-bold text-white mb-1">Welcome!</h2>
            <p className="text-xs text-slate-400 mb-6">Enter your name so your certificate will be personalized.</p>

            <div className="mb-5">
              <label className="block text-xs font-semibold text-slate-400 mb-2">Your Full Name</label>
              <input
                autoFocus
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Sarah Johnson"
                className="w-full bg-slate-800 border border-slate-600 focus:border-indigo-500 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 outline-none text-sm transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/40"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : (
                <><ChevronRight size={16} /> Start Training</>
              )}
            </button>
          </form>
        )}

        {/* Footer */}
        <div className="bg-slate-800/50 border-t border-slate-800 px-6 py-3 text-center">
          <p className="text-[11px] text-slate-500">
            Don't have a PIN? Contact your property manager.
          </p>
        </div>
      </div>

      {/* Decorative dots */}
      <div className="mt-8 flex gap-2">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="w-1.5 h-1.5 rounded-full bg-slate-800" />
        ))}
      </div>
    </div>
  );
}
