import React, { useState } from "react";
import {
  ChevronRight, ChevronDown, CheckCircle2, Circle,
  AlertTriangle, Lightbulb, Clock, Layers, Play, RotateCcw, X,
  ArrowRight
} from "lucide-react";
import { EntrataWorkflow, WorkflowStep } from "../../entrataTypes";

interface MobileViewProps {
  workflow: EntrataWorkflow;
  currentStepIndex: number;
  completedSteps: string[];
  onCompleteStep: () => void;
  onNextStep: () => void;
  onPrevStep: () => void;
  onReset: () => void;
  onStart: () => void;
}

function MobileStepBreadcrumb({ path }: { path: string[] }) {
  return (
    <div className="flex flex-wrap items-center gap-1">
      {path.map((segment, i) => (
        <React.Fragment key={i}>
          <code className={`px-1.5 py-0.5 rounded text-[11px] font-mono font-semibold border whitespace-nowrap ${
            i === path.length - 1
              ? "bg-indigo-600/25 text-indigo-300 border-indigo-500/40"
              : "bg-slate-800 text-slate-400 border-slate-700"
          }`}>
            {segment}
          </code>
          {i < path.length - 1 && (
            <ChevronRight size={9} className="text-slate-600 flex-shrink-0" />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

interface BottomSheetProps {
  step: WorkflowStep | null;
  isCompleted: boolean;
  onClose: () => void;
  onComplete: () => void;
  onNext: () => void;
  isLast: boolean;
}

function BottomSheet({ step, isCompleted, onClose, onComplete, onNext, isLast }: BottomSheetProps) {
  if (!step) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900 border-t border-slate-700 rounded-t-3xl shadow-2xl max-h-[85vh] flex flex-col">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2 flex-shrink-0">
          <div className="w-10 h-1 bg-slate-700 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-start gap-3 px-5 pb-4 border-b border-slate-800 flex-shrink-0">
          <div className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 ${
            isCompleted
              ? "bg-emerald-500 border-emerald-500 text-white"
              : "bg-indigo-600/20 border-indigo-500 text-indigo-400"
          }`}>
            {isCompleted ? (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3.5 8L6.5 11L12.5 5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            ) : (
              step.stepNumber
            )}
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-white">{step.action}</h3>
            <div className="mt-1">
              <MobileStepBreadcrumb path={step.breadcrumb} />
            </div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors p-1">
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          <p className="text-sm text-slate-300 leading-relaxed">{step.description}</p>

          {step.warning && (
            <div className="flex gap-3 bg-amber-500/10 border border-amber-500/25 rounded-xl p-3">
              <AlertTriangle size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-[11px] text-amber-500 font-bold uppercase tracking-wider mb-0.5">Warning</div>
                <p className="text-sm text-amber-200/80 leading-relaxed">{step.warning}</p>
              </div>
            </div>
          )}

          {step.tip && (
            <div className="flex gap-3 bg-indigo-500/10 border border-indigo-500/25 rounded-xl p-3">
              <Lightbulb size={16} className="text-indigo-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-[11px] text-indigo-400 font-bold uppercase tracking-wider mb-0.5">Pro Tip</div>
                <p className="text-sm text-indigo-200/80 leading-relaxed">{step.tip}</p>
              </div>
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="px-5 py-4 border-t border-slate-800 flex-shrink-0 space-y-2 pb-safe">
          {!isCompleted ? (
            <button
              onClick={onComplete}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2 text-base shadow-lg shadow-emerald-900/30"
            >
              <CheckCircle2 size={20} />
              Done — Mark Complete
            </button>
          ) : !isLast ? (
            <button
              onClick={() => { onNext(); onClose(); }}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2 text-base shadow-lg shadow-indigo-900/30"
            >
              Next Step
              <ArrowRight size={20} />
            </button>
          ) : (
            <button
              onClick={onClose}
              className="w-full py-4 bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 font-bold rounded-2xl transition-all flex items-center justify-center gap-2 text-base"
            >
              <CheckCircle2 size={20} />
              Workflow Complete!
            </button>
          )}
        </div>
      </div>
    </>
  );
}

export function MobileView({
  workflow,
  currentStepIndex,
  completedSteps,
  onCompleteStep,
  onNextStep,
  onPrevStep,
  onReset,
  onStart,
}: MobileViewProps) {
  const [sheetStepIndex, setSheetStepIndex] = useState<number | null>(null);
  const isStarted = completedSteps.length > 0 || currentStepIndex > 0;
  const isComplete = completedSteps.length === workflow.steps.length;
  const sheetStep = sheetStepIndex !== null ? workflow.steps[sheetStepIndex] : null;

  function handleCompleteFromSheet() {
    onCompleteStep();
    if (sheetStepIndex !== null && sheetStepIndex < workflow.steps.length - 1) {
      setSheetStepIndex(sheetStepIndex + 1);
    } else {
      setSheetStepIndex(null);
    }
  }

  function handleNextFromSheet() {
    onNextStep();
    if (sheetStepIndex !== null && sheetStepIndex < workflow.steps.length - 1) {
      setSheetStepIndex(sheetStepIndex + 1);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Workflow Header */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
              workflow.difficulty === "Beginner" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
              workflow.difficulty === "Intermediate" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
              "bg-rose-500/10 text-rose-400 border-rose-500/20"
            }`}>
              {workflow.difficulty}
            </span>
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <Clock size={11} />
              {workflow.estimatedTime}
            </div>
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <Layers size={11} />
              {workflow.steps.length} steps
            </div>
          </div>
          <button
            onClick={onReset}
            className="flex items-center gap-1 text-slate-500 hover:text-slate-300 text-xs"
          >
            <RotateCcw size={12} />
            Reset
          </button>
        </div>

        <h1 className="text-xl font-bold text-white mb-1">{workflow.taskName}</h1>
        <p className="text-sm text-slate-400 leading-snug">{workflow.description}</p>

        {/* Progress */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] text-slate-500">Progress</span>
            <span className="text-[11px] text-emerald-400 font-bold">
              {completedSteps.length} / {workflow.steps.length} steps
            </span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-emerald-500 to-cyan-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${Math.round((completedSteps.length / workflow.steps.length) * 100)}%` }}
            />
          </div>
        </div>

        {!isStarted && (
          <button
            onClick={onStart}
            className="mt-4 w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-900/30"
          >
            <Play size={16} />
            Start Training
          </button>
        )}

        {isComplete && (
          <div className="mt-4 w-full py-3 bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 font-bold rounded-xl flex items-center justify-center gap-2">
            <CheckCircle2 size={16} />
            Workflow Complete!
          </div>
        )}
      </div>

      {/* Steps */}
      <div className="p-4 space-y-2">
        {workflow.steps.map((step, i) => {
          const isCompleted = completedSteps.includes(step.id);
          const isActive = i === currentStepIndex && isStarted;

          return (
            <button
              key={step.id}
              onClick={() => setSheetStepIndex(i)}
              className={`w-full text-left rounded-2xl border transition-all duration-200 active:scale-[0.98] ${
                isActive
                  ? "bg-slate-800 border-indigo-500/50 shadow-lg shadow-indigo-900/20"
                  : isCompleted
                  ? "bg-emerald-500/5 border-emerald-500/20"
                  : "bg-slate-900/50 border-slate-800"
              }`}
            >
              <div className="flex items-center gap-3 p-4">
                {/* Status Indicator */}
                <div className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center font-bold border-2 ${
                  isCompleted
                    ? "bg-emerald-500 border-emerald-500 text-white"
                    : isActive
                    ? "bg-indigo-600/20 border-indigo-500 text-indigo-400 text-sm"
                    : "bg-slate-800 border-slate-700 text-slate-500 text-sm"
                }`}>
                  {isCompleted ? (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M3.5 8L6.5 11L12.5 5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ) : (
                    i + 1
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-bold truncate ${
                    isCompleted ? "text-emerald-400 line-through" :
                    isActive ? "text-white" : "text-slate-400"
                  }`}>
                    {step.action}
                  </div>
                  {isActive && (
                    <div className="mt-1">
                      <MobileStepBreadcrumb path={step.breadcrumb} />
                    </div>
                  )}
                  {!isActive && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <code className="text-[10px] text-slate-600 font-mono truncate">
                        {step.breadcrumb[step.breadcrumb.length - 1]}
                      </code>
                    </div>
                  )}
                </div>

                {/* Chevron / badges */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {step.warning && !isCompleted && (
                    <AlertTriangle size={13} className="text-amber-500" />
                  )}
                  <ChevronRight size={16} className={`${
                    isActive ? "text-indigo-400" : "text-slate-700"
                  }`} />
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Bottom Sheet */}
      {sheetStep && (
        <BottomSheet
          step={sheetStep}
          isCompleted={completedSteps.includes(sheetStep.id)}
          onClose={() => setSheetStepIndex(null)}
          onComplete={handleCompleteFromSheet}
          onNext={handleNextFromSheet}
          isLast={sheetStepIndex === workflow.steps.length - 1}
        />
      )}
    </div>
  );
}
