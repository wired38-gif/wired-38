import React from "react";
import { CheckCircle2, AlertTriangle, Lightbulb, ChevronRight, Clock, Target, ArrowRight } from "lucide-react";
import { EntrataWorkflow, WorkflowStep } from "../../entrataTypes";

interface CoachPanelProps {
  workflow: EntrataWorkflow | null;
  currentStepIndex: number;
  completedSteps: string[];
  onNextStep: () => void;
  onPrevStep: () => void;
  onCompleteStep: () => void;
}

function BreadcrumbPath({ path }: { path: string[] }) {
  return (
    <div className="flex flex-wrap items-center gap-0.5">
      {path.map((segment, i) => (
        <React.Fragment key={i}>
          <code className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold whitespace-nowrap ${
            i === path.length - 1
              ? "bg-indigo-600/30 text-indigo-300 border border-indigo-500/40"
              : "bg-slate-800 text-slate-400 border border-slate-700"
          }`}>
            {segment}
          </code>
          {i < path.length - 1 && (
            <ChevronRight size={10} className="text-slate-600 flex-shrink-0" />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

function StepProgressDots({ total, current, completed }: { total: number; current: number; completed: string[] }) {
  return (
    <div className="flex gap-1 flex-wrap">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-1.5 rounded-full transition-all duration-300 ${
            i < completed.length
              ? "bg-emerald-500 w-4"
              : i === current
              ? "bg-indigo-500 w-4"
              : "bg-slate-700 w-1.5"
          }`}
        />
      ))}
    </div>
  );
}

