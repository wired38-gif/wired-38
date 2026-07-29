import React from "react";
import {
  Clock, Layers, Users, Wrench, DollarSign, BarChart2,
  Star, ChevronRight, Play, RotateCcw, CheckCircle2, BookOpen,
  AlertTriangle, Lightbulb, Home
} from "lucide-react";
import { EntrataWorkflow, WorkflowStep } from "../../entrataTypes";

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  "Leasing": <Users size={16} />,
  "Move-In/Move-Out": <Home size={16} />,
  "Maintenance": <Wrench size={16} />,
  "Financial": <DollarSign size={16} />,
  "Reports": <BarChart2 size={16} />,
  "Resident Services": <Star size={16} />,
};

const CATEGORY_COLORS: Record<string, { bg: string; text: string; badge: string }> = {
  "Leasing": { bg: "from-blue-600/20 to-blue-800/10", text: "text-blue-400", badge: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
  "Move-In/Move-Out": { bg: "from-amber-600/20 to-amber-800/10", text: "text-amber-400", badge: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
  "Maintenance": { bg: "from-emerald-600/20 to-emerald-800/10", text: "text-emerald-400", badge: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
  "Financial": { bg: "from-rose-600/20 to-rose-800/10", text: "text-rose-400", badge: "bg-rose-500/15 text-rose-400 border-rose-500/30" },
  "Reports": { bg: "from-violet-600/20 to-violet-800/10", text: "text-violet-400", badge: "bg-violet-500/15 text-violet-400 border-violet-500/30" },
  "Resident Services": { bg: "from-cyan-600/20 to-cyan-800/10", text: "text-cyan-400", badge: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30" },
};

interface WorkflowSimulatorProps {
  workflow: EntrataWorkflow | null;
  currentStepIndex: number;
  completedSteps: string[];
  onStepClick: (index: number) => void;
  onStart: () => void;
  onReset: () => void;
  mode: "learning" | "quick-reference";
}

function PathDisplay({ path }: { path: string[] }) {
  return (
    <div className="flex flex-wrap items-center gap-1">
      {path.map((segment, i) => (
        <React.Fragment key={i}>
          <code className={`px-2 py-1 rounded text-xs font-mono font-semibold ${
            i === 0
              ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30"
              : i === path.length - 1
              ? "bg-slate-700 text-white border border-slate-600"
              : "bg-slate-800 text-slate-400 border border-slate-700"
          }`}>
            {segment}
          </code>
          {i < path.length - 1 && (
            <ChevronRight size={12} className="text-slate-600" />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

function StepCard({
  step,
  index,
  isActive,
  isCompleted,
  isPending,
  onClick,
  mode,
}: {
  step: WorkflowStep;
  index: number;
  isActive: boolean;
  isCompleted: boolean;
  isPending: boolean;
  onClick: () => void;
  mode: "learning" | "quick-reference";
}) {
  return (
    <div
      onClick={onClick}
      className={`rounded-xl border transition-all duration-200 cursor-pointer ${
        isActive
          ? "bg-slate-800 border-indigo-500/50 shadow-lg shadow-indigo-900/20"
          : isCompleted
          ? "bg-emerald-500/5 border-emerald-500/20 opacity-80"
          : isPending
          ? "bg-slate-900/50 border-slate-800 hover:border-slate-600"
          : "bg-slate-900/50 border-slate-800"
      }`}
    >
      {/* Step Header */}
      <div className={`flex items-start gap-3 p-4 ${mode === "learning" && !isActive && !isCompleted ? "" : ""}`}>
        {/* Step Number / Status */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${
          isCompleted
            ? "bg-emerald-500 border-emerald-500 text-white"
            : isActive
            ? "bg-indigo-600/20 border-indigo-500 text-indigo-400"
            : "bg-slate-800 border-slate-700 text-slate-500"
        }`}>
          {isCompleted ? (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M3 7L5.5 9.5L11 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          ) : (
            index + 1
          )}
        </div>

        {/* Step Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className={`text-sm font-bold ${
              isCompleted ? "text-emerald-400" :
              isActive ? "text-white" : "text-slate-400"
            }`}>
              {step.action}
            </h4>
            {isActive && (
              <span className="bg-indigo-600/30 text-indigo-400 text-[9px] font-bold px-1.5 py-0.5 rounded border border-indigo-500/30 uppercase tracking-wider flex-shrink-0">
                Active
              </span>
            )}
          </div>

          {/* Full description in learning mode, or active state */}
          {(mode === "learning" || isActive) && (
            <p className={`text-xs leading-relaxed mb-2 ${
              isCompleted ? "text-emerald-400/60 line-through" : "text-slate-300"
            }`}>
              {step.description}
            </p>
          )}

          {/* Breadcrumb path — always shown */}
          <PathDisplay path={step.breadcrumb} />

          {/* Warning & Tip — only in learning mode or active */}
          {(mode === "learning" || isActive) && (
            <div className="mt-2 space-y-2">
              {step.warning && (
                <div className="flex gap-2 bg-amber-500/8 border border-amber-500/20 rounded-lg p-2">
                  <AlertTriangle size={12} className="text-amber-400 flex-shrink-0 mt-0.5" />
                  <p className="text-[11px] text-amber-200/80">{step.warning}</p>
                </div>
              )}
              {step.tip && (
                <div className="flex gap-2 bg-indigo-500/8 border border-indigo-500/20 rounded-lg p-2">
                  <Lightbulb size={12} className="text-indigo-400 flex-shrink-0 mt-0.5" />
                  <p className="text-[11px] text-indigo-200/80">{step.tip}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function WorkflowSimulator({
  workflow,
  currentStepIndex,
  completedSteps,
  onStepClick,
  onStart,
  onReset,
  mode,
}: WorkflowSimulatorProps) {
  if (!workflow) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center">
        <div className="w-20 h-20 bg-slate-800/80 rounded-3xl flex items-center justify-center mb-6 border border-slate-700">
          <BookOpen size={36} className="text-slate-600" />
        </div>
        <h2 className="text-xl font-bold text-slate-300 mb-2">Select a Workflow</h2>
        <p className="text-sm text-slate-500 max-w-xs leading-relaxed">
          Choose any workflow from the left sidebar to begin your interactive training session.
        </p>
        <div className="mt-6 grid grid-cols-2 gap-3 w-full max-w-sm">
          {[
            { label: "Move-In Process", icon: <Home size={14} />, color: "text-amber-400" },
            { label: "Work Orders", icon: <Wrench size={14} />, color: "text-emerald-400" },
            { label: "Post a Charge", icon: <DollarSign size={14} />, color: "text-rose-400" },
            { label: "Daily Report", icon: <BarChart2 size={14} />, color: "text-violet-400" },
          ].map(item => (
            <div key={item.label} className="bg-slate-800/50 border border-slate-700 rounded-xl p-3 flex items-center gap-2">
              <span className={item.color}>{item.icon}</span>
              <span className="text-xs text-slate-400">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const colors = CATEGORY_COLORS[workflow.category] || CATEGORY_COLORS["Leasing"];
  const isStarted = completedSteps.length > 0 || currentStepIndex > 0;
  const isComplete = completedSteps.length === workflow.steps.length;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Workflow Header */}
      <div className={`flex-shrink-0 bg-gradient-to-b ${colors.bg} border-b border-slate-800 p-5`}>
        {/* Category & Meta */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${colors.badge}`}>
            {CATEGORY_ICONS[workflow.category]}
            {workflow.category}
          </span>
          <span className={`px-2 py-1 rounded-full text-[10px] font-semibold border ${
            workflow.difficulty === "Beginner" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
            workflow.difficulty === "Intermediate" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
            "bg-rose-500/10 text-rose-400 border-rose-500/20"
          }`}>
            {workflow.difficulty}
          </span>
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <Clock size={12} />
            {workflow.estimatedTime}
          </div>
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <Layers size={12} />
            {workflow.steps.length} steps
          </div>
        </div>

        {/* Title & Description */}
        <h2 className="text-lg font-bold text-white mb-1">{workflow.taskName}</h2>
        <p className="text-sm text-slate-400 leading-relaxed mb-3">{workflow.description}</p>

        {/* Full System Path */}
        <div className="bg-slate-900/60 rounded-lg p-3 border border-slate-700/50">
          <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-2 font-semibold">Full System Path</div>
          <PathDisplay path={workflow.systemPath} />
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 mt-3">
          {!isStarted && !isComplete && (
            <button
              onClick={onStart}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl transition-all duration-150 shadow-lg shadow-indigo-900/40"
            >
              <Play size={14} />
              Start Training
            </button>
          )}
          {(isStarted || isComplete) && (
            <button
              onClick={onReset}
              className="flex items-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-semibold rounded-xl transition-all duration-150"
            >
              <RotateCcw size={13} />
              Reset
            </button>
          )}
          {isComplete && (
            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 text-sm font-bold rounded-xl">
              <CheckCircle2 size={14} />
              Complete!
            </div>
          )}
        </div>
      </div>

      {/* Steps List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-thin">
        {workflow.steps.map((step, i) => (
          <StepCard
            key={step.id}
            step={step}
            index={i}
            isActive={i === currentStepIndex && isStarted}
            isCompleted={completedSteps.includes(step.id)}
            isPending={i > currentStepIndex}
            onClick={() => onStepClick(i)}
            mode={mode}
          />
        ))}
      </div>
    </div>
  );
}
