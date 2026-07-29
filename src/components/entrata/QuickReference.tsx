import React, { useState } from "react";
import { ChevronRight, BookOpen, FileText } from "lucide-react";
import { QUICK_REFERENCE, GLOSSARY } from "../../data/referenceData";
import { RoleType } from "../../entrataTypes";

interface QuickReferenceProps {
  view: "reference" | "glossary";
  selectedRole: RoleType;
}

function PathTag({ segment, isLast }: { segment: string; isLast: boolean }) {
  return (
    <code className={`px-2 py-0.5 rounded text-xs font-mono font-semibold border ${
      isLast
        ? "bg-indigo-600/20 text-indigo-300 border-indigo-500/30"
        : "bg-slate-800 text-slate-400 border-slate-700"
    }`}>
      {segment}
    </code>
  );
}

export function QuickReference({ view, selectedRole }: QuickReferenceProps) {
  const [openGlossaryId, setOpenGlossaryId] = useState<string | null>(null);

  const filteredRef = QUICK_REFERENCE.filter(r =>
    selectedRole === "All" ? true : r.role.includes(selectedRole) || r.role.includes("All")
  );

  if (view === "glossary") {
    return (
      <div className="h-full flex flex-col overflow-hidden">
        <div className="flex-shrink-0 p-5 border-b border-slate-800 bg-gradient-to-b from-violet-600/10 to-transparent">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen size={18} className="text-violet-400" />
            <h2 className="text-lg font-bold text-white">Property Management Glossary</h2>
          </div>
          <p className="text-sm text-slate-400">
            Key Entrata and property management terms with definitions.
          </p>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-thin">
          {GLOSSARY.map(term => (
            <div
              key={term.id}
              className={`rounded-xl border cursor-pointer transition-all duration-200 ${
                openGlossaryId === term.id
                  ? "bg-slate-800 border-violet-500/40"
                  : "bg-slate-900/50 border-slate-800 hover:border-slate-600"
              }`}
              onClick={() => setOpenGlossaryId(openGlossaryId === term.id ? null : term.id)}
            >
              <div className="flex items-center gap-3 p-3">
                <div className="flex-1">
                  <span className="text-sm font-bold text-violet-300">{term.term}</span>
                  {openGlossaryId !== term.id && (
                    <p className="text-xs text-slate-500 mt-0.5 truncate">{term.definition.slice(0, 60)}…</p>
                  )}
                </div>
                <ChevronRight
                  size={14}
                  className={`flex-shrink-0 text-slate-600 transition-transform duration-200 ${
                    openGlossaryId === term.id ? "rotate-90" : ""
                  }`}
                />
              </div>
              {openGlossaryId === term.id && (
                <div className="px-3 pb-3">
                  <p className="text-xs text-slate-300 leading-relaxed mb-2">{term.definition}</p>
                  {term.relatedTerms && term.relatedTerms.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider">Related:</span>
                      {term.relatedTerms.map(t => (
                        <span key={t} className="px-1.5 py-0.5 bg-violet-500/10 text-violet-400 border border-violet-500/20 rounded text-[10px] font-medium">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Quick Reference View
  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-shrink-0 p-5 border-b border-slate-800 bg-gradient-to-b from-emerald-600/10 to-transparent">
        <div className="flex items-center gap-2 mb-2">
          <FileText size={18} className="text-emerald-400" />
          <h2 className="text-lg font-bold text-white">Quick Reference Paths</h2>
        </div>
        <p className="text-sm text-slate-400">
          Instant navigation paths for common Entrata tasks. Filter by your role.
        </p>
      </div>
      <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
        <div className="space-y-1.5">
          {filteredRef.map(item => (
            <div
              key={item.id}
              className="bg-slate-900/50 border border-slate-800 hover:border-slate-600 rounded-xl p-3 transition-all duration-150 group"
            >
              <div className="text-xs font-semibold text-slate-200 group-hover:text-white mb-2 transition-colors">
                {item.title}
              </div>
              <div className="flex flex-wrap items-center gap-1">
                {item.path.map((segment, i) => (
                  <React.Fragment key={i}>
                    <PathTag segment={segment} isLast={i === item.path.length - 1} />
                    {i < item.path.length - 1 && (
                      <ChevronRight size={10} className="text-slate-700" />
                    )}
                  </React.Fragment>
                ))}
              </div>
              {item.notes && (
                <p className="text-[11px] text-slate-500 mt-1.5">{item.notes}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
