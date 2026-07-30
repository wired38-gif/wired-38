export type RoleType = "Leasing" | "Maintenance" | "Manager" | "All";

// Entrata Platform
export type Platform = "OXP" | "RXP";

// OXP Suites (Operations Experience Platform)
export type OXPSuite =
  | "CRM & Leasing"       // Prospect to lease
  | "Property Management" // Daily ops, occupancy, move-in/out
  | "Financial"           // Ledger, charges, payments, accounting
  | "Maintenance"         // Work orders, inspections, make-ready
  | "Reporting";          // Reports, analytics, BI

// RXP Suites (Resident Experience Platform)
export type RXPSuite =
  | "Resident Portal"     // Portal access, online payments
  | "Communications"      // Messaging, announcements
  | "Resident Services";  // Rewards, insurance, packages

export type WorkflowSuite = OXPSuite | RXPSuite;

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
  platform?: Platform;
  suite?: WorkflowSuite;
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
