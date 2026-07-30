import React, { useState, useMemo, useRef, useEffect } from "react";
import { Search, X, ChevronRight, Wrench, DollarSign, BarChart2, Users, Star, Home } from "lucide-react";
import { EntrataWorkflow } from "../../entrataTypes";
import { GLOSSARY, QUICK_REFERENCE } from "../../data/referenceData";

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  "Leasing": <Users size={12} />,
  "Move-In/Move-Out": <Home size={12} />,
  "Maintenance": <Wrench size={12} />,
  "Financial": <DollarSign size={12} />,
  "Reports": <BarChart2 size={12} />,
  "Resident Services": <Star size={12} />,
};

interface SearchOverlayProps {
  workflows: EntrataWorkflow[];
  onSelect: (workflowId: string) => void;
  onClose: () => void;
}

type ResultType = "workflow" | "glossary" | "quickref";

interface SearchResult {
  type: ResultType;
  id: string;
  title: string;
  subtitle: string;
  path?: string[];
  category?: string;
}

export function SearchOverlay({ workflows, onSelect, onClose }: SearchOverlayProps) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const results = useMemo<SearchResult[]>(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();

    const workflowResults: SearchResult[] = workflows
      .filter(
        wf =>
          wf.taskName.toLowerCase().includes(q) ||
          wf.shortName.toLowerCase().includes(q) ||
          wf.description.toLowerCase().includes(q) ||
          wf.tags.some(t => t.toLowerCase().includes(q)) ||
          wf.steps.some(s => s.action.toLowerCase().includes(q))
      )
      .map(wf => ({
        type: "workflow" as ResultType,
        id: wf.id,
        title: wf.taskName,
        subtitle: `${wf.category} · ${wf.steps.length} steps · ${wf.estimatedTime}`,
        category: wf.category,
      }));

    const glossaryResults: SearchResult[] = GLOSSARY
      .filter(
        g =>
          g.term.toLowerCase().includes(q) ||
          g.definition.toLowerCase().includes(q)
      )
      .map(g => ({
        type: "glossary" as ResultType,
        id: g.id,
        title: g.term,
        subtitle: g.definition.length > 80 ? g.definition.slice(0, 80) + "…" : g.definition,
      }));

    const qrResults: SearchResult[] = QUICK_REFERENCE
      .filter(r => r.title.toLowerCase().includes(q) || r.path.join(" ").toLowerCase().includes(q))
      .map(r => ({
        type: "quickref" as ResultType,
        id: r.id,
        title: r.title,
        subtitle: r.path.join(" › "),
        path: r.path,
      }));

    return [...workflowResults, ...qrResults, ...glossaryResults];
  }, [query, workflows]);

  function handleSelect(result: SearchResult) {
    if (result.type === "workflow") {
      onSelect(result.id);
      onClose();
    }
  }

  function getTypeBadge(type: ResultType) {
    switch (type) {
      case "workflow":
        return <span className="px-1.5 py-0.5 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded text-[9px] font-bold uppercase tracking-wider">Workflow</span>;
      case "glossary":
        return <span className="px-1.5 py-0.5 bg-violet-500/20 text-violet-400 border border-violet-500/30 rounded text-[9px] font-bold uppercase tracking-wider">Glossary</span>;
      case "quickref":
        return <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded text-[9px] font-bold uppercase tracking-wider">Quick Ref</span>;
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden">
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-700">
          <Search size={18} className="text-slate-400 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search workflows, terms, paths…"
            className="flex-1 bg-transparent text-white placeholder:text-slate-500 text-sm outline-none"
          />
          <div className="flex items-center gap-2">
            <kbd className="hidden sm:flex items-center px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-[10px] text-slate-500 font-mono">
              Esc
            </kbd>
            <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto">
          {!query.trim() ? (
            <div className="p-6 text-center">
              <Search size={24} className="text-slate-700 mx-auto mb-2" />
              <p className="text-sm text-slate-500">Start typing to search workflows, terms, and paths</p>
              <div className="mt-4 flex flex-wrap gap-2 justify-center">
                {["move-in", "SODA", "work order", "ledger", "renewal"].map(term => (
                  <button
                    key={term}
                    onClick={() => setQuery(term)}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs text-slate-400 hover:text-white transition-colors"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          ) : results.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-sm text-slate-500">No results for "<span className="text-white">{query}</span>"</p>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {results.map(result => (
                <button
                  key={`${result.type}-${result.id}`}
                  onClick={() => handleSelect(result)}
                  className={`w-full text-left px-3 py-3 rounded-xl transition-all group flex items-start gap-3 ${
                    result.type === "workflow"
                      ? "hover:bg-slate-800 cursor-pointer"
                      : "hover:bg-slate-800/50 cursor-default"
                  }`}
                >
                  {result.category && (
                    <span className="flex-shrink-0 mt-0.5 text-slate-500">
                      {CATEGORY_ICONS[result.category] || <Star size={12} />}
                    </span>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-semibold text-white truncate">{result.title}</span>
                      {getTypeBadge(result.type)}
                    </div>
                    <p className="text-xs text-slate-500 truncate">{result.subtitle}</p>
                    {result.path && result.type === "quickref" && (
                      <div className="flex items-center gap-1 mt-1 flex-wrap">
                        {result.path.map((segment, i) => (
                          <React.Fragment key={i}>
                            <code className="text-[10px] text-slate-500 font-mono">{segment}</code>
                            {i < result.path!.length - 1 && <ChevronRight size={8} className="text-slate-700" />}
                          </React.Fragment>
                        ))}
                      </div>
                    )}
                  </div>
                  {result.type === "workflow" && (
                    <ChevronRight size={14} className="flex-shrink-0 mt-1 text-slate-600 group-hover:text-slate-400 transition-colors" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {results.length > 0 && (
          <div className="px-4 py-2 border-t border-slate-800 flex items-center justify-between">
            <span className="text-[10px] text-slate-600">{results.length} result{results.length !== 1 ? "s" : ""}</span>
            <span className="text-[10px] text-slate-600">Click a Workflow to open it</span>
          </div>
        )}
      </div>
    </div>
  );
}
