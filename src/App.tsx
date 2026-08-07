import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Search, Menu, X, ChevronDown, ToggleLeft, ToggleRight,
  Home, Wrench, DollarSign, BarChart2, Users, Star, Bell, HelpCircle,
  ChevronRight, ChevronUp, CheckCircle2, AlertTriangle, Lightbulb, BookOpen
} from "lucide-react";
import { ClearWorthLogo, EntrataLogo } from "./components/Logos";

import { ENTRATA_WORKFLOWS, ROLES } from "./data/workflows";
import { EntrataWorkflow, RoleType, WorkflowProgress, AppMode } from "./entrataTypes";
import { Sidebar } from "./components/entrata/Sidebar";
import { WorkflowSimulator } from "./components/entrata/WorkflowSimulator";
import { CoachPanel } from "./components/entrata/CoachPanel";
import { SearchOverlay } from "./components/entrata/SearchOverlay";
import { QuickReference } from "./components/entrata/QuickReference";
import { MobileView } from "./components/entrata/MobileView";
import { MockEntrataUI } from "./components/entrata/simulation/MockEntrataUI";
import { VideoPanel } from "./components/entrata/VideoPanel";
import { ChatAssistant } from "./components/entrata/ChatAssistant";
import { AccountSetup, AccountData } from "./components/entrata/AccountSetup";
import { Certificate } from "./components/entrata/Certificate";
import { QueenChatAgent } from "./components/QueenChatAgent";
import { OAuthSetup } from "./components/entrata/OAuthSetup";

const STORAGE_KEY = "entrata_training_progress";
const ACCOUNT_KEY = "entrata_account";

function loadProgress(): Record<string, WorkflowProgress> {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
}

function saveProgress(progress: Record<string, WorkflowProgress>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // ignore storage errors
  }
}

async function syncProgressToServer(email: string, pin: string, progress: Record<string, WorkflowProgress>) {
  try {
    const completedWorkflows = Object.entries(progress)
      .filter(([, p]) => p.completedAt)
      .map(([id]) => id);
    await fetch("/api/account/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, pin, progress, completedWorkflows }),
    });
  } catch {
    // best-effort sync
  }
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 1024);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return isMobile;
}

// ─────────────────────────────────────────
//  MOBILE SIMULATION VIEW
//  Full-screen MockEntrataUI + sticky coach bar at bottom
// ─────────────────────────────────────────
interface MobileSimulationViewProps {
  workflow: EntrataWorkflow;
  currentStepIndex: number;
  completedSteps: string[];
  onCompleteStep: () => void;
  onReset: () => void;
}

