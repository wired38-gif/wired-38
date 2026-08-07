import React, { useState } from "react";
import {
  Sparkles, ChevronDown, ChevronUp, Send, Copy, Check,
  Zap, Brain, ExternalLink, ArrowRight
} from "lucide-react";
import type { OptimizeResult, PromptVariant } from "../types";

const COST_STYLES: Record<string, string> = {
  free:   "text-emerald-400 bg-emerald-400/10 border-emerald-500/30",
  low:    "text-blue-400 bg-blue-400/10 border-blue-500/30",
  medium: "text-amber-400 bg-amber-400/10 border-amber-500/30",
  high:   "text-red-400 bg-red-400/10 border-red-500/30",
};

const COMPLEXITY_ICON: Record<string, string> = {
  fast: "⚡",
  balanced: "⚖️",
  thorough: "🔬",
};

const MYK_TOOL_MAP: Record<string, { name: string; url: string; hint: string }> = {
  coding: { name: "Cursor Cloud Agent", url: "https://cursor.com", hint: "Best for complex coding tasks with full repo context" },
  creative: { name: "Gemini 2.5 Pro", url: "https://aistudio.google.com", hint: "Long-form content, brand copy, creative direction" },
  analysis: { name: "Gemini 2.5 Pro", url: "https://aistudio.google.com", hint: "Deep research, data analysis, structured reports" },
  research: { name: "Gemini 2.5 Flash", url: "https://aistudio.google.com", hint: "Fast research summaries with good accuracy" },
  quick: { name: "Super Agent (here)", url: "#", hint: "You're already in the right place" },
  general: { name: "Super Agent (here)", url: "#", hint: "Handled here with RAG memory across your projects" },
};

interface Props {
  result: OptimizeResult;
  rawPrompt: string;
  onUseVariant: (text: string, model: string) => void;
  onSendDirect: () => void;
  loading: boolean;
}

export function SmartRouter({ result, rawPrompt, onUseVariant, onSendDirect, loading }: Props) {
  const [expanded, setExpanded] = useState(true);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const tool = MYK_TOOL_MAP[result.taskType] ?? MYK_TOOL_MAP.general;

  const copy = async (text: string, idx: number) => {
    await navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  return (
    <div className="mx-3 mb-3 rounded-2xl border border-violet-500/30 bg-slate-900/80 backdrop-blur overflow-hidden shadow-lg shadow-violet-900/20">
      {/* Header */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-violet-500/5 transition-colors"
      >
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
          <Brain size={13} className="text-white" />
        </div>
        <div className="flex-1 text-left">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-white">Smart Analysis</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30 capitalize">
              {result.taskType}
            </span>
          </div>
          <p className="text-[10px] text-slate-500 mt-0.5">
            {result.variants.length} optimized prompts · best agent recommended
          </p>
        </div>
        {expanded
          ? <ChevronUp size={14} className="text-slate-500 flex-shrink-0" />
          : <ChevronDown size={14} className="text-slate-500 flex-shrink-0" />
        }
      </button>

      {expanded && (
        <>
          {/* Best tool recommendation */}
          <div className="mx-4 mb-3 px-3 py-2 rounded-xl bg-gradient-to-r from-violet-500/10 to-indigo-500/10 border border-violet-500/20">
            <div className="flex items-center gap-2">
              <Zap size={12} className="text-violet-400 flex-shrink-0" />
              <span className="text-[11px] font-semibold text-violet-200">Recommended: {tool.name}</span>
              {tool.url !== "#" && (
                <a href={tool.url} target="_blank" rel="noopener" className="ml-auto text-violet-500 hover:text-violet-300">
                  <ExternalLink size={10} />
                </a>
              )}
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5 ml-5">{tool.hint}</p>
          </div>

          {/* Prompt variants */}
          <div className="border-t border-slate-800/60 divide-y divide-slate-800/40">
            {result.variants.map((v, i) => (
              <div key={i} className="px-4 py-3 hover:bg-slate-800/20 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] text-slate-600 font-mono">#{i + 1}</span>
                  <span className="text-xs font-semibold text-white">{v.modelLabel}</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded border font-semibold ${COST_STYLES[v.estimatedCost]}`}>
                    {v.estimatedCost}
                  </span>
                  <span className="text-[10px] text-slate-500 ml-auto">{COMPLEXITY_ICON[v.complexity]} {v.complexity}</span>
                </div>

                {/* Prompt text */}
                <div className="bg-slate-950/60 rounded-xl p-2.5 mb-2 relative group">
                  <p className="text-[11px] text-slate-300 leading-relaxed whitespace-pre-wrap pr-6">
                    {v.promptText}
                  </p>
                  <button
                    onClick={() => copy(v.promptText, i)}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 text-slate-600 hover:text-slate-300 transition-all"
                  >
                    {copiedIdx === i ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                  </button>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <p className="text-[10px] text-slate-600 flex-1 leading-relaxed">{v.rationale}</p>
                  <button
                    onClick={() => onUseVariant(v.promptText, v.model)}
                    className="flex-shrink-0 flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1.5 bg-violet-600/20 hover:bg-violet-600/40 border border-violet-500/30 text-violet-300 rounded-lg transition-colors"
                  >
                    <Send size={9} />
                    Use
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Send original */}
          <div className="px-4 py-3 border-t border-slate-800/60 flex items-center gap-3">
            <span className="text-[10px] text-slate-600 flex-1">Or send your original prompt as-is</span>
            <button
              onClick={onSendDirect}
              disabled={loading}
              className="flex items-center gap-1.5 text-[10px] font-semibold px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors disabled:opacity-50"
            >
              <ArrowRight size={10} />
              Send original
            </button>
          </div>
        </>
      )}
    </div>
  );
}
