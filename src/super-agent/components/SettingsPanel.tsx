import React, { useState } from "react";
import {
  Settings, Cpu, Cloud, Database, Globe, RefreshCw, Check,
  ExternalLink, AlertTriangle, Wifi, WifiOff, ChevronDown, ChevronUp, Smartphone
} from "lucide-react";
import type { SAStatus } from "../types";

interface Props {
  status: SAStatus | null;
  onRefresh: () => void;
}

interface Section {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  open: boolean;
}

const LOCAL_MODELS = [
  { name: "llama3", label: "Llama 3", size: "~4.7 GB", use: "General-purpose, good quality" },
  { name: "mistral", label: "Mistral 7B", size: "~4.1 GB", use: "Fast coding + reasoning" },
  { name: "codellama", label: "Code Llama", size: "~3.8 GB", use: "Code generation + debugging" },
  { name: "phi3", label: "Phi-3 Mini", size: "~2.3 GB", use: "Ultra-fast, low resource" },
  { name: "gemma2", label: "Gemma 2", size: "~5.4 GB", use: "Google's open model, general" },
];

export function SettingsPanel({ status, onRefresh }: Props) {
  const [sections, setSections] = useState<Record<string, boolean>>({
    status: true,
    apple: true,
    local: false,
    deploy: false,
    about: false,
  });
  const [pulling, setPulling] = useState<string | null>(null);
  const [pullResult, setPullResult] = useState<Record<string, boolean>>({});

  const toggle = (id: string) => setSections(s => ({ ...s, [id]: !s[id] }));

  const pullModel = async (modelName: string) => {
    setPulling(modelName);
    try {
      const r = await fetch("/api/sa/local-models/pull", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: modelName }),
      });
      const data = await r.json() as { ok?: boolean; error?: string };
      setPullResult(p => ({ ...p, [modelName]: !!data.ok }));
    } catch {
      // ignore
    } finally {
      setPulling(null);
    }
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">

        {/* System Status */}
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl overflow-hidden">
          <button
            onClick={() => toggle("status")}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-700/20 transition-colors"
          >
            <Settings size={15} className="text-violet-400" />
            <span className="text-sm font-semibold text-white flex-1 text-left">System Status</span>
            {sections.status ? <ChevronUp size={14} className="text-slate-500" /> : <ChevronDown size={14} className="text-slate-500" />}
          </button>
          {sections.status && (
            <div className="border-t border-slate-700/50 px-4 py-3 space-y-3">
              <StatusRow
                label="Gemini AI"
                ok={!!status?.geminiConfigured}
                detail={status?.geminiConfigured ? "API key configured" : "Set GEMINI_API_KEY in .env.local"}
                icon={Cloud}
              />
              <StatusRow
                label="Apple Intelligence"
                ok={!!status?.appleAI?.available}
                detail={status?.appleAI?.available
                  ? `On-device · ${status.appleAI.contextWindow?.toLocaleString() ?? "4,096"} tokens · Neural Engine`
                  : "Not connected — see Apple Intelligence section below"}
                icon={Smartphone}
              />
              <StatusRow
                label="Ollama (Local)"
                ok={!!status?.ollama.available}
                detail={status?.ollama.available
                  ? `${status.ollama.models.length} model${status.ollama.models.length !== 1 ? "s" : ""} available: ${status.ollama.models.slice(0, 3).join(", ")}${status.ollama.models.length > 3 ? "…" : ""}`
                  : "Not running — install from ollama.com"}
                icon={Cpu}
                link={!status?.ollama.available ? "https://ollama.com" : undefined}
              />
              <StatusRow
                label="Knowledge Base"
                ok
                detail={`${status?.kbSize ?? 0} entries indexed for RAG`}
                icon={Database}
              />
              <StatusRow
                label="Conversations"
                ok
                detail={`${status?.conversationCount ?? 0} saved conversations`}
                icon={Globe}
              />
              <button
                onClick={onRefresh}
                className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors"
              >
                <RefreshCw size={11} />
                Refresh status
              </button>
            </div>
          )}
        </div>

        {/* Apple Intelligence */}
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl overflow-hidden">
          <button
            onClick={() => toggle("apple")}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-700/20 transition-colors"
          >
            <Smartphone size={15} className="text-slate-300" />
            <span className="text-sm font-semibold text-white flex-1 text-left">Apple Intelligence</span>
            {status?.appleAI?.available && (
              <span className="text-[10px] text-emerald-400 bg-emerald-400/10 border border-emerald-500/30 px-1.5 py-0.5 rounded">
                ✓ Connected
              </span>
            )}
            {sections.apple ? <ChevronUp size={14} className="text-slate-500" /> : <ChevronDown size={14} className="text-slate-500" />}
          </button>
          {sections.apple && (
            <div className="border-t border-slate-700/50 px-4 py-3 space-y-3">
              {status?.appleAI?.available ? (
                <div className="flex items-center gap-2 px-3 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                  <Wifi size={13} className="text-emerald-400" />
                  <div>
                    <p className="text-xs text-emerald-300 font-semibold">Apple Intelligence connected</p>
                    <p className="text-[10px] text-emerald-500">
                      On-device model · {status.appleAI.contextWindow ? `${status.appleAI.contextWindow.toLocaleString()} token context` : "4,096 token context"} · Neural Engine
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-2 px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-lg">
                  <AlertTriangle size={13} className="text-amber-400 mt-0.5 flex-shrink-0" />
                  <p className="text-[10px] text-slate-400">
                    Apple Intelligence not detected at{" "}
                    <code className="text-slate-300 bg-slate-900 px-1 rounded">{process?.env?.APPLE_AI_URL || "localhost:11435"}</code>.
                    Follow setup steps below.
                  </p>
                </div>
              )}

              <p className="text-xs text-slate-400 leading-relaxed">
                Apple's on-device <strong className="text-white">Foundation Model</strong> (~3B params) runs entirely on the Neural Engine of Apple Silicon Macs — free, private, no cloud, works offline. Powered by{" "}
                <a href="https://apfel.franzai.com" target="_blank" rel="noopener" className="text-violet-400 hover:underline">apfel</a>.
              </p>

              <div className="space-y-1.5">
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Mac Setup (macOS 26 Tahoe + Apple Silicon)</p>
                <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 space-y-1.5">
                  <p className="text-[10px] text-slate-500">1. Enable Apple Intelligence: <span className="text-slate-300">System Settings → Apple Intelligence &amp; Siri → Enable</span></p>
                  <div className="text-[10px] text-slate-400 font-mono space-y-1">
                    <p className="text-slate-500">2. Install &amp; run apfel:</p>
                    <code className="block bg-slate-950 px-2 py-1 rounded text-emerald-400">brew install apfel</code>
                    <code className="block bg-slate-950 px-2 py-1 rounded text-emerald-400">apfel --serve --port 11435</code>
                  </div>
                  <p className="text-[10px] text-slate-500">3. Set env var on your server: <code className="text-slate-300">APPLE_AI_URL=http://localhost:11435/v1</code></p>
                </div>
              </div>

              <div className="space-y-1.5">
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">iPhone / iPad Access</p>
                <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 space-y-1.5">
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    iPhone can't run apfel directly. Instead, run apfel on your Mac and expose it to your phone via Tailscale (recommended) or your local network:
                  </p>
                  <div className="text-[10px] text-slate-400 font-mono space-y-1">
                    <code className="block bg-slate-950 px-2 py-1 rounded text-emerald-400">apfel --serve --host 0.0.0.0 --port 11435</code>
                  </div>
                  <p className="text-[10px] text-slate-500">Then set: <code className="text-slate-300">APPLE_AI_URL=http://YOUR_MAC_IP:11435/v1</code></p>
                  <p className="text-[10px] text-slate-600">Tailscale gives a stable IP across networks (home, office, cellular).</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Apple Writing Tools (already active)</p>
                <p className="text-[10px] text-slate-500 leading-relaxed">
                  On Safari (iOS 18.2+ / macOS Sequoia+), Writing Tools work automatically on any text field — long-press the input and select <strong className="text-slate-400">Writing Tools</strong> to Proofread, Rewrite, Summarize, or change tone. No setup needed.
                </p>
              </div>

              <div className="flex gap-2 flex-wrap">
                <a href="https://apfel.franzai.com" target="_blank" rel="noopener" className="flex items-center gap-1 text-[10px] text-violet-400 hover:underline">
                  <ExternalLink size={9} />apfel docs
                </a>
                <a href="https://support.apple.com/guide/iphone/use-apple-intelligence-features-iphe50be2d8b/ios" target="_blank" rel="noopener" className="flex items-center gap-1 text-[10px] text-violet-400 hover:underline">
                  <ExternalLink size={9} />Apple Intelligence setup
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Local Models */}
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl overflow-hidden">
          <button
            onClick={() => toggle("local")}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-700/20 transition-colors"
          >
            <Cpu size={15} className="text-emerald-400" />
            <span className="text-sm font-semibold text-white flex-1 text-left">Local Models (Ollama)</span>
            {sections.local ? <ChevronUp size={14} className="text-slate-500" /> : <ChevronDown size={14} className="text-slate-500" />}
          </button>
          {sections.local && (
            <div className="border-t border-slate-700/50 px-4 py-3 space-y-3">
              <p className="text-xs text-slate-500 leading-relaxed">
                Run models 100% locally — free, private, no API cost. Requires{" "}
                <a href="https://ollama.com" target="_blank" rel="noopener" className="text-violet-400 hover:underline">Ollama</a>{" "}
                installed and running on your machine.
              </p>

              {!status?.ollama.available && (
                <div className="flex items-center gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                  <AlertTriangle size={13} className="text-amber-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-amber-300 font-semibold">Ollama not detected</p>
                    <p className="text-[10px] text-amber-400">Install and run Ollama, then refresh status above.</p>
                  </div>
                  <a
                    href="https://ollama.com"
                    target="_blank"
                    rel="noopener"
                    className="flex items-center gap-1 text-[10px] text-amber-300 hover:text-amber-100"
                  >
                    <ExternalLink size={10} />
                    Get Ollama
                  </a>
                </div>
              )}

              <div className="space-y-2">
                {LOCAL_MODELS.map(model => {
                  const isInstalled = status?.ollama.models.some(m => m.includes(model.name));
                  return (
                    <div
                      key={model.name}
                      className="flex items-center gap-3 px-3 py-2 bg-slate-900/40 border border-slate-700/30 rounded-lg"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-white">{model.label}</span>
                          {isInstalled && (
                            <span className="text-[10px] text-emerald-400 bg-emerald-400/10 border border-emerald-500/30 px-1.5 py-0.5 rounded">
                              ✓ Installed
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-[10px] text-slate-500">{model.size}</span>
                          <span className="text-[10px] text-slate-600">{model.use}</span>
                        </div>
                      </div>
                      {status?.ollama.available && !isInstalled && (
                        <button
                          onClick={() => pullModel(model.name)}
                          disabled={!!pulling}
                          className="flex items-center gap-1 text-[10px] font-semibold px-2 py-1 bg-emerald-600/20 hover:bg-emerald-600/40 border border-emerald-500/30 text-emerald-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {pulling === model.name ? (
                            <RefreshCw size={9} className="animate-spin" />
                          ) : pullResult[model.name] ? (
                            <Check size={9} />
                          ) : null}
                          {pulling === model.name ? "Pulling…" : pullResult[model.name] ? "Done!" : "Pull"}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
              <p className="text-[10px] text-slate-600">
                Run models with: <code className="bg-slate-900 px-1 rounded">ollama run llama3</code>
              </p>
            </div>
          )}
        </div>

        {/* Deployment */}
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl overflow-hidden">
          <button
            onClick={() => toggle("deploy")}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-700/20 transition-colors"
          >
            <Globe size={15} className="text-blue-400" />
            <span className="text-sm font-semibold text-white flex-1 text-left">Deploy at SA.Mykbrands.com</span>
            {sections.deploy ? <ChevronUp size={14} className="text-slate-500" /> : <ChevronDown size={14} className="text-slate-500" />}
          </button>
          {sections.deploy && (
            <div className="border-t border-slate-700/50 px-4 py-3 space-y-3">
              <p className="text-xs text-slate-400 leading-relaxed">
                The Super Agent UI is served at <code className="text-violet-300 bg-slate-900 px-1 rounded">/super-agent.html</code> and runs on the same Express server as TheOptimizer.
              </p>
              <div className="space-y-2 text-xs text-slate-400">
                <DeployStep n={1} label="Deploy this app to your server (Render, Railway, VPS, etc.)" />
                <DeployStep n={2} label="Set required env vars: GEMINI_API_KEY, ADMIN_USERNAME, ADMIN_PASSWORD, AUTH_SECRET" />
                <DeployStep n={3} label="Point SA.Mykbrands.com DNS to your server IP/hostname" />
                <DeployStep n={4} label="Add HTTPS via Let's Encrypt or Cloudflare proxy" />
                <DeployStep n={5} label="Optionally set OLLAMA_URL=http://your-local-ip:11434 to reach local models from anywhere" />
              </div>
              <div className="bg-slate-900/80 border border-slate-700 rounded-lg p-3">
                <p className="text-[10px] text-slate-500 font-semibold mb-1">Current .env.example additions:</p>
                <pre className="text-[10px] text-slate-400 overflow-x-auto">
{`# Super Agent
GEMINI_API_KEY="your-gemini-api-key"
ADMIN_USERNAME="myk"
ADMIN_PASSWORD="your-secure-password"
AUTH_SECRET="random-secret-string"
OLLAMA_URL="http://localhost:11434"  # optional`}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* About */}
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl overflow-hidden">
          <button
            onClick={() => toggle("about")}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-700/20 transition-colors"
          >
            <Database size={15} className="text-slate-400" />
            <span className="text-sm font-semibold text-white flex-1 text-left">About Super Agent</span>
            {sections.about ? <ChevronUp size={14} className="text-slate-500" /> : <ChevronDown size={14} className="text-slate-500" />}
          </button>
          {sections.about && (
            <div className="border-t border-slate-700/50 px-4 py-3 space-y-2 text-xs text-slate-400 leading-relaxed">
              <p>
                <strong className="text-white">MYK Super Agent</strong> is part of the MYK.IO / TheOptimizer platform by Designs by Myk LLC. It provides:
              </p>
              <ul className="list-disc list-inside space-y-1 pl-2">
                <li>Persistent chat across all sessions and devices</li>
                <li>RAG-powered memory — knowledge base searched before every response</li>
                <li>Multi-model routing — Gemini Pro/Flash/Lite + local Ollama models</li>
                <li>Prompt optimizer — improves your prompts and recommends the right model</li>
                <li>Knowledge base — import Cursor chats, add project notes, build MYK's memory</li>
                <li>Full cross-machine access via SA.Mykbrands.com</li>
              </ul>
              <p className="text-slate-500">
                All data stored locally in <code className="bg-slate-900 px-1 rounded">data/super-agent/</code> on the server.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusRow({
  label, ok, detail, icon: Icon, link
}: {
  label: string;
  ok: boolean;
  detail: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  link?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon size={13} className={ok ? "text-emerald-400 mt-0.5" : "text-amber-400 mt-0.5"} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-white">{label}</span>
          {ok
            ? <Wifi size={9} className="text-emerald-400" />
            : <WifiOff size={9} className="text-amber-400" />
          }
        </div>
        <p className="text-[10px] text-slate-500 mt-0.5">
          {detail}
          {link && (
            <a href={link} target="_blank" rel="noopener" className="ml-1 text-violet-400 hover:underline inline-flex items-center gap-0.5">
              <ExternalLink size={9} />
              {link}
            </a>
          )}
        </p>
      </div>
    </div>
  );
}

function DeployStep({ n, label }: { n: number; label: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="flex-shrink-0 w-4 h-4 bg-slate-700 rounded-full flex items-center justify-center text-[10px] font-bold text-slate-400 mt-0.5">
        {n}
      </span>
      <span>{label}</span>
    </div>
  );
}