function MobileSimulationView({
  workflow,
  currentStepIndex,
  completedSteps,
  onCompleteStep,
  onReset,
}: MobileSimulationViewProps) {
  const [showDetail, setShowDetail] = useState(false);
  const step = workflow.steps[currentStepIndex];
  const isComplete = completedSteps.length === workflow.steps.length;
  const pct = Math.round((completedSteps.length / workflow.steps.length) * 100);

  const coachBarRef = React.useRef<HTMLDivElement>(null);

  return (
    <div className="flex flex-col bg-white" style={{ height: "calc(100dvh - 57px)" }}>
      {/* Compact workflow strip */}
      <div className="flex-shrink-0 bg-[#003087] px-3 py-2 flex items-center gap-3">
        <span className="text-white text-xs font-bold truncate flex-1 min-w-0">{workflow.shortName}</span>
        <span className="text-white/50 text-[10px] flex-shrink-0">
          {currentStepIndex + 1}/{workflow.steps.length}
        </span>
        <div className="w-16 bg-white/20 rounded-full h-1 flex-shrink-0">
          <div className="bg-emerald-400 h-1 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
        <button onClick={onReset} className="text-white/50 hover:text-white text-[10px] font-semibold flex-shrink-0">Reset</button>
      </div>

      {/* Simulation — grows to fill space between header strip and coach bar */}
      <div className="flex-1 overflow-hidden relative min-h-0">
        {isComplete ? (
          <div className="h-full flex flex-col items-center justify-center bg-slate-900 text-center p-6">
            <CheckCircle2 size={48} className="text-emerald-400 mb-3" />
            <h2 className="text-xl font-black text-emerald-400 mb-2">Complete!</h2>
            <p className="text-sm text-slate-400 mb-5">All {workflow.steps.length} steps done — {workflow.taskName}</p>
            <button onClick={onReset} className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl text-sm">
              Restart
            </button>
          </div>
        ) : (
          <MockEntrataUI
            workflowId={workflow.id}
            stepId={step?.id ?? ""}
            onStepComplete={onCompleteStep}
          />
        )}
      </div>

      {/* Coach bar — fixed height collapsed, scrollable when expanded */}
      {!isComplete && step && (
        <div ref={coachBarRef} className="flex-shrink-0 bg-slate-900 border-t border-slate-700">
          {/* Collapsed hint row — always visible */}
          <button
            className="w-full px-4 py-2.5 flex items-center gap-3 active:bg-slate-800 transition-colors text-left"
            onClick={() => setShowDetail(!showDetail)}
          >
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#0066cc] flex items-center justify-center text-[11px] font-black text-white">
              {completedSteps.includes(step.id) ? "✓" : currentStepIndex + 1}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-white truncate">{step.action}</div>
              <div className="text-[10px] text-indigo-400">↑ Tap the highlighted element</div>
            </div>
            <ChevronUp size={14} className={`text-slate-500 flex-shrink-0 transition-transform duration-200 ${showDetail ? "" : "rotate-180"}`} />
          </button>

          {/* Expanded detail — scrollable, max height so it doesn't push sim offscreen */}
          {showDetail && (
            <div className="border-t border-slate-800 overflow-y-auto" style={{ maxHeight: "38vh" }}>
              <div className="px-4 py-3 space-y-2">
                <div className="flex flex-wrap items-center gap-1">
                  {step.breadcrumb.map((seg, i) => (
                    <React.Fragment key={i}>
                      <code className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold border ${
                        i === step.breadcrumb.length - 1
                          ? "bg-[#0066cc]/20 text-blue-300 border-blue-500/40"
                          : "bg-slate-800 text-slate-400 border-slate-700"
                      }`}>{seg}</code>
                      {i < step.breadcrumb.length - 1 && <ChevronRight size={9} className="text-slate-600" />}
                    </React.Fragment>
                  ))}
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{step.description}</p>
                {step.warning && (
                  <div className="flex gap-2 bg-amber-500/10 border border-amber-500/25 rounded-lg p-2">
                    <AlertTriangle size={12} className="text-amber-400 flex-shrink-0 mt-0.5" />
                    <p className="text-[11px] text-amber-200">{step.warning}</p>
                  </div>
                )}
                {step.tip && (
                  <div className="flex gap-2 bg-indigo-500/10 border border-indigo-500/25 rounded-lg p-2">
                    <Lightbulb size={12} className="text-indigo-400 flex-shrink-0 mt-0.5" />
                    <p className="text-[11px] text-indigo-200">{step.tip}</p>
                  </div>
                )}
                <button
                  onClick={() => { onCompleteStep(); setShowDetail(false); }}
                  className="w-full py-2.5 bg-emerald-600 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2"
                >
                  <CheckCircle2 size={15} /> Mark Complete
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────
//  MOBILE HEADER
// ─────────────────────────────────────────
interface MobileHeaderProps {
  onSearchOpen: () => void;
  onMenuOpen: () => void;
  mode: AppMode;
  onModeToggle: () => void;
  selectedRole: RoleType;
}

function MobileHeader({ onSearchOpen, onMenuOpen, mode, onModeToggle, selectedRole }: MobileHeaderProps) {
  const roleColor = ROLES.find(r => r.value === selectedRole)?.color ?? "text-slate-300";
  return (
    <header className="sticky top-0 z-30 bg-slate-950/95 backdrop-blur border-b border-slate-800 px-4 py-3 flex items-center gap-3">
      <button
        onClick={onMenuOpen}
        className="p-2 -ml-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
      >
        <Menu size={20} />
      </button>

      <div className="flex items-center gap-2 flex-1 min-w-0">
        <ClearWorthLogo variant="mark" className="w-8 h-6 flex-shrink-0" />
        <div className="flex items-center gap-1 min-w-0">
          <EntrataLogo size="sm" white />
          <span className="text-[9px] text-slate-500 font-semibold uppercase hidden sm:block">Training</span>
        </div>
      </div>

      {/* Mode Toggle */}
      <button
        onClick={onModeToggle}
        className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-800 border border-slate-700 transition-colors hover:border-slate-500"
      >
        {mode === "learning" ? (
          <ToggleRight size={14} className="text-indigo-400" />
        ) : (
          <ToggleLeft size={14} className="text-slate-500" />
        )}
        <span className="text-[10px] font-semibold text-slate-400">
          {mode === "learning" ? "Learning" : "Quick Ref"}
        </span>
      </button>

      <button
        onClick={onSearchOpen}
        className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
      >
        <Search size={18} />
      </button>
    </header>
  );
}

// ─────────────────────────────────────────
//  MOBILE DRAWER
// ─────────────────────────────────────────
interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

function MobileDrawer({ isOpen, onClose, children }: MobileDrawerProps) {
  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
      )}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 shadow-2xl transform transition-transform duration-300 ease-in-out ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <span className="text-sm font-bold text-white">Navigation</span>
          <button onClick={onClose} className="p-1.5 text-slate-500 hover:text-white rounded-lg hover:bg-slate-800">
            <X size={18} />
          </button>
        </div>
        <div className="h-[calc(100%-57px)] overflow-y-auto">
          {children}
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────
//  DESKTOP HEADER
// ─────────────────────────────────────────
interface DesktopHeaderProps {
  onSearchOpen: () => void;
  mode: AppMode;
  onModeToggle: () => void;
  selectedRole: RoleType;
  traineeName: string;
  onSignOut: () => void;
}

function DesktopHeader({ onSearchOpen, mode, onModeToggle, selectedRole, traineeName, onSignOut }: DesktopHeaderProps) {
  const role = ROLES.find(r => r.value === selectedRole);

  return (
    <header className="flex-shrink-0 h-14 bg-slate-950 border-b border-slate-800 flex items-center px-4 gap-4 z-20">
      {/* Logo — ClearWorth + Entrata */}
      <div className="flex items-center gap-3 w-64 flex-shrink-0">
        <ClearWorthLogo dark className="scale-90 origin-left" />
        <div className="h-5 w-px bg-slate-700" />
        <div className="flex items-center gap-1">
          <EntrataLogo size="sm" white />
          <span className="text-[9px] text-slate-500 font-semibold uppercase tracking-wider mt-0.5">Training</span>
        </div>
      </div>

      {/* Center: Search */}
      <div className="flex-1 max-w-lg mx-auto">
        <button
          onClick={onSearchOpen}
          className="w-full flex items-center gap-3 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-500 rounded-xl text-left transition-all group"
        >
          <Search size={14} className="text-slate-500 group-hover:text-slate-300 transition-colors" />
          <span className="text-sm text-slate-500 group-hover:text-slate-400 transition-colors flex-1">
            Search workflows, terms, paths…
          </span>
          <div className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-slate-700 border border-slate-600 rounded text-[10px] text-slate-500 font-mono">⌘</kbd>
            <kbd className="px-1.5 py-0.5 bg-slate-700 border border-slate-600 rounded text-[10px] text-slate-500 font-mono">K</kbd>
          </div>
        </button>
      </div>

        {/* Right: Mode Toggle + Role Badge */}
        <div className="flex items-center gap-3">
          {role && (
            <div className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs font-semibold ${role.bgColor} ${role.color}`}>
              {selectedRole === "Leasing" ? <Users size={12} /> :
               selectedRole === "Maintenance" ? <Wrench size={12} /> :
               selectedRole === "Manager" ? <BarChart2 size={12} /> : <Star size={12} />}
              {role.label}
            </div>
          )}
          {traineeName && (
            <div className="flex items-center gap-2 border-l border-slate-800 pl-3">
              <span className="text-[11px] text-slate-400 truncate max-w-24">{traineeName}</span>
              <button onClick={onSignOut} title="Sign out" className="text-[10px] text-slate-600 hover:text-slate-300 font-semibold transition-colors">
                Sign out
              </button>
            </div>
          )}

        <div className="flex items-center gap-2 border-l border-slate-800 pl-3">
          <span className="text-[11px] text-slate-500">
            {mode === "learning" ? "Learning Mode" : "Quick Reference"}
          </span>
          <button
            onClick={onModeToggle}
            className={`relative w-10 h-5 rounded-full border transition-colors duration-200 ${
              mode === "learning"
                ? "bg-indigo-600 border-indigo-500"
                : "bg-slate-700 border-slate-600"
            }`}
          >
            <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${
              mode === "learning" ? "translate-x-5" : "translate-x-0.5"
            }`} />
          </button>
        </div>

        <button
          onClick={onSearchOpen}
          className="p-2 text-slate-500 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          title="Search (⌘K)"
        >
          <Search size={16} />
        </button>
      </div>
    </header>
  );
}

// ─────────────────────────────────────────
//  MAIN APP
// ─────────────────────────────────────────
export default function App() {
  const isMobile = useIsMobile();

  // Account auth state
  const [account, setAccount] = useState<AccountData | null>(() => {
    try { const s = localStorage.getItem(ACCOUNT_KEY); return s ? JSON.parse(s) : null; } catch { return null; }
  });
  const traineeName = account?.name ?? "";
  const [showCertificate, setShowCertificate] = useState<EntrataWorkflow | null>(null);

  // Persistent state
  const [progress, setProgress] = useState<Record<string, WorkflowProgress>>(loadProgress);

  // UI state
  const [selectedRole, setSelectedRole] = useState<RoleType>("All");
  const [activeWorkflowId, setActiveWorkflowId] = useState<string | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [mode, setMode] = useState<AppMode>("learning");
  const [currentView, setCurrentView] = useState<"workflow" | "reference" | "glossary" | "videos" | "oauth">("workflow");
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Keyboard shortcut: ⌘K / Ctrl+K
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(prev => !prev);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Persist progress to localStorage + sync to server
  useEffect(() => {
    saveProgress(progress);
    if (account) syncProgressToServer(account.email, account.pin, progress);
  }, [progress, account]);

  function handleAccountSuccess(newAccount: AccountData) {
    localStorage.setItem(ACCOUNT_KEY, JSON.stringify(newAccount));
    setAccount(newAccount);
    if (Object.keys(newAccount.progress).length > 0) {
      const merged = { ...loadProgress(), ...(newAccount.progress as Record<string, WorkflowProgress>) };
      setProgress(merged);
      saveProgress(merged);
    }
  }

  function handleSignOut() {
    localStorage.removeItem(ACCOUNT_KEY);
    localStorage.removeItem(STORAGE_KEY);
    setAccount(null);
  }

  // Show account setup if not authenticated
  if (!account) {
    return <AccountSetup onSuccess={handleAccountSuccess} />;
  }

  const activeWorkflow: EntrataWorkflow | null = useMemo(
    () => ENTRATA_WORKFLOWS.find(w => w.id === activeWorkflowId) ?? null,
    [activeWorkflowId]
  );

  // Restore progress when switching workflows
  useEffect(() => {
    if (!activeWorkflowId) return;
    const saved = progress[activeWorkflowId];
    if (saved) {
      setCurrentStepIndex(saved.currentStep);
      setCompletedSteps(saved.completedSteps);
    } else {
      setCurrentStepIndex(0);
      setCompletedSteps([]);
    }
  }, [activeWorkflowId]);

  function handleWorkflowSelect(id: string) {
    setActiveWorkflowId(id);
    setCurrentView("workflow");
    setMobileMenuOpen(false);
    // Auto-initialize progress so simulation shows immediately
    if (!progress[id]) {
      setCurrentStepIndex(0);
      setCompletedSteps([]);
    }
  }

  function handleChatNavigate(workflowId: string) {
    handleWorkflowSelect(workflowId);
  }

  function handleViewChange(view: "workflow" | "reference" | "glossary" | "videos" | "oauth") {
    setCurrentView(view);
    if (view !== "workflow") setActiveWorkflowId(null);
  }

  function handleStart() {
    if (!activeWorkflowId) return;
    setCurrentStepIndex(0);
    setCompletedSteps([]);
    updateProgress(activeWorkflowId, 0, []);
  }

  function handleReset() {
    if (!activeWorkflowId) return;
    setCurrentStepIndex(0);
    setCompletedSteps([]);
    setProgress(prev => {
      const next = { ...prev };
      delete next[activeWorkflowId];
      return next;
    });
  }

  function updateProgress(workflowId: string, stepIndex: number, done: string[]) {
    const workflow = ENTRATA_WORKFLOWS.find(w => w.id === workflowId);
    if (!workflow) return;

    const isComplete = done.length === workflow.steps.length;
    setProgress(prev => ({
      ...prev,
      [workflowId]: {
        workflowId,
        currentStep: stepIndex,
        completedSteps: done,
        startedAt: prev[workflowId]?.startedAt ?? new Date().toISOString(),
        ...(isComplete ? { completedAt: new Date().toISOString() } : {}),
      },
    }));
  }

  function handleCompleteStep() {
    if (!activeWorkflow) return;
    const step = activeWorkflow.steps[currentStepIndex];
    if (!step || completedSteps.includes(step.id)) return;

    const newCompleted = [...completedSteps, step.id];
    setCompletedSteps(newCompleted);

    const nextIndex = Math.min(currentStepIndex + 1, activeWorkflow.steps.length - 1);
    if (newCompleted.length < activeWorkflow.steps.length) {
      setCurrentStepIndex(nextIndex);
    }
    updateProgress(activeWorkflowId!, nextIndex, newCompleted);

    // Trigger certificate when all steps done
    if (newCompleted.length === activeWorkflow.steps.length) {
      setTimeout(() => setShowCertificate(activeWorkflow), 600);
    }
  }

  function handleNextStep() {
    if (!activeWorkflow) return;
    const next = Math.min(currentStepIndex + 1, activeWorkflow.steps.length - 1);
    setCurrentStepIndex(next);
    updateProgress(activeWorkflowId!, next, completedSteps);
  }

  function handlePrevStep() {
    const prev = Math.max(currentStepIndex - 1, 0);
    setCurrentStepIndex(prev);
    updateProgress(activeWorkflowId!, prev, completedSteps);
  }

  function handleStepClick(index: number) {
    setCurrentStepIndex(index);
    updateProgress(activeWorkflowId!, index, completedSteps);
  }

  function handleModeToggle() {
    setMode(m => m === "learning" ? "quick-reference" : "learning");
  }

  // ─────────────────────────────────────────
  //  MOBILE LAYOUT
  // ─────────────────────────────────────────
  if (isMobile) {
    return (
      <div className="min-h-screen bg-slate-950 text-white">
        <MobileHeader
          onSearchOpen={() => setSearchOpen(true)}
          onMenuOpen={() => setMobileMenuOpen(true)}
          mode={mode}
          onModeToggle={handleModeToggle}
          selectedRole={selectedRole}
        />

        {/* Mobile Drawer */}
        <MobileDrawer isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)}>
          <Sidebar
            workflows={ENTRATA_WORKFLOWS}
            activeWorkflowId={activeWorkflowId}
            selectedRole={selectedRole}
            onRoleChange={setSelectedRole}
            onWorkflowSelect={handleWorkflowSelect}
            onViewChange={handleViewChange}
            currentView={currentView}
            progress={progress}
          />
        </MobileDrawer>

        {/* Mobile Content */}
        {currentView === "oauth" ? (
          <div className="overflow-y-auto h-[calc(100vh-57px)]">
            <OAuthSetup />
          </div>
        ) : currentView === "reference" || currentView === "glossary" ? (
          <div className="pb-6 overflow-y-auto h-[calc(100vh-57px)]">
            <QuickReference view={currentView as "reference" | "glossary"} selectedRole={selectedRole} />
          </div>
        ) : currentView === "workflow" && activeWorkflow ? (
          mode === "learning" && completedSteps.length < activeWorkflow.steps.length ? (
            /* ── MOBILE SIMULATION MODE ─────────────────── */
            <MobileSimulationView
              workflow={activeWorkflow}
              currentStepIndex={currentStepIndex}
              completedSteps={completedSteps}
              onCompleteStep={handleCompleteStep}
              onReset={handleReset}
            />
          ) : (
            /* Quick Ref mode or completed workflow */
            <MobileView
              workflow={activeWorkflow}
              currentStepIndex={currentStepIndex}
              completedSteps={completedSteps}
              onCompleteStep={handleCompleteStep}
              onNextStep={handleNextStep}
              onPrevStep={handlePrevStep}
              onReset={handleReset}
              onStart={handleStart}
            />
          )
        ) : (
          /* No workflow selected — landing */
          <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-indigo-600/30 to-violet-600/20 rounded-3xl flex items-center justify-center mb-5 border border-indigo-500/30">
              <BookOpen size={36} className="text-indigo-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Entrata Training</h2>
            <p className="text-sm text-slate-400 mb-4 max-w-xs leading-relaxed">
              Pick a workflow to launch the interactive Entrata simulation. Tap the highlighted element each step.
            </p>
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="flex items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-900/30"
            >
              <Menu size={16} />
              Browse Workflows
            </button>
          </div>
        )}

        {/* Search */}
        {searchOpen && (
          <SearchOverlay
            workflows={ENTRATA_WORKFLOWS}
            onSelect={handleWorkflowSelect}
            onClose={() => setSearchOpen(false)}
          />
        )}

        {/* AI Chat Assistant */}
        <ChatAssistant onNavigate={handleChatNavigate} />

        {/* Queen Chat Agent */}
        <QueenChatAgent />

        {/* Certificate Modal */}
        {showCertificate && (
          <Certificate
            workflow={showCertificate}
            traineeName={traineeName}
            completedAt={new Date().toISOString()}
            onClose={() => setShowCertificate(null)}
          />
        )}
      </div>
    );
  }

  // ─────────────────────────────────────────
  //  DESKTOP LAYOUT — 3-Column Cockpit
  // ─────────────────────────────────────────
  return (
    <div className="h-screen flex flex-col bg-slate-950 text-white overflow-hidden">
      <DesktopHeader
        onSearchOpen={() => setSearchOpen(true)}
        mode={mode}
        onModeToggle={handleModeToggle}
        selectedRole={selectedRole}
        traineeName={traineeName}
        onSignOut={handleSignOut}
      />

      {/* 3-Column Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT: Sidebar (20%) */}
        <div className="w-64 flex-shrink-0 overflow-hidden">
          <Sidebar
            workflows={ENTRATA_WORKFLOWS}
            activeWorkflowId={activeWorkflowId}
            selectedRole={selectedRole}
            onRoleChange={setSelectedRole}
            onWorkflowSelect={handleWorkflowSelect}
            onViewChange={handleViewChange}
            currentView={currentView}
            progress={progress}
          />
        </div>

        {/* CENTER: Simulation Workspace (50%) */}
        <div className="flex-1 overflow-hidden border-x border-slate-800">
          {currentView === "oauth" ? (
            <OAuthSetup />
          ) : currentView === "videos" ? (
            <VideoPanel selectedRole={selectedRole} />
          ) : currentView === "workflow" ? (
            mode === "learning" && activeWorkflow ? (
              completedSteps.length < activeWorkflow.steps.length ? (
                <MockEntrataUI
                  workflowId={activeWorkflow.id}
                  stepId={activeWorkflow.steps[currentStepIndex]?.id ?? ""}
                  onStepComplete={handleCompleteStep}
                />
              ) : (
                /* All steps done — show completion screen */
                <WorkflowSimulator
                  workflow={activeWorkflow}
                  currentStepIndex={currentStepIndex}
                  completedSteps={completedSteps}
                  onStepClick={handleStepClick}
                  onStart={handleStart}
                  onReset={handleReset}
                  mode={mode}
                />
              )
            ) : (
              <WorkflowSimulator
                workflow={activeWorkflow}
                currentStepIndex={currentStepIndex}
                completedSteps={completedSteps}
                onStepClick={handleStepClick}
                onStart={handleStart}
                onReset={handleReset}
                mode={mode}
              />
            )
          ) : (
            <QuickReference
              view={currentView as "reference" | "glossary"}
              selectedRole={selectedRole}
            />
          )}
        </div>

        {/* RIGHT: Coach Panel (30%) */}
        <div className="w-80 flex-shrink-0 overflow-hidden">
          <CoachPanel
            workflow={currentView === "workflow" ? activeWorkflow : null}
            currentStepIndex={currentStepIndex}
            completedSteps={completedSteps}
            onNextStep={handleNextStep}
            onPrevStep={handlePrevStep}
            onCompleteStep={handleCompleteStep}
            isSimulationMode={mode === "learning" && activeWorkflow !== null}
          />
        </div>
      </div>

      {/* Search Overlay */}
      {searchOpen && (
        <SearchOverlay
          workflows={ENTRATA_WORKFLOWS}
          onSelect={handleWorkflowSelect}
          onClose={() => setSearchOpen(false)}
        />
      )}

      {/* AI Chat Assistant */}
      <ChatAssistant onNavigate={handleChatNavigate} />

      {/* Queen Chat Agent */}
      <QueenChatAgent />

      {/* Certificate Modal */}
      {showCertificate && (
        <Certificate
          workflow={showCertificate}
          traineeName={traineeName}
          completedAt={new Date().toISOString()}
          onClose={() => setShowCertificate(null)}
        />
      )}
    </div>
  );
}
