export type RoleType = "Leasing" | "Maintenance" | "Manager" | "All";

export type WorkflowCategory =
  | "Leasing"
  | "Move-In/Move-Out"
  | "Maintenance"
  | "Financial"
  | "Reports"
  | "Resident Services";

export type StepStatus = "pending" | "active" | "completed" | "error";
export type AppMode = "learning" | "quick-reference";
export type ViewMode = "workflow" | "reference" | "glossary" | "search";

export interface WorkflowStep {
  id: string;
  stepNumber: number;
  action: string;
  description: string;
  breadcrumb: string[];
  tip?: string;
  warning?: string;
  screenshot?: string;
}

export interface EntrataWorkflow {
  id: string;
  taskName: string;
  shortName: string;
  systemPath: string[];
  role: RoleType[];
  category: WorkflowCategory;
  description: string;
  estimatedTime: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  steps: WorkflowStep[];
  tags: string[];
  relatedWorkflows?: string[];
}

export interface WorkflowProgress {
  workflowId: string;
  currentStep: number;
  completedSteps: string[];
  startedAt: string;
  completedAt?: string;
}

export interface UserProgress {
  workflows: Record<string, WorkflowProgress>;
  totalCompleted: number;
}

export interface QuickReferenceItem {
  id: string;
  title: string;
  path: string[];
  shortcut?: string;
  notes?: string;
  role: RoleType[];
}

export interface GlossaryTerm {
  id: string;
  term: string;
  definition: string;
  relatedTerms?: string[];
}

export interface SimulationState {
  activeWorkflowId: string | null;
  currentStepIndex: number;
  stepStatuses: Record<string, StepStatus>;
  isComplete: boolean;
  errors: Record<string, string>;
}
