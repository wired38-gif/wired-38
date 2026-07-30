import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Search, BookOpen, Menu, X, ChevronDown, ToggleLeft, ToggleRight,
  Home, Wrench, DollarSign, BarChart2, Users, Star, Bell, HelpCircle
} from "lucide-react";

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

const STORAGE_KEY = "entrata_training_progress";

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
        <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
          <BookOpen size={14} className="text-white" />
        </div>
        <span className="text-sm font-bold text-white truncate">Entrata Training</span>
        <span className={`text-[10px] font-semibold ${roleColor} truncate`}>
          · {selectedRole === "All" ? "All Roles" : selectedRole}
        </span>
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
}

function DesktopHeader({ onSearchOpen, mode, onModeToggle, selectedRole }: DesktopHeaderProps) {
  const role = ROLES.find(r => r.value === selectedRole);

  return (
    <header className="flex-shrink-0 h-14 bg-slate-950 border-b border-slate-800 flex items-center px-4 gap-4 z-20">
      {/* Logo */}
      <div className="flex items-center gap-2.5 w-64 flex-shrink-0">
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
          <BookOpen size={15} className="text-white" />
        </div>
        <div>
          <div className="text-[13px] font-extrabold text-white leading-tight">Entrata Training Hub</div>
          <div className="text-[10px] text-slate-500 leading-tight">Property Management Operations</div>
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

  // Persistent state
  const [progress, setProgress] = useState<Record<string, WorkflowProgress>>(loadProgress);

  // UI state
  const [selectedRole, setSelectedRole] = useState<RoleType>("All");
  const [activeWorkflowId, setActiveWorkflowId] = useState<string | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [mode, setMode] = useState<AppMode>("learning");
  const [currentView, setCurrentView] = useState<"workflow" | "reference" | "glossary" | "videos">("workflow");
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

  // Persist progress to localStorage
  useEffect(() => {
    saveProgress(progress);
  }, [progress]);

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

  function handleViewChange(view: "workflow" | "reference" | "glossary" | "videos") {
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
        {currentView === "videos" ? (
          <div className="pb-6 h-[calc(100vh-57px)] overflow-y-auto">
            <VideoPanel selectedRole={selectedRole} />
          </div>
        ) : currentView === "workflow" && activeWorkflow ? (
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
        ) : (currentView === "reference" || currentView === "glossary") ? (
          <div className="pb-6">
            <QuickReference view={currentView as "reference" | "glossary"} selectedRole={selectedRole} />
          </div>
        ) : (
          /* No workflow selected — landing */
          <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
            <div className="w-20 h-20 bg-slate-800 rounded-3xl flex items-center justify-center mb-6 border border-slate-700">
              <BookOpen size={36} className="text-slate-500" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Choose a Workflow</h2>
            <p className="text-sm text-slate-500 mb-6 max-w-xs leading-relaxed">
              Tap the menu to browse and select a training workflow to get started.
            </p>
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="flex items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-900/30"
            >
              <Menu size={16} />
              Open Training Menu
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
          {currentView === "videos" ? (
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
    </div>
  );
}
