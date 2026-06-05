export type DomainType = "Web Design" | "Node.js" | "Git" | "Marketing" | "Music" | "General Build";

export interface CostOption {
  tier: number;
  name: string;
  costEstimate: number; // Token estimate number
  focus: string;
  explanation: string;
}

export interface AnalysisResponse {
  analysis: string;
  options: CostOption[];
}

export interface RefinementResponse {
  title: string;
  content: string; // Markdown text output
  estimatedTokens: number;
  milestones: string[];
  keyRecommendations: string[];
}

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface SavedPlan {
  id: string;
  prompt: string;
  domain: string;
  createdAt: string;
  analysis: string;
  selectedTier: number;
  refinementResult: RefinementResponse;
  checklist: ChecklistItem[];
  userNotes?: string;
}
