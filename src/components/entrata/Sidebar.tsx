import React from "react";
import {
  Home, FileText, Wrench, DollarSign, BarChart2,
  Users, ChevronRight, Star, BookOpen, Youtube,
  Building2, Layers, Plug
} from "lucide-react";
import { EntrataWorkflow, RoleType, WorkflowProgress, WorkflowSuite } from "../../entrataTypes";
import { ROLES, WORKFLOW_PLATFORM_MAP, OXP_SUITES, RXP_SUITES } from "../../data/workflows";
import { ClearWorthLogo } from "../Logos";

interface SidebarProps {
  workflows: EntrataWorkflow[];
  activeWorkflowId: string | null;
  selectedRole: RoleType;
  onRoleChange: (role: RoleType) => void;
  onWorkflowSelect: (id: string) => void;
  onViewChange: (view: "workflow" | "reference" | "glossary" | "videos" | "oauth") => void;
  currentView: string;
  progress: Record<string, WorkflowProgress>;
}

function WorkflowItem({ wf, activeWorkflowId, currentView, progress, onWorkflowSelect }: {
  wf: EntrataWorkflow;
  activeWorkflowId: string | null;
  currentView: string;
  progress: Record<string, WorkflowProgress>;
  onWorkflowSelect: (id: string) => void;
}) {
  const pct = getCompletionPercent(wf.id, wf.steps.length, progress);
  const isActive = activeWorkflowId === wf.id && currentView === "workflow";
  const isDone = progress[wf.id]?.completedAt;

  return (
    <button
      onClick={() => onWorkflowSelect(wf.id)}
      className={`w-full text-left rounded-md px-2.5 py-1.5 transition-all duration-150 group relative ${
        isActive
          ? "bg-indigo-600/20 border border-indigo-500/40"
          : "border border-transparent hover:bg-slate-800 hover:border-slate-700"
      }`}
    >
      <div className="flex items-center gap-2">
        <div className={`flex-shrink-0 w-3 h-3 rounded-full border flex items-center justify-center ${
          isDone ? "bg-emerald-500 border-emerald-500"
          : pct > 0 ? "border-amber-500 bg-amber-500/10"
          : "border-slate-600"
        }`}>
          {isDone && <svg width="7" height="7" viewBox="0 0 7 7" fill="none"><path d="M1 3.5L2.8 5L6 2" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>}
        </div>
        <div className="flex-1 min-w-0">
          <div className={`text-[11px] font-medium leading-tight truncate ${
            isActive ? "text-indigo-300" : isDone ? "text-emerald-400" : "text-slate-300 group-hover:text-white"
          }`}>{wf.shortName}</div>
          {pct > 0 && !isDone && (
            <div className="mt-0.5 w-full bg-slate-700 rounded-full h-0.5">
              <div className="bg-amber-500 h-0.5 rounded-full" style={{ width: `${pct}%` }} />
            </div>
          )}
        </div>
        <ChevronRight size={9} className={`flex-shrink-0 ${isActive ? "text-indigo-400" : "text-slate-700 group-hover:text-slate-500"}`} />
      </div>
    </button>
  );
}

