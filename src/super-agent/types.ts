export interface SAMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  model?: string;
  promptVariants?: PromptVariant[];
}

export interface SAConversation {
  id: string;
  title: string;
  messages: SAMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface SAConversationSummary {
  id: string;
  title: string;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
  preview: string;
}

export interface KBEntry {
  id: string;
  title: string;
  content: string;
  tags: string[];
  source: "manual" | "cursor-chat" | "import" | "auto";
  createdAt: string;
  updatedAt: string;
  score?: number;
}

export interface PromptVariant {
  promptText: string;
  model: string;
  modelLabel: string;
  rationale: string;
  useCase: string;
  estimatedCost: "free" | "low" | "medium" | "high";
  complexity: "fast" | "balanced" | "thorough";
}

export interface OptimizeResult {
  taskType: string;
  variants: PromptVariant[];
}

export interface SAStatus {
  geminiConfigured: boolean;
  authConfigured: boolean;
  authenticated: boolean;
  ollama: {
    available: boolean;
    models: string[];
  };
  kbSize: number;
  conversationCount: number;
}

export type ActiveView = "chat" | "kb" | "settings";
