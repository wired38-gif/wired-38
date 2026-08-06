import React, { useState, useEffect, useCallback } from "react";
import {
  Rss, ExternalLink, RefreshCw, Tag, Clock, AlertCircle,
  Newspaper, Sparkles, Search, ChevronDown, ChevronUp,
} from "lucide-react";

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

const HIGHLIGHT_KEYWORDS = [
  "mai-code", "mai-1", "mai", "microsoft", "free", "open-source",
  "token", "tokens", "pricing", "free tier", "copilot",
];

function highlightKeywords(text: string): React.ReactNode {
  const lower = text.toLowerCase();
  const segments: React.ReactNode[] = [];
  let cursor = 0;

  // Build a sorted list of match positions
  const matches: { start: number; end: number; word: string }[] = [];
  for (const kw of HIGHLIGHT_KEYWORDS) {
    let pos = lower.indexOf(kw, 0);
    while (pos !== -1) {
      matches.push({ start: pos, end: pos + kw.length, word: kw });
      pos = lower.indexOf(kw, pos + 1);
    }
  }

  // Sort by start position, remove overlaps
  matches.sort((a, b) => a.start - b.start);
  const deduped: typeof matches = [];
  for (const m of matches) {
    if (deduped.length === 0 || m.start >= deduped[deduped.length - 1].end) {
      deduped.push(m);
    }
  }

  for (const m of deduped) {
    if (cursor < m.start) segments.push(text.slice(cursor, m.start));
    segments.push(
      <mark key={m.start} className="bg-indigo-500/20 text-indigo-300 rounded px-0.5">
        {text.slice(m.start, m.end)}
      </mark>
    );
    cursor = m.end;
  }
  if (cursor < text.length) segments.push(text.slice(cursor));
  return segments.length > 0 ? segments : text;
}

function timeAgo(iso: string): string {
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    return `${d}d ago`;
  } catch {
    return "";
  }
}

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
        {/* Header row */}
        <div className="flex items-start gap-2 mb-2">
          {article.relevant && (
            <Sparkles size={11} className="flex-shrink-0 mt-0.5 text-indigo-400" />
          )}
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
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 text-slate-600 hover:text-indigo-400 transition-colors"
          >
            <ExternalLink size={12} />
          </a>
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-2 text-[10px] text-slate-500 mb-2">
          <a
            href={article.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 hover:text-slate-300 transition-colors"
          >
            <Rss size={9} />
            {article.source}
          </a>
          <span className="text-slate-700">·</span>
          <span className="flex items-center gap-1">
            <Clock size={9} />
            {timeAgo(article.publishedAt)}
          </span>
          {article.relevant && (
            <>
              <span className="text-slate-700">·</span>
              <span className="text-indigo-400 font-medium">AI relevant</span>
            </>
          )}
        </div>

        {/* Summary (toggleable) */}
        {article.summary && (
          <>
            <p className={`text-[11px] text-slate-500 leading-relaxed ${isExpanded ? "" : "line-clamp-2"}`}>
              {highlightKeywords(article.summary)}
            </p>
            {article.summary.length > 120 && (
              <button
                onClick={onToggle}
                className="flex items-center gap-1 mt-1 text-[10px] text-slate-600 hover:text-slate-400 transition-colors"
              >
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

export function AIResearchFeed() {
  const [data, setData] = useState<ResearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "relevant">("relevant");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [showSources, setShowSources] = useState(false);

  const fetchFeed = useCallback(async (refresh = false) => {
    setLoading(true);
    setError(null);
    try {
      const url = `/api/ai-research${refresh ? "?refresh=true" : ""}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: ResearchResponse = await res.json();
      setData(json);
    } catch (e: any) {
      setError(e.message || "Failed to load feed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchFeed(); }, [fetchFeed]);

  function toggleExpanded(id: string) {
    setExpandedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const displayed = (data?.articles ?? []).filter(a => {
    if (filter === "relevant" && !a.relevant) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return a.title.toLowerCase().includes(q) || a.summary.toLowerCase().includes(q) || a.source.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="h-full flex flex-col bg-slate-950 text-white overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Newspaper size={16} className="text-indigo-400" />
            <h2 className="text-sm font-bold text-white">AI Research Feed</h2>
            {data && (
              <span className="text-[10px] text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded-full">
                {data.relevantCount} relevant
              </span>
            )}
          </div>
          <button
            onClick={() => fetchFeed(true)}
            disabled={loading}
            className="flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-white transition-colors disabled:opacity-50"
          >
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
            {loading ? "Loading…" : "Refresh"}
          </button>
        </div>

        <p className="text-[11px] text-slate-500 mb-3 leading-relaxed">
          Live feed from Substack AI newsletters, Microsoft AI Blog, OpenAI, and Google AI — filtered for AI tokens, free tools, and new releases like{" "}
          <span className="text-indigo-400 font-medium">MAI-Code</span>.
        </p>

        {/* Search */}
        <div className="relative mb-2">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search articles…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-7 pr-3 py-1.5 text-xs text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        {/* Filter pills */}
        <div className="flex gap-1.5">
          {(["relevant", "all"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-[11px] px-2.5 py-1 rounded-full border transition-all ${
                filter === f
                  ? "bg-indigo-600 border-indigo-500 text-white"
                  : "border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-300"
              }`}
            >
              {f === "relevant" ? "AI Relevant" : "All Articles"}
            </button>
          ))}
        </div>
      </div>

      {/* Sources disclosure */}
      <div className="flex-shrink-0 border-b border-slate-800/50">
        <button
          onClick={() => setShowSources(v => !v)}
          className="w-full flex items-center justify-between px-4 py-2 text-[10px] text-slate-500 hover:text-slate-300 transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <Tag size={10} />
            {data ? `${data.sources.length} sources` : "Sources"}
          </span>
          {showSources ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
        </button>

        {showSources && data && (
          <div className="px-4 pb-3 flex flex-wrap gap-1.5">
            {data.sources.map(s => (
              <a
                key={s.id}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[10px] text-slate-400 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-full px-2 py-0.5 transition-colors"
              >
                <Rss size={8} />
                {s.name}
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Articles list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {error && (
          <div className="flex items-start gap-2 p-3 bg-red-950/30 border border-red-900/50 rounded-xl text-xs text-red-400">
            <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Failed to load feed</p>
              <p className="text-red-500/80 mt-0.5">{error}</p>
            </div>
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

        {!loading && !error && displayed.length === 0 && (
          <div className="text-center py-8 text-slate-500">
            <Newspaper size={24} className="mx-auto mb-2 text-slate-700" />
            <p className="text-xs">No articles found</p>
            {filter === "relevant" && (
              <button onClick={() => setFilter("all")} className="text-[11px] text-indigo-400 mt-1 hover:underline">
                Show all articles
              </button>
            )}
          </div>
        )}

        {displayed.map(article => (
          <ArticleCard
            key={article.id}
            article={article}
            isExpanded={expandedIds.has(article.id)}
            onToggle={() => toggleExpanded(article.id)}
          />
        ))}

        {data?.fetchedAt && (
          <p className="text-center text-[10px] text-slate-700 pt-2 pb-1">
            Last refreshed {timeAgo(data.fetchedAt)}
          </p>
        )}
      </div>

      {/* Feed notice */}
      <div className="flex-shrink-0 border-t border-slate-800 px-4 py-2">
        <p className="text-[10px] text-slate-600 text-center">
          Feeds from Substack, Microsoft, OpenAI & Google · Updates every 30 min
        </p>
      </div>
    </div>
  );
}
