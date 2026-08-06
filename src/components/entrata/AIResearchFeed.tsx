import React, { useState, useEffect, useCallback } from "react";
import {
  Rss, ExternalLink, RefreshCw, Tag, Clock, AlertCircle,
  Newspaper, Sparkles, Search, ChevronDown, ChevronUp,
  Lightbulb, Users, Zap, Gift, Youtube, Linkedin, Globe,
  MessageSquare, ArrowRight, Copy, Check,
} from "lucide-react";
import { CURATED_RESOURCES, TOKEN_TIPS, type CuratedResource, type TokenTip } from "../../data/researchSites";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ResearchArticle {
  id: string;
  title: string;
  url: string;
  publishedAt: string;
  summary: string;
  source: string;
  sourceUrl: string;
  category: string;
  tags: string[];
  relevant: boolean;
}

interface ResearchSource {
  id: string;
  name: string;
  url: string;
}

interface ResearchResponse {
  articles: ResearchArticle[];
  relevantCount: number;
  totalCount: number;
  sources: ResearchSource[];
  fetchedAt: string;
  errors?: { site: string; error: string }[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const HIGHLIGHT_KEYWORDS = [
  "mai-code", "mai-1", "mai", "microsoft", "free", "open-source", "openrouter",
  "token", "tokens", "pricing", "free tier", "copilot", "ai studio",
  "prompt cache", "context cache", "zero cost", "simon willison", "mckay",
];

function highlightKeywords(text: string): React.ReactNode {
  const lower = text.toLowerCase();
  const matches: { start: number; end: number }[] = [];

  for (const kw of HIGHLIGHT_KEYWORDS) {
    let pos = lower.indexOf(kw, 0);
    while (pos !== -1) {
      matches.push({ start: pos, end: pos + kw.length });
      pos = lower.indexOf(kw, pos + 1);
    }
  }

  matches.sort((a, b) => a.start - b.start);
  const deduped: typeof matches = [];
  for (const m of matches) {
    if (deduped.length === 0 || m.start >= deduped[deduped.length - 1].end) {
      deduped.push(m);
    }
  }

  if (deduped.length === 0) return text;

  const segments: React.ReactNode[] = [];
  let cursor = 0;
  for (const m of deduped) {
    if (cursor < m.start) segments.push(text.slice(cursor, m.start));
    segments.push(
      <mark key={m.start} className="bg-indigo-500/20 text-indigo-300 rounded px-0.5 not-italic">
        {text.slice(m.start, m.end)}
      </mark>
    );
    cursor = m.end;
  }
  if (cursor < text.length) segments.push(text.slice(cursor));
  return segments;
}

function timeAgo(iso: string): string {
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return "just now";
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    return `${d}d ago`;
  } catch {
    return "";
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ArticleCard({ article, isExpanded, onToggle }: {
  article: ResearchArticle;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div className={`rounded-xl border transition-all ${
      article.relevant
        ? "border-indigo-800/50 bg-indigo-950/20 hover:border-indigo-600/60"
        : "border-slate-800 bg-slate-900/30 hover:border-slate-700"
    }`}>
      <div className="p-3">
        <div className="flex items-start gap-2 mb-2">
          {article.relevant && <Sparkles size={11} className="flex-shrink-0 mt-0.5 text-indigo-400" />}
          <div className="flex-1 min-w-0">
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold text-slate-200 hover:text-indigo-300 transition-colors leading-snug line-clamp-2 block"
            >
              {highlightKeywords(article.title)}
            </a>
          </div>
          <a href={article.url} target="_blank" rel="noopener noreferrer"
             className="flex-shrink-0 text-slate-600 hover:text-indigo-400 transition-colors">
            <ExternalLink size={12} />
          </a>
        </div>

        <div className="flex items-center gap-2 text-[10px] text-slate-500 mb-2">
          <a href={article.sourceUrl} target="_blank" rel="noopener noreferrer"
             className="flex items-center gap-1 hover:text-slate-300 transition-colors">
            <Rss size={9} />
            {article.source}
          </a>
          <span className="text-slate-700">·</span>
          <span className="flex items-center gap-1"><Clock size={9} />{timeAgo(article.publishedAt)}</span>
          {article.relevant && (
            <><span className="text-slate-700">·</span><span className="text-indigo-400 font-medium">AI relevant</span></>
          )}
        </div>

        {article.summary && (
          <>
            <p className={`text-[11px] text-slate-500 leading-relaxed ${isExpanded ? "" : "line-clamp-2"}`}>
              {highlightKeywords(article.summary)}
            </p>
            {article.summary.length > 120 && (
              <button onClick={onToggle}
                className="flex items-center gap-1 mt-1 text-[10px] text-slate-600 hover:text-slate-400 transition-colors">
                {isExpanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                {isExpanded ? "Show less" : "Read more"}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

const FOCUS_LABELS: Record<CuratedResource["focus"], { label: string; color: string }> = {
  "token-optimization": { label: "Token Saver", color: "text-emerald-400 bg-emerald-900/30 border-emerald-800/60" },
  "free-models":        { label: "Free Models", color: "text-cyan-400 bg-cyan-900/30 border-cyan-800/60" },
  "prompt-engineering": { label: "Prompt Codes", color: "text-violet-400 bg-violet-900/30 border-violet-800/60" },
  "free-credits":       { label: "Free Credits", color: "text-amber-400 bg-amber-900/30 border-amber-800/60" },
};

const PLATFORM_ICONS: Record<CuratedResource["platformIcon"], React.ReactNode> = {
  youtube:   <Youtube size={12} className="text-red-400" />,
  x:         <MessageSquare size={12} className="text-slate-300" />,
  linkedin:  <Linkedin size={12} className="text-blue-400" />,
  instagram: <MessageSquare size={12} className="text-pink-400" />,
  web:       <Globe size={12} className="text-slate-400" />,
  github:    <Globe size={12} className="text-slate-400" />,
};

function ExpertCard({ resource }: { resource: CuratedResource }) {
  const focus = FOCUS_LABELS[resource.focus];
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/40 hover:border-slate-600 transition-all p-3">
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-white">{resource.name}</span>
            {resource.badge && (
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${focus.color}`}>
                {resource.badge}
              </span>
            )}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">{resource.role}</div>
        </div>
        <a href={resource.url} target="_blank" rel="noopener noreferrer"
           className="flex items-center gap-1.5 text-[10px] text-indigo-400 hover:text-indigo-300 transition-colors flex-shrink-0 border border-indigo-800/50 rounded-lg px-2 py-1">
          {PLATFORM_ICONS[resource.platformIcon]}
          Follow
        </a>
      </div>

      <p className="text-[11px] text-slate-400 leading-relaxed mb-2">{resource.description}</p>

      <div className="flex items-center justify-between">
        <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded border ${focus.color}`}>
          {focus.label}
        </span>
        <span className="text-[10px] text-slate-600 flex items-center gap-1">
          {PLATFORM_ICONS[resource.platformIcon]}
          {resource.platform}
        </span>
      </div>
    </div>
  );
}

const TIP_CATEGORY_COLORS: Record<TokenTip["category"], string> = {
  output:  "text-red-400 bg-red-900/20 border-red-800/40",
  caching: "text-emerald-400 bg-emerald-900/20 border-emerald-800/40",
  context: "text-amber-400 bg-amber-900/20 border-amber-800/40",
  model:   "text-cyan-400 bg-cyan-900/20 border-cyan-800/40",
  prompt:  "text-violet-400 bg-violet-900/20 border-violet-800/40",
};

const TIP_CATEGORY_LABELS: Record<TokenTip["category"], string> = {
  output:  "Output Tokens",
  caching: "Prompt Caching",
  context: "Context Window",
  model:   "Model Choice",
  prompt:  "Prompt Codes",
};

function TipCard({ tip }: { tip: TokenTip }) {
  const [copied, setCopied] = useState(false);
  const color = TIP_CATEGORY_COLORS[tip.category];

  // Extract any inline code-style text for copy
  const codeMatch = tip.detail.match(/"([^"]{10,})"/);

  function handleCopy() {
    if (!codeMatch) return;
    navigator.clipboard.writeText(codeMatch[1]).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3">
      <div className="flex items-start gap-2 mb-2">
        <Zap size={13} className="flex-shrink-0 mt-0.5 text-amber-400" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-xs font-bold text-white">{tip.title}</span>
            <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded border ${color}`}>
              {TIP_CATEGORY_LABELS[tip.category]}
            </span>
          </div>
          {tip.savings && (
            <div className="text-[10px] text-emerald-400 font-semibold mb-1.5">
              💰 {tip.savings}
            </div>
          )}
          <p className="text-[11px] text-slate-400 leading-relaxed">{tip.detail}</p>
        </div>
      </div>

      {codeMatch && (
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 mt-2 text-[10px] text-slate-500 hover:text-slate-300 border border-slate-700 hover:border-slate-500 rounded-lg px-2 py-1 transition-all"
        >
          {copied ? <Check size={10} className="text-emerald-400" /> : <Copy size={10} />}
          {copied ? "Copied!" : "Copy instruction"}
        </button>
      )}
    </div>
  );
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────

const TABS = [
  { id: "articles" as const,   label: "Live Feed",    icon: <Newspaper size={12} /> },
  { id: "experts"  as const,   label: "Experts",      icon: <Users size={12} /> },
  { id: "tips"     as const,   label: "Token Tips",   icon: <Lightbulb size={12} /> },
] as const;

type TabId = typeof TABS[number]["id"];

// ─── Main Component ───────────────────────────────────────────────────────────

export function AIResearchFeed() {
  const [activeTab, setActiveTab] = useState<TabId>("articles");
  const [data, setData] = useState<ResearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "relevant">("relevant");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [showSources, setShowSources] = useState(false);
  const [expertFilter, setExpertFilter] = useState<CuratedResource["focus"] | "all">("all");

  const fetchFeed = useCallback(async (refresh = false) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/ai-research${refresh ? "?refresh=true" : ""}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setData(await res.json() as ResearchResponse);
    } catch (e: any) {
      setError(e.message || "Failed to load feed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (activeTab === "articles") fetchFeed(); }, [activeTab, fetchFeed]);

  function toggleExpanded(id: string) {
    setExpandedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  const displayedArticles = (data?.articles ?? []).filter(a => {
    if (filter === "relevant" && !a.relevant) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return a.title.toLowerCase().includes(q) || a.summary.toLowerCase().includes(q) || a.source.toLowerCase().includes(q);
    }
    return true;
  });

  const displayedExperts = CURATED_RESOURCES.filter(r =>
    expertFilter === "all" || r.focus === expertFilter
  );

  return (
    <div className="h-full flex flex-col bg-slate-950 text-white overflow-hidden">

      {/* ─── Header ─── */}
      <div className="flex-shrink-0 px-4 pt-4 pb-3 border-b border-slate-800">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Rss size={15} className="text-cyan-400" />
            <h2 className="text-sm font-bold text-white">AI Research Feed</h2>
            {data && activeTab === "articles" && (
              <span className="text-[10px] text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded-full">
                {data.relevantCount} relevant
              </span>
            )}
          </div>
          {activeTab === "articles" && (
            <button onClick={() => fetchFeed(true)} disabled={loading}
              className="flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-white transition-colors disabled:opacity-50">
              <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
              {loading ? "Loading…" : "Refresh"}
            </button>
          )}
        </div>

        <p className="text-[10px] text-slate-500 leading-relaxed">
          Substack newsletters · expert blogs · free-model directories · token-saving tips
        </p>
      </div>

      {/* ─── Tab Bar ─── */}
      <div className="flex-shrink-0 flex border-b border-slate-800 bg-slate-900/40">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-semibold transition-all border-b-2 ${
              activeTab === tab.id
                ? "border-cyan-500 text-cyan-400 bg-cyan-950/20"
                : "border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-800/30"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* ─── Tab: Articles ─── */}
      {activeTab === "articles" && (
        <>
          <div className="flex-shrink-0 p-3 space-y-2 border-b border-slate-800/60">
            {/* Search */}
            <div className="relative">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search articles…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-7 pr-3 py-1.5 text-xs text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>
            {/* Filters */}
            <div className="flex gap-1.5">
              {(["relevant", "all"] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`text-[11px] px-2.5 py-1 rounded-full border transition-all ${
                    filter === f
                      ? "bg-cyan-600 border-cyan-500 text-white"
                      : "border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-300"
                  }`}>
                  {f === "relevant" ? "AI Relevant" : "All Articles"}
                </button>
              ))}
            </div>
          </div>

          {/* Sources disclosure */}
          <div className="flex-shrink-0 border-b border-slate-800/40">
            <button onClick={() => setShowSources(v => !v)}
              className="w-full flex items-center justify-between px-4 py-2 text-[10px] text-slate-500 hover:text-slate-300 transition-colors">
              <span className="flex items-center gap-1.5">
                <Tag size={10} />
                {data ? `${data.sources.length} RSS sources` : "Sources"}
              </span>
              {showSources ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
            </button>
            {showSources && data && (
              <div className="px-4 pb-3 flex flex-wrap gap-1.5">
                {data.sources.map(s => (
                  <a key={s.id} href={s.url} target="_blank" rel="noopener noreferrer"
                     className="flex items-center gap-1 text-[10px] text-slate-400 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-full px-2 py-0.5 transition-colors">
                    <Rss size={8} />{s.name}
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Article list */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {error && (
              <div className="flex items-start gap-2 p-3 bg-red-950/30 border border-red-900/50 rounded-xl text-xs text-red-400">
                <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                <div><p className="font-semibold">Failed to load feed</p><p className="text-red-500/80 mt-0.5">{error}</p></div>
              </div>
            )}

            {loading && !data && (
              <div className="space-y-2">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="rounded-xl border border-slate-800 p-3 animate-pulse">
                    <div className="h-3 bg-slate-800 rounded w-3/4 mb-2" />
                    <div className="h-2 bg-slate-800/60 rounded w-1/4 mb-2" />
                    <div className="h-2 bg-slate-800/40 rounded w-full mb-1" />
                    <div className="h-2 bg-slate-800/40 rounded w-2/3" />
                  </div>
                ))}
              </div>
            )}

            {!loading && !error && displayedArticles.length === 0 && (
              <div className="text-center py-8 text-slate-500">
                <Newspaper size={24} className="mx-auto mb-2 text-slate-700" />
                <p className="text-xs">No articles found</p>
                {filter === "relevant" && (
                  <button onClick={() => setFilter("all")} className="text-[11px] text-cyan-400 mt-1 hover:underline">
                    Show all articles
                  </button>
                )}
              </div>
            )}

            {displayedArticles.map(article => (
              <ArticleCard
                key={article.id}
                article={article}
                isExpanded={expandedIds.has(article.id)}
                onToggle={() => toggleExpanded(article.id)}
              />
            ))}

            {data?.fetchedAt && (
              <p className="text-center text-[10px] text-slate-700 pt-2 pb-1">
                Last refreshed {timeAgo(data.fetchedAt)} · updates every 30 min
              </p>
            )}
          </div>
        </>
      )}

      {/* ─── Tab: Experts & Tools ─── */}
      {activeTab === "experts" && (
        <>
          {/* Focus filter */}
          <div className="flex-shrink-0 p-3 border-b border-slate-800/60">
            <div className="flex flex-wrap gap-1.5">
              {([
                ["all",               "All"],
                ["token-optimization","Token Savers"],
                ["free-models",       "Free Models"],
                ["free-credits",      "Free Credits"],
                ["prompt-engineering","Prompt Codes"],
              ] as const).map(([val, label]) => (
                <button key={val} onClick={() => setExpertFilter(val)}
                  className={`text-[11px] px-2.5 py-1 rounded-full border transition-all ${
                    expertFilter === val
                      ? "bg-cyan-600 border-cyan-500 text-white"
                      : "border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-300"
                  }`}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {/* Section headers */}
            <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold px-1 pt-1">
              Token Optimization Experts
            </div>
            {displayedExperts.filter(r => r.focus === "token-optimization").map(r => (
              <ExpertCard key={r.id} resource={r} />
            ))}

            {(expertFilter === "all" || expertFilter === "free-models" || expertFilter === "free-credits") && (
              <>
                <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold px-1 pt-3">
                  Free Models & API Credits
                </div>
                {displayedExperts.filter(r => r.focus === "free-models" || r.focus === "free-credits").map(r => (
                  <ExpertCard key={r.id} resource={r} />
                ))}
              </>
            )}

            {(expertFilter === "all" || expertFilter === "prompt-engineering") && (
              <>
                <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold px-1 pt-3">
                  Prompt Blueprints & Secret Codes
                </div>
                {displayedExperts.filter(r => r.focus === "prompt-engineering").map(r => (
                  <ExpertCard key={r.id} resource={r} />
                ))}
              </>
            )}

            {/* Static link bar for quick access */}
            <div className="mt-4 p-3 rounded-xl border border-cyan-900/40 bg-cyan-950/10">
              <div className="flex items-center gap-2 mb-2">
                <Gift size={13} className="text-cyan-400" />
                <span className="text-xs font-bold text-cyan-300">Claim Free API Credits</span>
              </div>
              <p className="text-[11px] text-slate-400 mb-2 leading-relaxed">
                Before paying for API tokens, stack these free tiers:
              </p>
              {[
                { label: "Get AI Perks — sign-up bonus directory", url: "https://getaiperks.com" },
                { label: "Google AI Studio — free Gemini tier", url: "https://aistudio.google.com" },
                { label: "OpenRouter — free daily quotas", url: "https://openrouter.ai" },
                { label: "Anthropic Console — free tier", url: "https://console.anthropic.com" },
              ].map(link => (
                <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer"
                   className="flex items-center gap-2 py-1.5 text-[11px] text-slate-300 hover:text-cyan-300 transition-colors">
                  <ArrowRight size={10} className="text-cyan-600 flex-shrink-0" />
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ─── Tab: Token Tips ─── */}
      {activeTab === "tips" && (
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          <div className="p-3 rounded-xl border border-amber-900/40 bg-amber-950/10 mb-3">
            <div className="flex items-center gap-2 mb-1">
              <Zap size={13} className="text-amber-400" />
              <span className="text-xs font-bold text-amber-300">Token Cost Quick-Win Checklist</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Output tokens cost <span className="text-amber-300 font-semibold">3–5× more</span> than input tokens.
              These tips target the biggest cost levers, sourced from McKay Wrigley, Simon Willison, Allie K. Miller, and Sufyan Maan.
            </p>
          </div>

          {TOKEN_TIPS.map(tip => <TipCard key={tip.id} tip={tip} />)}

          {/* Sufyan Maan shortcut codes */}
          <div className="p-3 rounded-xl border border-violet-900/40 bg-violet-950/10 mt-2">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare size={13} className="text-violet-400" />
              <span className="text-xs font-bold text-violet-300">Sufyan Maan's Secret Code Commands</span>
            </div>
            <p className="text-[11px] text-slate-400 mb-3 leading-relaxed">
              Paste these into your system instructions. They override verbose default behavior and can reduce tokens by up to 40%.
            </p>
            {[
              { code: "/deepthink",    desc: "Forces step-by-step reasoning before answering — fewer hallucinations, fewer correction rounds" },
              { code: "PARETO",        desc: "Instructs the AI to focus on the 20% of effort that gives 80% of output. Cuts filler content." },
              { code: "/autoprompt",   desc: "AI rewrites your next prompt for you before answering — improves quality, reduces your typing" },
            ].map(item => (
              <div key={item.code} className="mb-2.5 last:mb-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <code className="text-[11px] font-mono bg-slate-800 text-violet-300 px-1.5 py-0.5 rounded border border-slate-700">
                    {item.code}
                  </code>
                  <CopyableCode text={item.code} />
                </div>
                <p className="text-[11px] text-slate-500 pl-1 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── Footer ─── */}
      <div className="flex-shrink-0 border-t border-slate-800 px-4 py-2">
        <p className="text-[10px] text-slate-600 text-center">
          {activeTab === "articles" && "13 RSS sources · Substack, HN, Reddit, Microsoft, OpenAI & Google"}
          {activeTab === "experts"  && "Follow these creators to stay ahead on AI cost optimization"}
          {activeTab === "tips"     && "Tips by McKay Wrigley · Simon Willison · Allie K. Miller · Sufyan Maan"}
        </p>
      </div>
    </div>
  );
}

// Small inline helper — no state needed at module level
function CopyableCode({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); }); }}
      className="text-[10px] text-slate-600 hover:text-slate-400 transition-colors flex items-center gap-0.5">
      {copied ? <Check size={9} className="text-emerald-400" /> : <Copy size={9} />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}