function getCompletionPercent(workflowId: string, totalSteps: number, progress: Record<string, WorkflowProgress>) {
  const p = progress[workflowId];
  if (!p) return 0;
  return Math.round((p.completedSteps.length / totalSteps) * 100);
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

  const totalCompleted = Object.values(progress).filter(p => p.completedAt).length;

  return (
    <aside className="flex flex-col h-full bg-slate-900 border-r border-slate-800 overflow-hidden">
      {/* Header */}
      <div className="p-3 border-b border-slate-800">
        {/* ClearWorth branding */}
        <ClearWorthLogo dark className="mb-2" />
        <div className="flex items-center gap-1.5 mb-3">
          <span className="text-[9px] text-slate-500 uppercase tracking-wider font-semibold">Training powered by</span>
          <span className="text-[#E31837] font-black text-sm tracking-tight">entrata</span>
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
          <button
            onClick={() => onViewChange("oauth")}
            className={`col-span-2 flex items-center justify-center gap-1.5 py-2 rounded-md text-[10px] font-semibold transition-all border ${
              currentView === "oauth"
                ? "bg-teal-600/20 text-teal-400 border-teal-500/30"
                : "text-slate-500 border-transparent hover:text-slate-300 hover:bg-slate-800"
            }`}
          >
            <Plug size={11} /> OAuth & Integrations
          </button>
        </div>
      </div>

      {/* Workflow List — OXP / RXP Platform Structure */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="p-2 space-y-1">

          {/* OXP Platform */}
          <div className="px-2 pt-2 pb-1 flex items-center gap-2">
            <span className="text-[9px] font-black text-white bg-[#003087] px-1.5 py-0.5 rounded uppercase tracking-wider">OXP</span>
            <span className="text-[9px] text-slate-500 font-medium">Operations</span>
          </div>

          {OXP_SUITES.map(({ suite, color, dotColor }) => {
            const suiteWorkflows = filtered.filter(wf => {
              const meta = WORKFLOW_PLATFORM_MAP[wf.id];
              return meta?.platform === "OXP" && meta?.suite === suite;
            });
            if (suiteWorkflows.length === 0) return null;
            return (
              <div key={suite}>
                <div className={`flex items-center gap-1.5 px-2 py-1 ${color}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${dotColor} flex-shrink-0`} />
                  <span className="text-[9px] font-bold uppercase tracking-wider">{suite}</span>
                  <span className="text-[9px] text-slate-600 ml-auto">{suiteWorkflows.length}</span>
                </div>
                {suiteWorkflows.map(wf => <WorkflowItem key={wf.id} wf={wf} activeWorkflowId={activeWorkflowId} currentView={currentView} progress={progress} onWorkflowSelect={onWorkflowSelect} />)}
              </div>
            );
          })}

          {/* RXP Platform */}
          <div className="px-2 pt-3 pb-1 flex items-center gap-2 border-t border-slate-800 mt-1">
            <span className="text-[9px] font-black text-white bg-[#6BBF9E] px-1.5 py-0.5 rounded uppercase tracking-wider">RXP</span>
            <span className="text-[9px] text-slate-500 font-medium">Resident Exp.</span>
          </div>

          {RXP_SUITES.map(({ suite, color, dotColor }) => {
            const suiteWorkflows = filtered.filter(wf => {
              const meta = WORKFLOW_PLATFORM_MAP[wf.id];
              return meta?.platform === "RXP" && meta?.suite === suite;
            });
            if (suiteWorkflows.length === 0) return null;
            return (
              <div key={suite}>
                <div className={`flex items-center gap-1.5 px-2 py-1 ${color}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${dotColor} flex-shrink-0`} />
                  <span className="text-[9px] font-bold uppercase tracking-wider">{suite}</span>
                  <span className="text-[9px] text-slate-600 ml-auto">{suiteWorkflows.length}</span>
                </div>
                {suiteWorkflows.map(wf => <WorkflowItem key={wf.id} wf={wf} activeWorkflowId={activeWorkflowId} currentView={currentView} progress={progress} onWorkflowSelect={onWorkflowSelect} />)}
              </div>
            );
          })}

          {/* Unmapped fallback */}
          {filtered.filter(wf => !WORKFLOW_PLATFORM_MAP[wf.id]).length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 px-2 py-1 text-slate-500">
                <span className="text-[9px] font-bold uppercase tracking-wider">Other</span>
              </div>
              {filtered.filter(wf => !WORKFLOW_PLATFORM_MAP[wf.id]).map(wf =>
                <WorkflowItem key={wf.id} wf={wf} activeWorkflowId={activeWorkflowId} currentView={currentView} progress={progress} onWorkflowSelect={onWorkflowSelect} />
              )}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
