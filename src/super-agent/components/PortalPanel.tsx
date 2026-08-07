import React, { useState } from "react";
import { Globe, ExternalLink, Bot, Cpu, Zap, Brain, Crown, GraduationCap, ChevronRight, Wifi, WifiOff } from "lucide-react";

interface MYKSite {
  id: string;
  name: string;
  url: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;
  gradient: string;
  tags: string[];
}

const MYK_SITES: MYKSite[] = [
  {
    id: "super-agent",
    name: "Super Agent",
    url: "https://SA.Mykbrands.com",
    description: "You are here — unified AI across all MYK projects",
    icon: Brain,
    color: "violet",
    gradient: "from-violet-500 to-indigo-600",
    tags: ["AI", "Memory", "RAG"],
  },
  {
    id: "askmyk",
    name: "AskMyk.io",
    url: "https://askmyk.io",
    description: "Mobile-first AI chat with animated avatar & voice",
    icon: Bot,
    color: "blue",
    gradient: "from-blue-500 to-cyan-500",
    tags: ["Chat", "Mobile", "Voice"],
  },
  {
    id: "entrata",
    name: "Entrata Training",
    url: "https://entrata-training.onrender.com",
    description: "ClearWorth property management training hub",
    icon: GraduationCap,
    color: "indigo",
    gradient: "from-indigo-500 to-blue-600",
    tags: ["Training", "Entrata", "ClearWorth"],
  },
  {
    id: "queenscustoms",
    name: "Queenscustoms.shop",
    url: "https://queenscustoms.shop",
    description: "Premium custom goods boutique by Mykiesha",
    icon: Crown,
    color: "pink",
    gradient: "from-pink-500 to-rose-600",
    tags: ["Shop", "Custom", "Boutique"],
  },
];

const AGENT_CATALOG = [
  {
    name: "Cursor Cloud Agent",
    badge: "Code",
    color: "text-violet-400 bg-violet-500/10 border-violet-500/30",
    use: "Complex coding, PRs, full implementations",
    icon: "⚡",
  },
  {
    name: "Gemini 2.5 Pro",
    badge: "Deep",
    color: "text-blue-400 bg-blue-500/10 border-blue-500/30",
    use: "Research, analysis, long documents",
    icon: "🔬",
  },
  {
    name: "Gemini 2.0 Flash",
    badge: "Fast",
    color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/30",
    use: "Quick answers, summaries, routing",
    icon: "⚡",
  },
  {
    name: "Apple Intelligence",
    badge: "Private",
    color: "text-slate-300 bg-slate-500/10 border-slate-500/30",
    use: "Sensitive data, offline, on-device only",
    icon: "",
  },
  {
    name: "Ollama (Local)",
    badge: "Free",
    color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
    use: "Free local inference, privacy-first",
    icon: "🖥",
  },
];

interface Props {
  onNavigate?: (url: string) => void;
  activePortalUrl?: string | null;
  onSiteSelect: (site: MYKSite) => void;
}

