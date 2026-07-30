import React from "react";
import {
  Home, FileText, Wrench, DollarSign, BarChart2,
  Users, ChevronRight, Star, BookOpen, Youtube
} from "lucide-react";
import { EntrataWorkflow, RoleType, WorkflowProgress } from "../../entrataTypes";
import { ROLES } from "../../data/workflows";

interface SidebarProps {
  workflows: EntrataWorkflow[];
  activeWorkflowId: string | null;
  selectedRole: RoleType;
  onRoleChange: (role: RoleType) => void;
  onWorkflowSelect: (id: string) => void;
  onViewChange: (view: "workflow" | "reference" | "glossary" | "videos") => void;
  currentView: string;
  progress: Record<string, WorkflowProgress>;
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  "Leasing": <Users size={14} />,
  "Move-In/Move-Out": <Home size={14} />,
  "Maintenance": <Wrench size={14} />,
  "Financial": <DollarSign size={14} />,
  "Reports": <BarChart2 size={14} />,
  "Resident Services": <Star size={14} />,
};

const CATEGORY_COLORS: Record<string, string> = {
  "Leasing": "text-blue-400",
  "Move-In/Move-Out": "text-amber-400",
  "Maintenance": "text-emerald-400",
  "Financial": "text-rose-400",
  "Reports": "text-violet-400",
  "Resident Services": "text-cyan-400",
};

function getCompletionPercent(workflowId: string, totalSteps: number, progress: Record<string, WorkflowProgress>) {
  const p = progress[workflowId];
  if (!p) return 0;
  return Math.round((p.completedSteps.length / totalSteps) * 100);
}

function groupByCategory(workflows: EntrataWorkflow[]) {
  const groups: Record<string, EntrataWorkflow[]> = {};
  for (const wf of workflows) {
    if (!groups[wf.category]) groups[wf.category] = [];
    groups[wf.category].push(wf);
  }
  return groups;
}

export function Sidebar({
  workflows,
  activeWorkflowId,
  selectedRole,
  onRoleChange,
  onWorkflowSelect,
  onViewChange,
  currentView,
  progress,
}: SidebarProps) {
  const filtered = selectedRole === "All"
    ? workflows
    : workflows.filter(w => w.role.includes(selectedRole));

  const grouped = groupByCategory(filtered);
  const totalCompleted = Object.values(progress).filter(p => p.completedAt).length;

  return (
    <aside className="flex flex-col h-full bg-slate-900 border-r border-slate-800 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-800">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <BookOpen size={15} className="text-white" />
          </div>
          <div>
            <div className="text-sm font-bold text-white leading-tight">Entrata Training</div>
            <div className="text-[10px] text-slate-400 leading-tight">Property Management Hub</div>
          </div>
        </div>

        {/* Overall Progress */}
        <div className="bg-slate-800 rounded-lg p-2.5">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Your Progress</span>
            <span className="text-[10px] text-emerald-400 font-bold">{totalCompleted}/{workflows.length} done</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-1.5">
            <div
              className="bg-gradient-to-r from-emerald-500 to-cyan-500 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${Math.round((totalCompleted / workflows.length) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Role Filter */}
      <div className="p-3 border-b border-slate-800">
        <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-2 font-medium px-1">Filter by Role</div>
        <div className="grid grid-cols-2 gap-1">
          {ROLES.map(role => (
            <button
              key={role.value}
              onClick={() => onRoleChange(role.value)}
              className={`px-2 py-1.5 rounded-md text-[10px] font-semibold border transition-all duration-150 text-left truncate ${
                selectedRole === role.value
                  ? `${role.bgColor} ${role.color} border-current`
                  : "bg-transparent text-slate-500 border-slate-700 hover:border-slate-500 hover:text-slate-300"
              }`}
            >
              {role.value === "All" ? "All Roles" : role.value}
            </button>
          ))}
        </div>
      </div>

      {/* Navigation Shortcuts */}
      <div className="px-3 py-2 border-b border-slate-800">
        <div className="grid grid-cols-2 gap-1">
          <button
            onClick={() => onViewChange("reference")}
            className={`flex items-center justify-center gap-1 py-2 rounded-md text-[10px] font-semibold transition-all border ${
              currentView === "reference"
                ? "bg-indigo-600/20 text-indigo-400 border-indigo-500/30"
                : "text-slate-500 border-transparent hover:text-slate-300 hover:bg-slate-800"
            }`}
          >
            <FileText size={11} /> Quick Ref
          </button>
          <button
            onClick={() => onViewChange("glossary")}
            className={`flex items-center justify-center gap-1 py-2 rounded-md text-[10px] font-semibold transition-all border ${
              currentView === "glossary"
                ? "bg-violet-600/20 text-violet-400 border-violet-500/30"
                : "text-slate-500 border-transparent hover:text-slate-300 hover:bg-slate-800"
            }`}
          >
            <BookOpen size={11} /> Glossary
          </button>
        </div>
      </div>

      {/* Workflow List */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="p-2 space-y-1">
          {Object.entries(grouped).map(([category, wfs]) => (
            <div key={category}>
              {/* Category Header */}
              <div className={`flex items-center gap-1.5 px-2 py-1.5 ${CATEGORY_COLORS[category] || "text-slate-400"}`}>
                {CATEGORY_ICONS[category]}
                <span className="text-[10px] font-bold uppercase tracking-wider">{category}</span>
                <span className="text-[9px] text-slate-600 ml-auto">{wfs.length}</span>
              </div>

              {/* Workflow Items */}
              {wfs.map(wf => {
                const pct = getCompletionPercent(wf.id, wf.steps.length, progress);
                const isActive = activeWorkflowId === wf.id && currentView === "workflow";
                const isDone = progress[wf.id]?.completedAt;

                return (
                  <button
                    key={wf.id}
                    onClick={() => onWorkflowSelect(wf.id)}
                    className={`w-full text-left rounded-md px-2.5 py-2 transition-all duration-150 group relative ${
                      isActive
                        ? "bg-indigo-600/20 border border-indigo-500/40"
                        : "border border-transparent hover:bg-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <div className={`flex-shrink-0 mt-0.5 w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                        isDone
                          ? "bg-emerald-500 border-emerald-500"
                          : pct > 0
                          ? "border-amber-500 bg-amber-500/10"
                          : "border-slate-600"
                      }`}>
                        {isDone && (
                          <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                            <path d="M1.5 4L3 5.5L6.5 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`text-[11px] font-medium leading-tight truncate ${
                          isActive ? "text-indigo-300" : isDone ? "text-emerald-400" : "text-slate-300 group-hover:text-white"
                        }`}>
                          {wf.shortName}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className={`text-[9px] font-medium ${
                            wf.difficulty === "Beginner" ? "text-emerald-600" :
                            wf.difficulty === "Intermediate" ? "text-amber-600" : "text-rose-600"
                          }`}>{wf.difficulty}</span>
                          <span className="text-[9px] text-slate-600">·</span>
                          <span className="text-[9px] text-slate-600">{wf.estimatedTime}</span>
                        </div>
                        {pct > 0 && !isDone && (
                          <div className="mt-1 w-full bg-slate-700 rounded-full h-0.5">
                            <div
                              className="bg-amber-500 h-0.5 rounded-full transition-all duration-300"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        )}
                      </div>
                      <ChevronRight
                        size={10}
                        className={`flex-shrink-0 mt-1 transition-transform ${isActive ? "text-indigo-400 translate-x-0.5" : "text-slate-600 group-hover:text-slate-400"}`}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