export function CoachPanel({
  workflow,
  currentStepIndex,
  completedSteps,
  onNextStep,
  onPrevStep,
  onCompleteStep,
}: CoachPanelProps) {
  if (!workflow) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center bg-slate-900/50">
        <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mb-4 border border-slate-700">
          <Target size={28} className="text-slate-600" />
        </div>
        <h3 className="text-sm font-semibold text-slate-400 mb-1">No Workflow Selected</h3>
        <p className="text-xs text-slate-600">Select a workflow from the left panel to start training.</p>
      </div>
    );
  }

  const currentStep: WorkflowStep | undefined = workflow.steps[currentStepIndex];
  const isLastStep = currentStepIndex === workflow.steps.length - 1;
  const isComplete = completedSteps.length === workflow.steps.length;
  const currentStepCompleted = currentStep ? completedSteps.includes(currentStep.id) : false;

  return (
    <div className="h-full flex flex-col bg-slate-900/50 overflow-hidden">
      {/* Panel Header */}
      <div className="p-4 border-b border-slate-800 flex-shrink-0">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Coach Panel</span>
          <div className="flex items-center gap-1 text-[10px] text-slate-500">
            <Clock size={10} />
            {workflow.estimatedTime}
          </div>
        </div>

        {/* Step Progress */}
        <div className="mb-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-slate-400">
              Step <span className="text-white font-bold">{currentStepIndex + 1}</span>
              <span className="text-slate-600"> / {workflow.steps.length}</span>
            </span>
            <span className="text-[10px] text-emerald-400 font-semibold">
              {completedSteps.length} completed
            </span>
          </div>
          <StepProgressDots
            total={workflow.steps.length}
            current={currentStepIndex}
            completed={completedSteps}
          />
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
        {isComplete ? (
          /* Completion State */
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mb-4 border-2 border-emerald-500/50">
              <CheckCircle2 size={32} className="text-emerald-400" />
            </div>
            <h3 className="text-base font-bold text-emerald-400 mb-1">Workflow Complete!</h3>
            <p className="text-xs text-slate-400 mb-3">
              You've completed all {workflow.steps.length} steps of{" "}
              <span className="text-white font-semibold">{workflow.taskName}</span>.
            </p>
            <div className="bg-slate-800 rounded-lg p-3 text-left w-full border border-slate-700">
              <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Related Workflows</div>
              {(workflow.relatedWorkflows || []).slice(0, 3).map(id => (
                <div key={id} className="text-xs text-indigo-400 flex items-center gap-1 py-0.5">
                  <ArrowRight size={10} />
                  {id.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
                </div>
              ))}
              {(!workflow.relatedWorkflows || workflow.relatedWorkflows.length === 0) && (
                <div className="text-xs text-slate-500">No related workflows</div>
              )}
            </div>
          </div>
        ) : currentStep ? (
          <>
            {/* Active Path Breadcrumb */}
            <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700">
              <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-2 font-semibold">Entrata Path</div>
              <BreadcrumbPath path={currentStep.breadcrumb} />
            </div>

            {/* Current Step Card */}
            <div className={`rounded-xl border p-4 transition-all duration-300 ${
              currentStepCompleted
                ? "bg-emerald-500/10 border-emerald-500/30"
                : "bg-slate-800/80 border-slate-700"
            }`}>
              <div className="flex items-start gap-3">
                <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                  currentStepCompleted
                    ? "bg-emerald-500 border-emerald-500 text-white"
                    : "bg-slate-900 border-indigo-500 text-indigo-400"
                }`}>
                  {currentStepCompleted ? (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2.5 6L5 8.5L9.5 3.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ) : (
                    currentStepIndex + 1
                  )}
                </div>
                <div className="flex-1">
                  <h4 className={`text-sm font-bold mb-1 ${currentStepCompleted ? "text-emerald-300" : "text-white"}`}>
                    {currentStep.action}
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {currentStep.description}
                  </p>
                </div>
              </div>
            </div>

            {/* Warning Card */}
            {currentStep.warning && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 flex gap-2">
                <AlertTriangle size={14} className="text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-[10px] text-amber-500 uppercase tracking-wider font-bold mb-0.5">Warning</div>
                  <p className="text-[11px] text-amber-200 leading-relaxed">{currentStep.warning}</p>
                </div>
              </div>
            )}

            {/* Tip Card */}
            {currentStep.tip && (
              <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-3 flex gap-2">
                <Lightbulb size={14} className="text-indigo-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-[10px] text-indigo-400 uppercase tracking-wider font-bold mb-0.5">Pro Tip</div>
                  <p className="text-[11px] text-indigo-200 leading-relaxed">{currentStep.tip}</p>
                </div>
              </div>
            )}

            {/* All Steps Mini List */}
            <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
              <div className="px-3 py-2 border-b border-slate-700/50">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">All Steps</span>
              </div>
              {workflow.steps.map((step, i) => (
                <div
                  key={step.id}
                  className={`flex items-center gap-2.5 px-3 py-2 border-b border-slate-700/30 last:border-0 ${
                    i === currentStepIndex ? "bg-indigo-600/10" : ""
                  }`}
                >
                  <div className={`flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${
                    completedSteps.includes(step.id)
                      ? "bg-emerald-500 text-white"
                      : i === currentStepIndex
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-700 text-slate-500"
                  }`}>
                    {completedSteps.includes(step.id) ? "✓" : i + 1}
                  </div>
                  <span className={`text-[11px] truncate ${
                    completedSteps.includes(step.id)
                      ? "text-emerald-400 line-through"
                      : i === currentStepIndex
                      ? "text-indigo-300 font-semibold"
                      : "text-slate-500"
                  }`}>
                    {step.action}
                  </span>
                </div>
              ))}
            </div>
          </>
        ) : null}
      </div>

      {/* Action Buttons */}
      {!isComplete && currentStep && (
        <div className="p-4 border-t border-slate-800 flex-shrink-0 space-y-2">
          {!currentStepCompleted ? (
            <button
              onClick={onCompleteStep}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-xl transition-all duration-150 flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/40"
            >
              <CheckCircle2 size={16} />
              Mark Step Complete
            </button>
          ) : (
            <button
              onClick={isLastStep ? undefined : onNextStep}
              disabled={isLastStep}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl transition-all duration-150 flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/40 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLastStep ? "All Steps Completed" : "Next Step"}
              {!isLastStep && <ArrowRight size={16} />}
            </button>
          )}
          {currentStepIndex > 0 && (
            <button
              onClick={onPrevStep}
              className="w-full py-2 bg-transparent border border-slate-700 hover:border-slate-500 text-slate-400 hover:text-slate-200 text-xs font-semibold rounded-xl transition-all duration-150"
            >
              ← Previous Step
            </button>
          )}
        </div>
      )}
    </div>
  );
}