export function PortalPanel({ onSiteSelect, activePortalUrl }: Props) {
  const [tab, setTab] = useState<"sites" | "agents">("sites");
  const [previewSite, setPreviewSite] = useState<MYKSite | null>(null);
  const [iframeLoading, setIframeLoading] = useState(false);
  const [iframeError, setIframeError] = useState(false);

  const openPreview = (site: MYKSite) => {
    setPreviewSite(site);
    setIframeLoading(true);
    setIframeError(false);
    onSiteSelect(site);
  };

  return (
    <div className="h-full flex flex-col bg-slate-900/50 border-l border-slate-800/80">
      {/* Portal Header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
            <Globe size={12} className="text-white" />
          </div>
          <span className="text-sm font-bold text-white">MYK Portal</span>
          <div className="ml-auto flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] text-emerald-400 font-mono">LIVE</span>
          </div>
        </div>
        <div className="flex gap-1">
          {(["sites", "agents"] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-1 rounded-lg text-[11px] font-semibold capitalize transition-colors ${
                tab === t
                  ? "bg-violet-600/30 text-violet-300 border border-violet-500/40"
                  : "text-slate-500 hover:text-slate-300 hover:bg-slate-800"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Preview Window */}
      {previewSite && (
        <div className="flex-shrink-0 border-b border-slate-800/80">
          {/* Browser chrome */}
          <div className="bg-slate-800/80 px-3 py-2 flex items-center gap-2">
            <div className="flex gap-1.5">
              <button
                onClick={() => { setPreviewSite(null); setIframeError(false); }}
                className="w-2.5 h-2.5 rounded-full bg-red-500 hover:bg-red-400 transition-colors"
              />
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            </div>
            <div className="flex-1 bg-slate-900/60 rounded-md px-2 py-0.5 flex items-center gap-1.5">
              <Wifi size={9} className="text-emerald-400 flex-shrink-0" />
              <span className="text-[10px] text-slate-400 truncate font-mono">{previewSite.url}</span>
            </div>
            <a
              href={previewSite.url}
              target="_blank"
              rel="noopener"
              className="text-slate-500 hover:text-slate-300 transition-colors"
            >
              <ExternalLink size={11} />
            </a>
          </div>
          {/* Preview content */}
          <div className="h-36 relative overflow-hidden bg-slate-950">
            {iframeError ? (
              <div className={`h-full flex flex-col items-center justify-center bg-gradient-to-br ${previewSite.gradient} opacity-20`}>
                <div className="absolute inset-0 flex flex-col items-center justify-center opacity-100">
                  <previewSite.icon size={28} className="text-white mb-2 opacity-60" />
                  <p className="text-[11px] text-slate-400 text-center px-4">{previewSite.name}</p>
                  <a
                    href={previewSite.url}
                    target="_blank"
                    rel="noopener"
                    className="mt-2 flex items-center gap-1 text-[10px] text-violet-400 hover:underline"
                  >
                    <ExternalLink size={9} /> Open in new tab
                  </a>
                </div>
              </div>
            ) : (
              <>
                {iframeLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-950 z-10">
                    <div className="w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
                <iframe
                  src={previewSite.url}
                  className="w-full h-full border-0 scale-75 origin-top-left"
                  style={{ width: "133%", height: "133%" }}
                  onLoad={() => setIframeLoading(false)}
                  onError={() => { setIframeError(true); setIframeLoading(false); }}
                  sandbox="allow-scripts allow-same-origin"
                  title={previewSite.name}
                />
              </>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
        {tab === "sites" && (
          <>
            {MYK_SITES.map(site => (
              <button
                key={site.id}
                onClick={() => openPreview(site)}
                className={`w-full text-left group relative overflow-hidden rounded-xl border transition-all duration-200 p-3 ${
                  previewSite?.id === site.id
                    ? "border-violet-500/50 bg-violet-500/10"
                    : "border-slate-700/50 bg-slate-800/30 hover:border-slate-600 hover:bg-slate-800/60"
                }`}
              >
                <div className={`absolute inset-0 bg-gradient-to-r ${site.gradient} opacity-0 group-hover:opacity-5 transition-opacity`} />
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${site.gradient} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                    <site.icon size={14} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white truncate">{site.name}</span>
                      <ChevronRight size={10} className="text-slate-600 flex-shrink-0 group-hover:text-slate-400 transition-colors" />
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">{site.description}</p>
                    <div className="flex gap-1 mt-1.5 flex-wrap">
                      {site.tags.map(tag => (
                        <span key={tag} className="text-[9px] px-1.5 py-0.5 bg-slate-700/60 text-slate-400 rounded-md">{tag}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </>
        )}

        {tab === "agents" && (
          <>
            <p className="text-[10px] text-slate-600 px-1 mb-2">
              Super Agent automatically routes to the best option. These are your available engines:
            </p>
            {AGENT_CATALOG.map(agent => (
              <div
                key={agent.name}
                className={`rounded-xl border p-3 ${agent.color}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm">{agent.icon}</span>
                  <span className="text-xs font-bold text-white">{agent.name}</span>
                  <span className={`ml-auto text-[9px] px-1.5 py-0.5 rounded font-semibold border ${agent.color}`}>
                    {agent.badge}
                  </span>
                </div>
                <p className="text-[10px] opacity-80 leading-relaxed">{agent.use}</p>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
