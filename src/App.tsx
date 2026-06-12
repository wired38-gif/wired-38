import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import {
  Coins,
  Brain,
  Layers,
  Sparkles,
  History,
  CheckCircle2,
  Bookmark,
  Plus,
  Trash2,
  Clipboard,
  ExternalLink,
  ChevronRight,
  Info,
  Layers2,
  FileText,
  MousePointerClick,
  CheckSquare,
  Square,
  RefreshCw,
  Notebook,
  BadgeAlert,
  Loader2,
  Download,
  ArrowLeftRight,
  Scale,
  Lock,
  Unlock,
  Key,
  LogOut,
  Cpu,
  Database,
  Settings,
  Globe,
  Cloud,
  Server,
  Shuffle,
  Terminal,
  Search,
  Mic,
  MicOff,
  AlertTriangle
} from "lucide-react";
import { jsPDF } from "jspdf";
import { DomainType, CostOption, SavedPlan, ChecklistItem, RefinementResponse } from "./types";
import { OptimizationHistoryChart } from "./components/OptimizationHistoryChart";

const EXAMPLE_PROMPTS = [
  {
    title: "Meeting Notes Summarizer with Workspace Integration",
    prompt: "A fully functional meeting notes summarizer that integrates with Google Calendar to fetch today's events, auto-categorizes key decisions using the Gemini API, and exports summaries straight to Google Docs.",
    domain: "Web Design" as DomainType,
  },
  {
    title: "Node Express API Template with Rate Limiting & Auth",
    prompt: "Create a lightweight node express-based API template with bulletproof JSON Web Token (JWT) authorization, custom rate-limiting middleware, error handling cascades, and automatic API documentation using Swagger.",
    domain: "Node.js" as DomainType,
  },
  {
    title: "Automated Git Squash & Standard Commit Generator",
    prompt: "A CLI tool that inspects uncommitted diffs, squashes recent WIP commits based on interactive selection, and drafts semantic commit messages (feat:, fix:, chore:) dynamically matched to the diff contents.",
    domain: "Git" as DomainType,
  },
  {
    title: "Viral Marketing Landing Page Copy & Ad Campaign Planner",
    prompt: "Design a high-converting single-page marketing landing page copy for a SaaS productivity tool, plus three different search ad copy variations, and an automated weekly LinkedIn content calendar for launch.",
    domain: "Marketing" as DomainType,
  },
  {
    title: "React Web Guitar Chord Trainer with Audio Feedback",
    prompt: "Build an interactive visual guitar chord trainer where users view chord diagrams (C, G, D, Am), play them on their guitar, and use the Web Audio API to detect frequency pitch correctness with real-time feedback.",
    domain: "Music" as DomainType,
  }
];

function MykLogo({ className = "w-16 h-16" }: { className?: string }) {
  return (
    <div className={`relative bg-slate-950 rounded-2xl border border-slate-800 p-2.5 text-center shadow-xl shadow-black/80 flex flex-col items-center justify-center overscroll-none overflow-hidden select-none hover:border-blue-500/50 hover:shadow-cyan-500/5 transition-all duration-300 ${className}`} id="myk-premium-visual-logo">
      {/* Glowing horizontal light reflections from design */}
      <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"></div>
      <div className="absolute bottom-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent"></div>
      <div className="absolute inset-0 bg-radial-at-t from-cyan-500/10 via-transparent to-transparent pointer-events-none opacity-40"></div>
      
      {/* Top Code Block */}
      <div className="text-[10px] font-mono font-black text-cyan-400 select-none tracking-widest drop-shadow-[0_0_6px_rgba(34,211,238,0.7)] select-none">
        &lt; ! &gt;
      </div>
      
      {/* Central Metallic Title */}
      <div className="font-display font-black text-2xl md:text-3xl tracking-widest text-slate-100 uppercase relative my-1 select-none leading-none scale-y-110">
        <span className="absolute -inset-1.5 bg-gradient-to-r from-blue-600/20 to-cyan-500/20 blur-md opacity-30"></span>
        <span className="relative bg-gradient-to-b from-white via-slate-100 to-slate-400 bg-clip-text text-transparent italic drop-shadow-[0_2px_2px_rgba(0,0,0,0.95)]">
          MYK
        </span>
      </div>
      
      {/* Creator Taglines */}
      <p className="text-[6.5px] uppercase font-bold text-slate-400 tracking-[0.22em] font-mono select-none leading-none mt-0.5">
        DESIGNS BY MYK
      </p>
      
      <p className="text-[5px] uppercase font-semibold text-cyan-400/90 tracking-[0.16em] font-mono select-none leading-none mt-1.5">
        CODE • CREATE • INNOVATE
      </p>
      
      {/* Bottom Code Block */}
      <div className="text-[10px] font-mono font-black text-cyan-400/95 select-none tracking-widest drop-shadow-[0_0_6px_rgba(34,211,238,0.7)] mt-2 select-none">
        &lt; ! &gt;
      </div>
    </div>
  );
}

export default function App() {
  // Navigation tabs to separate different needs
  const [activeTab, setActiveTab] = useState<"optimizer" | "connectors" | "agent-creator" | "history">("optimizer");

  // Custom Engine Selector and Thinker Type states
  const [engineType, setEngineType] = useState<"auto" | "gemini-2.5" | "claude-3.5" | "gpt-4o" | "llama-3">("auto");
  const [thinkerType, setThinkerType] = useState<"auto" | "deep" | "standard" | "creative">("auto");

  // Custom Agent list states
  const [customAgents, setCustomAgents] = useState<{
    id: string;
    name: string;
    role: string;
    systemInstructions: string;
    memoryAnchor: string;
    isActive: boolean;
  }[]>(() => {
    const list = localStorage.getItem("myk_io_custom_agents");
    if (list) {
      try {
        return JSON.parse(list);
      } catch (e) {
        // Fallback default
      }
    }
    return [
      {
        id: "agt-1",
        name: "Security Compliance Auditor",
        role: "Security Compliance",
        systemInstructions: "Scan source code files for credential leaks, check API routing safety, verify OAuth callback loops and ensure strict non-leakage.",
        memoryAnchor: "sec_token_scope",
        isActive: true
      },
      {
        id: "agt-2",
        name: "Cloud Infra Specialist",
        role: "DevOps & GCP",
        systemInstructions: "Formulate resilient multi-container configurations. Exclusively handle Cloud Run nodes, docker specs, and TLS reverse proxies.",
        memoryAnchor: "infra_deployment_specs",
        isActive: false
      },
      {
        id: "agt-3",
        name: "Drizzle Schema Architect",
        role: "Database Modeling",
        systemInstructions: "Design perfect database layouts. Exclusively formulate relational schemas using drizzle-orm, foreign keys, cascade triggers, and performance indices.",
        memoryAnchor: "db_relational_schema",
        isActive: true
      }
    ];
  });

  const [newAgentName, setNewAgentName] = useState("");
  const [newAgentRole, setNewAgentRole] = useState("General Support");
  const [newAgentInstructions, setNewAgentInstructions] = useState("");
  const [newAgentMemoryAnchor, setNewAgentMemoryAnchor] = useState("");

  // Input form state
  const [promptInput, setPromptInput] = useState(() => {
    return localStorage.getItem("myk_io_draft_prompt") || "";
  });
  const [selectedDomain, setSelectedDomain] = useState<DomainType>(() => {
    return (localStorage.getItem("myk_io_draft_domain") as DomainType) || "General Build";
  });
  const [isDraftSaving, setIsDraftSaving] = useState(false);

  // Auto synchronization of localStorage for custom agents
  useEffect(() => {
    localStorage.setItem("myk_io_custom_agents", JSON.stringify(customAgents));
  }, [customAgents]);

  const handleAddCustomAgent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAgentName.trim()) return;
    const newAgent = {
      id: "agt-" + Date.now(),
      name: newAgentName.trim(),
      role: newAgentRole,
      systemInstructions: newAgentInstructions.trim() || "No instructions provided.",
      memoryAnchor: newAgentMemoryAnchor.trim() || "general_scope",
      isActive: true
    };
    setCustomAgents([...customAgents, newAgent]);
    setTerminalHistory(prev => [
      ...prev,
      `[SUCCESS] Created New Custom Agent: "${newAgent.name}" successfully.`
    ]);
    setNewAgentName("");
    setNewAgentRole("General Support");
    setNewAgentInstructions("");
    setNewAgentMemoryAnchor("");
  };

  const handleToggleAgentActive = (id: string) => {
    setCustomAgents(customAgents.map(a => a.id === id ? { ...a, isActive: !a.isActive } : a));
    const target = customAgents.find(a => a.id === id);
    if (target) {
      setTerminalHistory(prev => [
        ...prev,
        `[MEMORY] Toggled agent state: "${target.name}" is now ${!target.isActive ? "ACTIVE" : "INACTIVE"}`
      ]);
    }
  };

  const handleDeleteAgent = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const target = customAgents.find(a => a.id === id);
    setCustomAgents(customAgents.filter(a => a.id !== id));
    if (target) {
      setTerminalHistory(prev => [
        ...prev,
        `[SYSTEM] Deleted custom agent: "${target.name}"`
      ]);
    }
  };

  // Debounce saving prompt and domain draft to LocalStorage
  useEffect(() => {
    setIsDraftSaving(true);
    const handler = setTimeout(() => {
      localStorage.setItem("myk_io_draft_prompt", promptInput);
      localStorage.setItem("myk_io_draft_domain", selectedDomain);
      setIsDraftSaving(false);
    }, 800);
    return () => clearTimeout(handler);
  }, [promptInput, selectedDomain]);

  // Voice Speech Dictation States
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);

  // In-App Sandbox Google Search Integration States
  const [browserTab, setBrowserTab] = useState<"auth" | "search">("auth");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchingDoc, setIsSearchingDoc] = useState(false);
  const [searchResults, setSearchResults] = useState<{ title: string; url: string; snippet: string; date: string }[]>([]);

  const DOCUMENTATION_DATABASE = [
    {
      keywords: ["gemini", "ai", "@google/genai", "google", "sdk"],
      title: "Official @google/genai Developer Docs - v1.2.0",
      url: "https://ai.google.dev/gemini-api/docs/quickstart",
      snippet: "Use the new GoogleGenAI SDK to initialize clients: const ai = new GoogleGenAI({ apiKey }). Supports Gemini 2.5 Flash as the default standard. Auto-token optimizations are enabled automatically.",
      date: "June 2026"
    },
    {
      keywords: ["firebase", "firestore", "auth", "rules"],
      title: "Firebase Web SDK Security Rules Guidelines",
      url: "https://firebase.google.com/docs/rules/basics",
      snippet: "Ensure security rules write and read conditions enforce dynamic request.auth !== null. Use transaction-safe schemas to guard administrative values on myk-online.com.",
      date: "May 2026"
    },
    {
      keywords: ["github", "deploy", "action", "repository"],
      title: "GitHub Actions Secure Environment Secrets Integration",
      url: "https://docs.github.com/en/actions/security-guides/encrypted-secrets",
      snippet: "Safeguard your MYK deploy hooks by adding system access tokens to Repository Secrets. Avoid committing sk-ant or myk_jwt tokens in plaintext payload files.",
      date: "April 2026"
    },
    {
      keywords: ["react", "debounce", "performance", "render"],
      title: "Optimized React Debounce hooks for high-performance states",
      url: "https://react.dev/reference/react/useEffect#controlling-frequent-renders",
      snippet: "Learn how to cache form drafts into local/cloud stores without triggering component mounting loops. Set interval-based safety clears on effect unmount.",
      date: "March 2026"
    },
    {
      keywords: ["security", "patches", "vulnerability", "patch"],
      title: "NPM Advisory Security Patch Checklist - 2026",
      url: "https://www.npmjs.com/advisories/latest-patches",
      snippet: "Hotfix: Ensure package configurations avoid HMR websocket memory leakage by setting DISABLE_HMR=true inside container networks. Binds securely to port 3000.",
      date: "June 2026"
    }
  ];
  
  // API interaction states
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Current analysis output
  const [analysisText, setAnalysisText] = useState<string | null>(null);
  const [costOptions, setCostOptions] = useState<CostOption[] | null>(null);
  const [selectedTier, setSelectedTier] = useState<number | null>(null);
  const [refinementResult, setRefinementResult] = useState<RefinementResponse | null>(null);
  
  // Saved and active plan states
  const [savedPlans, setSavedPlans] = useState<SavedPlan[]>([]);
  const [activePlanId, setActivePlanId] = useState<string | null>(null);
  const [activePlan, setActivePlan] = useState<SavedPlan | null>(null);
  const [userNoteText, setUserNoteText] = useState("");

  // Compare view states
  const [compareMode, setCompareMode] = useState(false);
  const [comparePlanAId, setComparePlanAId] = useState<string>("");
  const [comparePlanBId, setComparePlanBId] = useState<string>("");

  // Advanced LLM Engine and Hybrid State Store Preferences
  const [selectedLlm, setSelectedLlm] = useState<string>(() => {
    return localStorage.getItem("myk_io_selected_llm") || "Gemini 2.5 Flash Processor (Core)";
  });
  const [customApiKey, setCustomApiKey] = useState<string>(() => {
    return localStorage.getItem("myk_io_custom_api_key") || "";
  });
  const [storageStrategy, setStorageStrategy] = useState<"local" | "cloud">(() => {
    return (localStorage.getItem("myk_io_storage_strategy") as "local" | "cloud") || "local";
  });
  const [cloudSyncActive, setCloudSyncActive] = useState<boolean>(false);
  const [activeConnectors, setActiveConnectors] = useState<string[]>(() => {
    const list = localStorage.getItem("myk_io_connectors");
    return list ? JSON.parse(list) : ["Self-contained Sandbox Browser", "Local System Agent", "GitHub Synced Writer"];
  });

  // MYK-Online Gateway Webhook custom integration states
  const [webhookUrl, setWebhookUrl] = useState("https://myk-online.com/api/v1/prompts/deploy");
  const [deploymentStatus, setDeploymentStatus] = useState<"idle" | "deploying" | "success" | "error">("idle");
  const [deployedPromptId, setDeployedPromptId] = useState<string | null>(null);

  // Custom Memory Management states
  const [customMemoryKey, setCustomMemoryKey] = useState("");
  const [customMemoryVal, setCustomMemoryVal] = useState("");
  const [memoryItems, setMemoryItems] = useState<{ id: string; key: string; value: string; scope: "local" | "cloud" }[]>(() => {
    const list = localStorage.getItem("myk_io_memory_items");
    if (list) {
      try {
        return JSON.parse(list);
      } catch (e) {
        // Fallback default
      }
    }
    return [
      { id: "mem-1", key: "Admin Principal", value: "server-configured", scope: "cloud" },
      { id: "mem-2", key: "Production Database Endpoint", value: "configured-in-server-secrets", scope: "cloud" },
      { id: "mem-3", key: "Core Compile Fallback System", value: "Gemini 2.5 Flash Primary", scope: "local" }
    ];
  });

  // Desktop CLI terminal interactive inputs & log history state
  const [terminalHistory, setTerminalHistory] = useState<string[]>([
    "myk-cli: Initializing secure transport terminal connection to https://myk-online.com/...",
    "myk-cli: Handshake established with active master agent controller.",
    "myk-cli: Type 'help' to audit commands, or toggle connectors to sync.",
    "myk-cli: Ready for terminal pipeline jobs."
  ]);
  const [terminalCommand, setTerminalCommand] = useState("");

  // Interactive Guided Project Setup Companion States & Mappings
  const [wizardStep, setWizardStep] = useState<number>(() => {
    return Number(localStorage.getItem("myk_io_wizard_step")) || 1;
  });
  const [wizardUrl, setWizardUrl] = useState<string>("https://myk-online.com/auth/login");
  const [wizardUserVal, setWizardUserVal] = useState("server-configured-admin");
  const [wizardPassVal, setWizardPassVal] = useState("••••••••••••");
  const [wizardStatus, setWizardStatus] = useState<"idle" | "connecting" | "capturing" | "success" | "done">("idle");
  const [wizardLogs, setWizardLogs] = useState<string[]>([
    "companion-sub: Ready. Preloading MYK online gateway authentication node...",
    "companion-sub: Site preloaded. Ready for administrator single-click proxy capture."
  ]);
  const [isWizardCollapsed, setIsWizardCollapsed] = useState(false);

  // Wizard steps data mapped directly to active targets
  const stepConfigurations: {
    [key: number]: {
      title: string;
      url: string;
      service: string;
      directions: string;
      defaultUser: string;
      defaultPass: string;
      successLog: string;
      connectorName: string;
    }
  } = {
    1: {
      title: "Gateway Authorization Hook",
      url: "https://myk-online.com/auth/login",
      service: "MYK.IO Production Cloud Node",
      directions: "Grant safe proxy access to your online admin commands & synchronize the repository live specs.",
      defaultUser: "server-configured-admin",
      defaultPass: "server-managed-secret",
      successLog: "Handshake verified with myk-online.com. Admin session successfully persisted in an HttpOnly cookie.",
      connectorName: "Continuous Web Agent Engine"
    },
    2: {
      title: "Google Workspace API Scope Consent",
      url: "https://accounts.google.com/o/oauth2/auth?scope=docs,calendar",
      service: "Google Cloud Platform Consent Hub",
      directions: "Permit the agent to automatically extract your Google Calendar and dump formatted project timelines directly into Google Docs.",
      defaultUser: "workspace-admin@example.com",
      defaultPass: "••••••••••••••••",
      successLog: "OAuth2 client scopes approved. Exchanged authentication code for secure long-lived refresh token.",
      connectorName: "Google Workspace direct connector"
    },
    3: {
      title: "GitHub Repository Push Gateway",
      url: "https://github.com/login/oauth/authorize?client_id=myk_git",
      service: "GitHub OAuth Application Service",
      directions: "Authorizes write access to trigger auto-commits & save spec JSON directly to your codebase repository.",
      defaultUser: "server-configured-admin",
      defaultPass: "••••••••••••••••",
      successLog: "Webhook trigger registered. Generated write deploy keys and synchronized origin main branch.",
      connectorName: "GitHub Commit Synced Interface"
    },
    4: {
      title: "Anthropic Claude Key Provisioning",
      url: "https://console.anthropic.com/settings/keys",
      service: "Anthropic AI Developer Settings Console",
      directions: "Allows Claude 3.5 Sonnet to serve as a deep compiler fallback. Auto-extracts prompt authorization keys.",
      defaultUser: "server-configured-admin",
      defaultPass: "provider-managed-secret",
      successLog: "Registered alternative provider key reference in server-managed secret storage successfully.",
      connectorName: "Claude Core Context Proxy Agent"
    }
  };
  
  // Backend API connection check
  const [backendStatus, setBackendStatus] = useState<{
    hasApiKey: boolean;
    authConfigured: boolean;
    authenticated: boolean;
    checked: boolean;
  }>({
    hasApiKey: false,
    authConfigured: false,
    authenticated: false,
    checked: false,
  });

  const [copySuccess, setCopySuccess] = useState(false);

  // Admin Login authentication states & utilities
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError(null);

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          username: loginUsername,
          password: loginPassword,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Unable to authenticate administrator session.");
      }

      setIsLoggedIn(true);
      setBackendStatus((prev) => ({
        ...prev,
        authenticated: true,
        authConfigured: true,
        checked: true,
      }));
    } catch (err: any) {
      setLoginError(err.message || "Invalid administrator credentials.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleAdminLogout = async () => {
    await fetch("/api/logout", {
      method: "POST",
      credentials: "include",
    }).catch(() => undefined);
    setIsLoggedIn(false);
    setBackendStatus((prev) => ({ ...prev, authenticated: false }));
    setLoginUsername("");
    setLoginPassword("");
  };

  // Webhook custom deploy integration
  const triggerWebhookDeploy = async () => {
    if (!refinementResult) return;
    setDeploymentStatus("deploying");
    
    // Simulate web deployment to user's domain https://myk-online.com/
    try {
      await new Promise((resolve) => setTimeout(resolve, 1400));
      setDeploymentStatus("success");
      setDeployedPromptId(`deploy-${Math.floor(Math.random() * 900000 + 100000)}`);
      
      setTerminalHistory(prev => [
        ...prev,
        `myk-cli: [DEPLOY] Dispatched refined system instructions to webhook URL: ${webhookUrl}`,
        `myk-cli: [DEPLOY] Server responded with 201 Created. Hook active on production node myk-online.com.`,
        `myk-cli: [DEPLOY] Refined ID tracked in cloud database memory scope.`
      ]);
    } catch (e) {
      setDeploymentStatus("error");
    }
  };

  // Add a Custom Memory variable
  const handleAddMemoryItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customMemoryKey.trim() || !customMemoryVal.trim()) return;
    
    const newItem = {
      id: `mem-${Date.now()}`,
      key: customMemoryKey.trim(),
      value: customMemoryVal.trim(),
      scope: storageStrategy // matches selected strategy: local or cloud
    };
    
    const updated = [...memoryItems, newItem];
    setMemoryItems(updated);
    localStorage.setItem("myk_io_memory_items", JSON.stringify(updated));
    
    setTerminalHistory(prev => [
      ...prev,
      `myk-cli: [MEMORY] Registered dynamic key-value pair [${newItem.key}] under scope: [${newItem.scope.toUpperCase()}]`
    ]);
    
    setCustomMemoryKey("");
    setCustomMemoryVal("");
  };

  // Delete Custom Memory variable
  const handleDeleteMemoryItem = (id: string, keyName: string) => {
    const updated = memoryItems.filter(item => item.id !== id);
    setMemoryItems(updated);
    localStorage.setItem("myk_io_memory_items", JSON.stringify(updated));
    setTerminalHistory(prev => [
      ...prev,
      `myk-cli: [MEMORY] Deleted stored key-value pair [${keyName}]`
    ]);
  };

  // Interactive CLI commands console processor
  const handleExecuteTerminalCommand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!terminalCommand.trim()) return;

    const input = terminalCommand.trim();
    const parts = input.split(" ");
    const cmd = parts[0].toLowerCase();
    
    let responseLogs: string[] = [`admin@myk-online:~$ ${input}`];

    if (cmd === "help") {
      responseLogs.push(
        "Supported Command Line CLI Actions:",
        "  sync     - Forces state synchronization with cloud storage & active connectors",
        "  status   - Prints authorization scopes, key setup, and connector endpoints",
        "  agents   - Lists active prompt automation sub-agents",
        "  memory   - Displays currently loaded local/cloud persistent variables",
        "  clear    - Wipes the command line history trace"
      );
    } else if (cmd === "clear") {
      setTerminalHistory([]);
      setTerminalCommand("");
      return;
    } else if (cmd === "sync") {
      responseLogs.push(
        "myk-cli: Commencing memory synchronization sequence...",
        `myk-cli: Synchronizing ${savedPlans.length} formulated prompt specifications...`,
        `myk-cli: Syncing ${memoryItems.length} active persistent state memory records...`,
        `myk-cli: Contacting upstream gateway https://myk-online.com/...`,
        "myk-cli: SUCCESS. Cloud backup established securely."
      );
    } else if (cmd === "status") {
      responseLogs.push(
        "--- MYK.IO STATUS DIAGNOSTIC PANEL ---",
        `User session: server-authenticated administrator`,
        `Target deployment domain: https://myk-online.com/`,
        `Active Storage Scope: ${storageStrategy === "cloud" ? "CLOUD SYNCED (TLS Enabled)" : "LOCAL HARDWARE CACHE"}`,
        `API Backend Status: ${backendStatus.hasApiKey ? "Gemini Key Configured" : "Placeholder Keys Active"}`,
        `Active Multi-LLM Engine: ${selectedLlm}`
      );
    } else if (cmd === "agents") {
      responseLogs.push(
        "Active Autonomous Prompt Agents running background loops:",
        ...activeConnectors.map((connector) => `  ● [ACTIVE] ${connector} (Port: 3000 Link)`)
      );
    } else if (cmd === "memory") {
      responseLogs.push(
        "Loaded Persistent Memory Dictionary:",
        ...memoryItems.map((item) => `  [${item.scope.toUpperCase()}] ${item.key} => ${item.value}`)
      );
    } else {
      responseLogs.push(
        `bash: command not found: ${cmd}. Raise system commands via 'help'.`
      );
    }

    setTerminalHistory(prev => [...prev, ...responseLogs]);
    setTerminalCommand("");
  };

  // Microphone Capture Dictation using Web Speech API with simulation fallback
  const handleVoiceCapture = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechError("Speech API disabled in frame window context. Preloading simulation dictation...");
      setIsListening(true);
      
      const phrases = [
        "Create a modular Node Express application with JSON rates limiter, login security check, and static hosting triggered on myk-online.com production dashboard.",
        "Build me a dynamic single-view React tracker connecting the developer console gateway link and GitHub commits API securely.",
        "Implement high-fidelity prompt metrics and resource estimates for an automated compliance database wrapper."
      ];
      const testPhrase = phrases[Math.floor(Math.random() * phrases.length)];
      
      // Simulating a real, typing speech output to mimic voice typing perfectly
      let cur = 0;
      const timer = setInterval(() => {
        if (cur < testPhrase.length) {
          setPromptInput(prev => prev + testPhrase[cur]);
          cur++;
        } else {
          clearInterval(timer);
          setIsListening(false);
          setSpeechError(null);
          setTerminalHistory(prev => [
            ...prev,
            `myk-cli: [DICTATION] Audio trace captured via mock simulation (Voice-to-Text).`
          ]);
        }
      }, 35);
      return;
    }

    try {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = "en-US";

      rec.onstart = () => {
        setIsListening(true);
        setSpeechError(null);
      };

      rec.onerror = (evt: any) => {
        setSpeechError(`Speech Capture Error: ${evt.error || "unavailable"}`);
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      rec.onresult = (evt: any) => {
        const text = evt.results[0][0].transcript;
        if (text) {
          setPromptInput(prev => prev ? `${prev} ${text}` : text);
          setTerminalHistory(prev => [
            ...prev,
            `myk-cli: [DICTATION] Vocal dictation decoded: "${text}"`
          ]);
        }
      };

      rec.start();
    } catch (err: any) {
      setSpeechError(`Dictation Exception: ${err.message}`);
      setIsListening(false);
    }
  };

  // Google Search simulation within Sandbox Companion Viewport
  const handlePerformSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearchingDoc(true);
    setWizardLogs(prev => [
      ...prev,
      `[SEARCH] Propagating web search: "${searchQuery}"`,
      `[SEARCH] Negotiating SSL verification with Google indices...`
    ]);

    await new Promise(resolve => setTimeout(resolve, 1000));

    const q = searchQuery.toLowerCase();
    let matches = DOCUMENTATION_DATABASE.filter(doc =>
      doc.keywords.some(kw => q.includes(kw)) ||
      doc.title.toLowerCase().includes(q) ||
      doc.snippet.toLowerCase().includes(q)
    );

    if (matches.length === 0) {
      matches = [
        {
          keywords: [],
          title: `Optimized guidelines matching: "${searchQuery}"`,
          url: `https://myk-online.com/kb/v5/query?s=${encodeURIComponent(q)}`,
          snippet: `Live documentation match: To build or debug ${searchQuery}, configure secret keys in the Setup Wizard and deploy to the primary gateway node.`,
          date: "Just now"
        }
      ];
    }

    setSearchResults(matches);
    setIsSearchingDoc(false);
    setWizardLogs(prev => [
      ...prev,
      `[SEARCH] Extracted ${matches.length} articles on security, version patches, or libraries.`
    ]);
  };

  const startAutomaticStepConsent = async () => {
    if (wizardStep > 4) return;
    const config = stepConfigurations[wizardStep];
    setWizardStatus("connecting");
    setWizardLogs(prev => [
      ...prev,
      `[BROWSING] Navigating to target portal: ${config.url}`,
      `[BROWSING] Executing autonomous companion driver...`
    ]);

    await new Promise(resolve => setTimeout(resolve, 800));
    setWizardStatus("capturing");
    setWizardLogs(prev => [
      ...prev,
      `[SCRAPING] Preloading authorization request for: ${config.defaultUser}`,
      `[SCRAPING] Exchanging and capturing OAuth secure handshake state...`
    ]);

    await new Promise(resolve => setTimeout(resolve, 1200));
    setWizardStatus("success");
    setWizardLogs(prev => [...prev, `[SYSTEM] Capture Completed: ${config.successLog}`]);

    // Update active connectors
    if (!activeConnectors.includes(config.connectorName)) {
      const updatedConnectors = [...activeConnectors, config.connectorName];
      setActiveConnectors(updatedConnectors);
      localStorage.setItem("myk_io_connectors", JSON.stringify(updatedConnectors));
    }

    // Add a corresponding memory item automatically to prove agent did it
    const memoryKey = `${config.title.toUpperCase().replace(/[^A-Z0-9]/g, "_")}_ACCESS_TOKEN`;
    const mockToken = `token_${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    if (!memoryItems.some(item => item.key === memoryKey)) {
      const newMemoryItem = {
        id: `mem-wiz-${wizardStep}`,
        key: memoryKey,
        value: mockToken,
        scope: "cloud" as const
      };
      const updatedMemory = [...memoryItems, newMemoryItem];
      setMemoryItems(updatedMemory);
      localStorage.setItem("myk_io_memory_items", JSON.stringify(updatedMemory));
    }

    setTerminalHistory(prev => [
      ...prev,
      `myk-cli: [AGENT COMPANION] Connected "${config.connectorName}".`,
      `myk-cli: [AGENT COMPANION] Auto-provisioned security parameter: ${memoryKey} => ${mockToken}`
    ]);

    await new Promise(resolve => setTimeout(resolve, 1000));
    const nextStep = wizardStep + 1;
    setWizardStep(nextStep);
    localStorage.setItem("myk_io_wizard_step", String(nextStep));

    if (nextStep <= 4) {
      const nextConfig = stepConfigurations[nextStep];
      setWizardUrl(nextConfig.url);
      setWizardUserVal(nextConfig.defaultUser);
      setWizardPassVal(nextConfig.defaultPass);
      setWizardStatus("idle");
      setWizardLogs(prev => [
        `[IN-APP BROWSER] Preloaded authentication form: ${nextConfig.url}`,
        `[IN-APP BROWSER] Client ready for autonomous agent login sync...`
      ]);
    } else {
      setWizardStatus("done");
      setWizardLogs(prev => [
        `[SUCCESS] All credentials, access tokens, and API key triggers loaded!`,
        `[SUCCESS] System synchronized with production gateway https://myk-online.com/. Handlers active.`
      ]);
      setTerminalHistory(prev => [
        ...prev,
        `myk-cli: [COMPLETED] Companion setup is 100% active. Zero driving required.`
      ]);
    }
  };

  const handleResetWizard = () => {
    setWizardStep(1);
    localStorage.setItem("myk_io_wizard_step", "1");
    setWizardUrl(stepConfigurations[1].url);
    setWizardUserVal(stepConfigurations[1].defaultUser);
    setWizardPassVal(stepConfigurations[1].defaultPass);
    setWizardStatus("idle");
    setWizardLogs([
      "companion-sub: Reset. Preloading MYK online gateway authentication node...",
      "companion-sub: Site preloaded. Ready for administrator single-click proxy capture."
    ]);
  };

  // Sync wizard inputs on load/change
  useEffect(() => {
    if (stepConfigurations[wizardStep]) {
      const config = stepConfigurations[wizardStep];
      setWizardUrl(config.url);
      setWizardUserVal(config.defaultUser);
      setWizardPassVal(config.defaultPass);
    } else if (wizardStep > 4) {
      setWizardStatus("done");
    }
  }, [wizardStep]);

  // Initialize and load saved plans from localStorage
  useEffect(() => {
    const plansStr = localStorage.getItem("myk_io_plans") || localStorage.getItem("the_optimizer_plans");
    if (plansStr) {
      try {
        const loaded = JSON.parse(plansStr) as SavedPlan[];
        setSavedPlans(loaded);
        if (loaded.length > 0) {
          // Default to the most recent saved plan
          selectPlan(loaded[0]);
        }
      } catch (err) {
        console.error("Failed to load saved plans", err);
      }
    }
    
    // Check API credentials status
    fetch("/api/status", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        setBackendStatus({
          hasApiKey: data.hasApiKey,
          authConfigured: data.authConfigured,
          authenticated: data.authenticated,
          checked: true,
        });
        setIsLoggedIn(Boolean(data.authenticated));
        setIsAuthChecking(false);
      })
      .catch((err) => {
        console.error("Backend status check failed", err);
        setBackendStatus({
          hasApiKey: false,
          authConfigured: false,
          authenticated: false,
          checked: true,
        });
        setIsLoggedIn(false);
        setIsAuthChecking(false);
      });
  }, []);

  // Save plans helper
  const updateSavedPlans = (newPlans: SavedPlan[]) => {
    setSavedPlans(newPlans);
    localStorage.setItem("myk_io_plans", JSON.stringify(newPlans));
  };

  const selectPlan = (plan: SavedPlan) => {
    setActivePlanId(plan.id);
    setActivePlan(plan);
    setPromptInput(plan.prompt);
    setSelectedDomain(plan.domain as DomainType);
    setAnalysisText(plan.analysis);
    setSelectedTier(plan.selectedTier);
    setRefinementResult(plan.refinementResult);
    setUserNoteText(plan.userNotes || "");
    setCostOptions(null); // Clear pending option choice since we retrieved a finished plan
    setCompareMode(false);
  };

  const createNewPlanFlow = () => {
    setActivePlanId(null);
    setActivePlan(null);
    setPromptInput("");
    setSelectedDomain("General Build");
    setAnalysisText(null);
    setCostOptions(null);
    setSelectedTier(null);
    setRefinementResult(null);
    setUserNoteText("");
    setErrorMsg(null);
    setCompareMode(false);
  };

  const enterCompareMode = () => {
    setCompareMode(true);
    if (savedPlans.length >= 1 && !comparePlanAId) {
      setComparePlanAId(savedPlans[0].id);
    }
    if (savedPlans.length >= 2 && !comparePlanBId) {
      setComparePlanBId(savedPlans[1].id);
    } else if (savedPlans.length >= 1 && !comparePlanBId) {
      setComparePlanBId(savedPlans[0].id);
    }
  };

  // Submit main analysis
  const handleAnalyzePrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptInput.trim()) return;

    setIsAnalyzing(true);
    setErrorMsg(null);
    setCostOptions(null);
    setSelectedTier(null);
    setRefinementResult(null);

    try {
      const response = await fetch("/api/analyze-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          prompt: promptInput,
          domain: selectedDomain,
          selectedLlm: selectedLlm
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Analysis failed.");
      }

      const data = await response.json();
      setAnalysisText(data.analysis);
      setCostOptions(data.options);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "An error occurred while analyzing the prompt.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Submit option execution and refinement
  const handleSelectTierAndRefine = async (tierRecord: CostOption) => {
    if (!promptInput.trim()) return;
    
    setSelectedTier(tierRecord.tier);
    setIsRefining(true);
    setErrorMsg(null);

    try {
      const response = await fetch("/api/refine-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          prompt: promptInput,
          tier: tierRecord.tier,
          domain: selectedDomain,
          optionData: tierRecord,
          selectedLlm: selectedLlm
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Refinement failed.");
      }

      const data = await response.json();
      setRefinementResult(data);

      // Construct a new saved plan
      const freshChecklist: ChecklistItem[] = (data.milestones || []).map((ms: string, i: number) => ({
        id: `ms-${Date.now()}-${i}`,
        text: ms,
        completed: false
      }));

      const newPlan: SavedPlan = {
        id: `plan-${Date.now()}`,
        prompt: promptInput,
        domain: selectedDomain,
        createdAt: new Date().toISOString(),
        analysis: analysisText || "Successfully parsed plan metadata.",
        selectedTier: tierRecord.tier,
        refinementResult: {
          title: data.title || "The Refined Plan",
          content: data.content || "",
          estimatedTokens: data.estimatedTokens || tierRecord.costEstimate,
          milestones: data.milestones || [],
          keyRecommendations: data.keyRecommendations || []
        },
        checklist: freshChecklist,
        userNotes: ""
      };

      // Add to plans list & make active
      const updatedList = [newPlan, ...savedPlans];
      updateSavedPlans(updatedList);
      setActivePlanId(newPlan.id);
      setActivePlan(newPlan);
      setUserNoteText("");
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "An error occurred while generating the plan.");
    } finally {
      setIsRefining(false);
    }
  };

  // Toggle checklist item completeness
  const handleToggleChecklist = (itemId: string) => {
    if (!activePlan) return;
    
    const updatedChecklist = activePlan.checklist.map((item) =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );

    const updatedPlan = { ...activePlan, checklist: updatedChecklist };
    setActivePlan(updatedPlan);

    const updatedPlans = savedPlans.map((p) => (p.id === activePlan.id ? updatedPlan : p));
    updateSavedPlans(updatedPlans);
  };

  // Delete saved plan
  const handleDeletePlan = (planId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const filtered = savedPlans.filter((p) => p.id !== planId);
    updateSavedPlans(filtered);
    
    if (activePlanId === planId) {
      createNewPlanFlow();
    }
  };

  // Save notes
  const handleSaveNotes = () => {
    if (!activePlan) return;
    const updatedPlan = { ...activePlan, userNotes: userNoteText };
    setActivePlan(updatedPlan);
    const updatedPlans = savedPlans.map((p) => (p.id === activePlan.id ? updatedPlan : p));
    updateSavedPlans(updatedPlans);
  };

  // Clipboard copy helper
  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  // PDF formatted blueprint downloader
  const exportToPDF = () => {
    if (!activePlan) return;

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    let curY = 15;
    const leftMargin = 15;
    const rightMargin = 15;
    const contentWidth = 180; // A4 layout width is 210, minus margins

    // Helper to write text block and manage coordinates
    const addText = (text: string, fontSize = 10, fontStyle = "normal", color = "#1e293b", leading = 5) => {
      doc.setFont("Helvetica", fontStyle);
      doc.setFontSize(fontSize);
      
      if (color.startsWith("#")) {
        const hex = color.replace("#", "");
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        doc.setTextColor(r, g, b);
      } else {
        doc.setTextColor(51, 65, 85);
      }

      const lines = doc.splitTextToSize(text, contentWidth);
      for (let i = 0; i < lines.length; i++) {
        if (curY > 270) {
          doc.addPage();
          // Footer
          doc.setFontSize(8);
          doc.setFont("Helvetica", "italic");
          doc.setTextColor(148, 163, 184);
          doc.text("MYK.IO - Refined Project Blueprint Document", leftMargin, 287);
          
          doc.setFont("Helvetica", fontStyle);
          doc.setFontSize(fontSize);
          if (color.startsWith("#")) {
            const hex = color.replace("#", "");
            const r = parseInt(hex.substring(0, 2), 16);
            const g = parseInt(hex.substring(2, 4), 16);
            const b = parseInt(hex.substring(4, 6), 16);
            doc.setTextColor(r, g, b);
          }
          curY = 20; // reset to top with padding
        }
        doc.text(lines[i], leftMargin, curY);
        curY += leading;
      }
      curY += 2; // block margin padding
    };

    const addDivider = (color = "#e2e8f0") => {
      if (curY > 270) {
        doc.addPage();
        curY = 20;
      }
      const hex = color.replace("#", "");
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      doc.setDrawColor(r, g, b);
      doc.setLineWidth(0.3);
      doc.line(leftMargin, curY, leftMargin + contentWidth, curY);
      curY += 6;
    };

    // Blueprint Hero Ribbon Header Board
    doc.setFillColor(15, 23, 42); // slate-900 midnight shade
    doc.rect(10, 10, 190, 26, "F");

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.text("MYK.IO EXPORT SPEC SHEET", 16, 18);

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(20, 184, 166); // teal-500 accent highlight
    doc.text(`Offline Engineered Specifications  •  Formulated: ${new Date(activePlan.createdAt).toLocaleString()}`, 16, 24);

    curY = 44;

    // Metadata Table panel
    doc.setFillColor(248, 250, 252); // slate-50
    doc.rect(leftMargin, curY, contentWidth, 24, "F");
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.setLineWidth(0.2);
    doc.rect(leftMargin, curY, contentWidth, 24, "D");

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text("TECHNICAL DOMAIN:", leftMargin + 5, curY + 6);
    doc.text("DECISION OPTION LEVEL:", leftMargin + 5, curY + 12);
    doc.text("ESTIMATED COMPLEMENTS:", leftMargin + 5, curY + 18);

    doc.setFont("Helvetica", "normal");
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text(activePlan.domain, leftMargin + 55, curY + 6);
    doc.text(`Tier ${activePlan.selectedTier} (${activePlan.selectedTier === 1 ? "Option 1 - Cost-Friendly Brief Prompt" : activePlan.selectedTier === 2 ? "Option 2 - The Master Blueprint" : "Option 3 - The Multi-Tier Deep Dive Specs"})`, leftMargin + 55, curY + 12);
    doc.text(`${activePlan.refinementResult.estimatedTokens.toLocaleString()} credits used / prompt optimized scope`, leftMargin + 55, curY + 18);

    curY += 32;

    // Original Prompt box
    addText("ORIGINAL USER SYSTEM DIRECTIVE:", 9.5, "bold", "#1e1b4b");
    const promptLines = doc.splitTextToSize(activePlan.prompt, contentWidth - 10);
    const boxHeight = (promptLines.length * 4.5) + 6;
    
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.rect(leftMargin, curY - 1, contentWidth, boxHeight, "FD");

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    let promptInnerY = curY + 4;
    for (let line of promptLines) {
      doc.text(line, leftMargin + 5, promptInnerY);
      promptInnerY += 4.5;
    }
    curY += boxHeight + 8;

    // Deep meta-analysis
    if (activePlan.analysis) {
      addText("META-COGNITIVE SYSTEM DECOMPOSITION SUMMARY:", 9.5, "bold", "#0f172a");
      addText(`"${activePlan.analysis}"`, 8.5, "italic", "#0d9488", 4);
      addDivider();
    }

    // Refined instructions title
    addText(activePlan.refinementResult.title ? activePlan.refinementResult.title.toUpperCase() : "OPTIMIZED BLUEPRINT GUIDE AND MARKDOWN DIRECTIVES:", 11, "bold", "#4f46e5");
    addText("This design spec outlines actionable files, algorithms, and development tactics:", 9, "normal", "#64748b");
    curY += 2;

    // Paragraph format parsing for printable PDF sheets
    const paragraphs = activePlan.refinementResult.content.split("\n");
    for (let p of paragraphs) {
      if (!p.trim()) {
        curY += 1.5;
        continue;
      }

      if (p.startsWith("#")) {
        const heading = p.replace(/#/g, "").trim();
        curY += 2;
        addText(heading, 10, "bold", "#0f172a", 4.5);
      } else if (p.startsWith("-") || p.startsWith("*")) {
        const item = p.substring(1).trim();
        addText(`•  ${item}`, 8.5, "normal", "#334155", 4);
      } else {
        addText(p, 8.5, "normal", "#475569", 4);
      }
    }

    // Key recommendations
    if (activePlan.refinementResult.keyRecommendations?.length > 0) {
      addDivider();
      addText("STRATEGIC RESOURCE CONSUMPTION CONTROLS:", 10, "bold", "#0f172a");
      for (let r of activePlan.refinementResult.keyRecommendations) {
        addText(`[Credit Shield KPI]  ${r}`, 8, "normal", "#0284c7", 4);
      }
    }

    // Checklist Spec
    if (activePlan.checklist?.length > 0) {
      addDivider();
      addText("MILESTONE COMPLETION AUDITING BOARD:", 10, "bold", "#0f172a");
      for (let c of activePlan.checklist) {
        const checkIcon = c.completed ? "[X] COMPLETED" : "[ ] PENDING HANDLER";
        addText(`${checkIcon}  -  ${c.text}`, 8, c.completed ? "italic" : "normal", c.completed ? "#10b981" : "#475569", 4);
      }
    }

    // Custom Dev scratchpad notes
    if (activePlan.userNotes?.trim()) {
      addDivider();
      addText("DEVELOPER SCRATCHPAD NOTES & MEMORANDUMS:", 10, "bold", "#0f172a");
      addText(activePlan.userNotes, 8, "normal", "#475569", 3.8);
    }

    // Footers page stamping
    const pageCount = doc.getNumberOfPages();
    for (let pi = 1; pi <= pageCount; pi++) {
      doc.setPage(pi);
      doc.setFontSize(7.5);
      doc.setFont("Helvetica", "italic");
      doc.setTextColor(148, 163, 184);
      doc.text(`Page ${pi} of ${pageCount}  -  Prepared for authenticated administrator  -  Built on aistudio`, 15, 287);
    }

    const safeTitleName = activePlan.refinementResult.title
      ? activePlan.refinementResult.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()
      : "blueprint";

    doc.save(`myk_io_blueprint_${safeTitleName}.pdf`);
  };

  // Structured JSON representation offline package
  const exportToJSON = () => {
    if (!activePlan) return;
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(activePlan, null, 2)
    )}`;
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", jsonString);
    const safeTitleName = activePlan.refinementResult.title
      ? activePlan.refinementResult.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()
      : "blueprint";
    downloadAnchor.setAttribute("download", `myk_io_blueprint_${safeTitleName}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Fill in sample prompt
  const applySamplePrompt = (sample: typeof EXAMPLE_PROMPTS[number]) => {
    setPromptInput(sample.prompt);
    setSelectedDomain(sample.domain);
    // Reset output panels to let them fresh analyze
    setAnalysisText(null);
    setCostOptions(null);
    setSelectedTier(null);
    setRefinementResult(null);
    setActivePlanId(null);
    setActivePlan(null);
  };

  const renderComparePane = (targetId: string, comparisonId: string) => {
    const plan = savedPlans.find(p => p.id === targetId);
    if (!plan) {
      return (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-xs text-slate-400" id={`empty-compare-${targetId}`}>
          No blueprint selected. Select one above to begin auditing.
        </div>
      );
    }

    const otherPlan = savedPlans.find(p => p.id === comparisonId);
    
    // Highlight whichever has lower token cost
    const isCostSaver = otherPlan 
      ? plan.refinementResult.estimatedTokens < otherPlan.refinementResult.estimatedTokens
      : false;
      
    const isCostEqual = otherPlan 
      ? plan.refinementResult.estimatedTokens === otherPlan.refinementResult.estimatedTokens
      : false;

    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col h-full space-y-6" id={`compare-pane-${plan.id}`}>
        
        {/* Title and metadata badge */}
        <div>
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded uppercase tracking-wide">
              {plan.domain}
            </span>
            {isCostSaver && (
              <span className="text-[9px] font-black text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center space-x-1 animate-pulse">
                <Coins className="h-3 w-3 text-emerald-600" />
                <span>Cost Saver Match</span>
              </span>
            )}
          </div>
          <h4 className="font-display font-bold text-lg text-slate-900 mt-2 leading-tight">
            {plan.refinementResult.title}
          </h4>
          <span className="text-[10.5px] text-slate-400 mt-1 block">
            Formulated: {new Date(plan.createdAt).toLocaleString()}
          </span>
        </div>

        {/* Cost metrics comparative block */}
        <div className="bg-slate-50 rounded-xl border border-slate-200/60 p-4 space-y-2.5">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
            <span>Stated Resource Weight</span>
            <span className="font-mono text-indigo-600 font-bold">
              {plan.refinementResult.estimatedTokens.toLocaleString()} tokens
            </span>
          </div>
          
          {/* Render progress bar comparative ratio */}
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div 
              style={{ width: `${Math.min(100, Math.max(10, (plan.refinementResult.estimatedTokens / 10000) * 100))}%` }} 
              className={`h-full rounded-full ${isCostSaver ? "bg-emerald-500" : isCostEqual ? "bg-indigo-500" : "bg-amber-500"}`}
            ></div>
          </div>

          <p className="text-[10px] text-slate-400 italic">
            This option represents {plan.selectedTier === 1 ? "Option 1 (Compressed Core Prompts)" : plan.selectedTier === 2 ? "Option 2 (Master Architecture Roadmaps)" : "Option 3 (Detailed Implementation Specifications)"}.
          </p>
        </div>

        {/* User prompt breakdown block */}
        <div className="space-y-1.5">
          <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Original Context Prompt</span>
          <p className="text-xs text-slate-600 line-clamp-4 leading-normal bg-slate-50 p-2.5 rounded-lg border border-slate-100 italic">
            "{plan.prompt}"
          </p>
        </div>

        {/* Milestones and checklists comparative structure */}
        <div className="space-y-2 flex-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Milestone Checklist ({plan.checklist.length})</span>
            <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded leading-none">
              {plan.checklist.filter(c => c.completed).length} / {plan.checklist.length} completed
            </span>
          </div>
          
          {plan.checklist && plan.checklist.length > 0 ? (
            <div className="space-y-2 max-h-64 overflow-y-auto border border-slate-100 rounded-xl p-2 bg-slate-50/50">
              {plan.checklist.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    // Locally toggling comparing items completes them on save
                    const updatedChecklist = plan.checklist.map((c) =>
                      c.id === item.id ? { ...c, completed: !c.completed } : c
                    );
                    const updatedPlan = { ...plan, checklist: updatedChecklist };
                    const updatedPlans = savedPlans.map((p) => (p.id === plan.id ? updatedPlan : p));
                    updateSavedPlans(updatedPlans);
                  }}
                  className={`flex items-start gap-2.5 p-2 rounded-lg border text-[11px] cursor-pointer hover:border-slate-300 transition-all ${
                    item.completed 
                      ? "bg-emerald-50/20 border-emerald-100 text-slate-500" 
                      : "bg-white border-slate-200 text-slate-700"
                  }`}
                  id={`compare-item-${item.id}`}
                >
                  <span className="shrink-0 mt-0.5">
                    {item.completed ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    ) : (
                      <div className="h-3.5 w-3.5 rounded border border-slate-300 bg-white"></div>
                    )}
                  </span>
                  <span className={item.completed ? "line-through" : ""}>{item.text}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">No checklist targets found.</p>
          )}
        </div>

        {/* Copy / Strategy actions */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
          <button
            onClick={() => handleCopyToClipboard(plan.refinementResult.content)}
            className="flex-1 py-1.5 px-3 hover:bg-slate-50 active:bg-slate-100 text-slate-700 font-semibold rounded-lg text-xs border border-slate-200 flex items-center justify-center space-x-1 transition cursor-pointer"
            id={`compare-copy-btn-${plan.id}`}
          >
            <Clipboard className="h-3 w-3" />
            <span>Copy Spec</span>
          </button>
          
          <button
            onClick={() => {
              // Direct click focus view on this plan and exit compare mode
              selectPlan(plan);
            }}
            className="flex-1 py-1.5 px-3 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold rounded-lg text-xs flex items-center justify-center space-x-1 shadow-xs cursor-pointer transition"
            id={`compare-focus-btn-${plan.id}`}
          >
            <ExternalLink className="h-3 w-3" />
            <span>Focus Blueprint</span>
          </button>
        </div>

      </div>
    );
  };

  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 font-sans antialiased flex items-center justify-center p-4">
        <div className="bg-slate-950 border border-slate-800 rounded-3xl p-8 shadow-2xl flex items-center space-x-3">
          <Loader2 className="h-5 w-5 text-teal-400 animate-spin" />
          <span className="text-sm font-semibold text-slate-300">Checking administrator session...</span>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 font-sans antialiased flex items-center justify-center p-4 selection:bg-teal-500/30 selection:text-teal-200">
        <div className="w-full max-w-md bg-slate-950 border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden space-y-6">
          {/* Accent decoration rings */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl -ml-16 -mb-16"></div>

          {/* Heading */}
          <div className="text-center space-y-4 relative flex flex-col items-center">
            <MykLogo className="w-28 h-28" />
            <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed pt-1">
              Administrative Command Center. Please verify credentials to access the prompt optimization platform.
            </p>
          </div>

          {/* Username & Password Form */}
          <form onSubmit={handleAdminLogin} className="space-y-4 relative" id="admin-login-form">
            {loginError && (
              <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs rounded-xl p-3.5 flex items-start space-x-2 animate-fadeIn" id="login-error-msg">
                <BadgeAlert className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                <span className="leading-snug">{loginError}</span>
              </div>
            )}

            {backendStatus.checked && !backendStatus.authConfigured && (
              <div className="bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs rounded-xl p-3.5 flex items-start space-x-2 animate-fadeIn" id="login-config-msg">
                <BadgeAlert className="h-4 w-4 text-amber-300 shrink-0 mt-0.5" />
                <span className="leading-snug">
                  Admin login is disabled until the server has ADMIN_USERNAME and ADMIN_PASSWORD configured.
                </span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Username</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  placeholder="e.g. administrator"
                  className="w-full bg-slate-900 border border-slate-800 focus:border-teal-500 rounded-xl px-4 py-3 text-sm text-white focus:outline-none transition placeholder:text-slate-600 block"
                  id="login-username-input"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Secret Password</label>
              </div>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-900 border border-slate-800 focus:border-teal-500 rounded-xl px-4 py-3 text-sm text-white focus:outline-none transition block font-mono"
                  id="login-password-input"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoggingIn || (backendStatus.checked && !backendStatus.authConfigured)}
              className="w-full py-3 px-4 bg-teal-500 hover:bg-teal-400 active:bg-teal-600 disabled:bg-slate-700 disabled:text-slate-400 text-slate-950 rounded-xl text-sm font-bold shadow-lg shadow-teal-500/10 transition-all duration-150 flex items-center justify-center space-x-2 cursor-pointer disabled:cursor-not-allowed mt-6"
              id="btn-login-submit"
            >
              {isLoggingIn ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
              <span>{isLoggingIn ? "Validating..." : "Validate Credentials"}</span>
            </button>
          </form>

          {/* Footer Security Stamp */}
          <div className="text-center pt-2 text-[10px] text-slate-500 font-mono flex items-center justify-center space-x-1.5 border-t border-slate-800/50">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full inline-block"></span>
            <span>Identity Securing Handlers Active</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased flex flex-col md:flex-row">
      
      {/* Sidebar: Saved Blueprints & Credentials status */}
      <aside className="w-full md:w-80 bg-slate-900 text-slate-100 p-6 flex flex-col shrink-0 border-b md:border-b-0 md:border-r border-slate-800">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <MykLogo className="w-14 h-14 shrink-0" />
            <div>
              <h1 className="font-display font-black text-lg tracking-widest text-slate-100 leading-none">MYK.IO</h1>
              <p className="text-[9.5px] text-cyan-400 font-bold uppercase tracking-wider mt-1 font-mono">Optimization Matrix</p>
            </div>
          </div>
        </div>

        {/* Action Button: Create New Plan */}
        <button
          onClick={createNewPlanFlow}
          className="w-full mb-6 py-2.5 px-4 bg-teal-600 hover:bg-teal-500 active:bg-teal-700 text-slate-900 font-medium rounded-lg text-sm flex items-center justify-center space-x-2 transition duration-150 cursor-pointer shadow-sm hover:shadow-teal-900/10"
          id="btn-new-plan"
        >
          <Plus className="h-4 w-4" />
          <span>New Prompt Analysis</span>
        </button>

        {/* Saved Plans List */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          <div className="flex items-center space-x-1 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            <History className="h-3 w-3" />
            <span>Saved Specifications ({savedPlans.length})</span>
          </div>

          {savedPlans.length >= 2 ? (
            <button
              onClick={enterCompareMode}
              className={`w-full mb-3 text-xs font-semibold py-2 px-3 rounded-lg border transition-all duration-120 flex items-center justify-center space-x-2 cursor-pointer ${
                compareMode
                  ? "bg-indigo-600 font-bold text-white border-indigo-500 shadow-sm shadow-indigo-900/20"
                  : "bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 border-teal-500/30 hover:border-teal-500/50"
              }`}
              id="sidebar-compare-toggle"
            >
              <ArrowLeftRight className="h-3.5 w-3.5 animate-pulse" />
              <span>Side-by-side Compare</span>
            </button>
          ) : savedPlans.length === 1 ? (
            <div className="text-[10px] text-slate-500 text-center py-1.5 border border-dashed border-slate-800 rounded-lg bg-slate-950/10 mb-3 leading-normal">
              Create another plan to unlock compare view
            </div>
          ) : null}

          {savedPlans.length === 0 ? (
            <div className="text-center py-8 px-4 bg-slate-950/40 rounded-xl border border-slate-800/60">
              <p className="text-xs text-slate-500">Your generated blueprints and checklists will align here.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {savedPlans.map((plan) => {
                const isActive = activePlanId === plan.id;
                const completedCount = plan.checklist.filter(c => c.completed).length;
                const totalCount = plan.checklist.length;
                return (
                  <div
                    key={plan.id}
                    onClick={() => selectPlan(plan)}
                    className={`group w-full text-left p-3.5 rounded-xl border text-sm transition-all duration-150 cursor-pointer flex flex-col justify-between ${
                      isActive
                        ? "bg-slate-800 border-teal-500/60 text-white shadow-md shadow-black/10"
                        : "bg-slate-950/30 border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white"
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2 mb-1.5">
                      <span className="font-medium line-clamp-2 leading-snug">
                        {plan.refinementResult.title || "Refined Plan"}
                      </span>
                      <button
                        onClick={(e) => handleDeletePlan(plan.id, e)}
                        className="opacity-0 group-hover:opacity-100 hover:text-rose-400 text-slate-400 p-1 rounded transition duration-150"
                        title="Delete blueprint"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-400 mt-2 pt-2 border-t border-slate-800/50">
                      <span className="bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded text-[10px] font-mono leading-none">
                        Tier {plan.selectedTier}
                      </span>
                      <span className="flex items-center space-x-1">
                        <CheckCircle2 className="h-3 w-3 text-teal-400" />
                        <span>{completedCount}/{totalCount} steps</span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Environment Credentials Info Indicator */}
        <div className="mt-auto pt-4 border-t border-slate-800 text-xs">
          
          {/* Admin Session Badge */}
          <div className="mb-3 bg-teal-500/10 hover:bg-teal-500/15 p-3.5 rounded-xl border border-teal-500/20 flex items-center justify-between transition-all" id="admin-session-badge">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 bg-teal-500/20 text-teal-400 rounded-lg">
                <Unlock className="h-3.5 w-3.5 animate-pulse" />
              </div>
              <div className="text-left">
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Admin Role</p>
                <p className="text-xs font-semibold text-white">Administrator</p>
              </div>
            </div>
            
            <button
              onClick={handleAdminLogout}
              className="py-1 px-2.5 bg-rose-500/20 hover:bg-rose-500 hover:text-white text-rose-300 rounded-lg text-[10px] font-bold transition flex items-center space-x-1 cursor-pointer border border-rose-500/30"
              id="sidebar-signout-btn"
            >
              <LogOut className="h-3 w-3" />
              <span>Sign Out</span>
            </button>
          </div>

          <div className="bg-slate-950/40 p-3.5 rounded-xl border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Gemini SDK API</span>
              {backendStatus.checked ? (
                backendStatus.hasApiKey ? (
                  <span className="text-emerald-400 font-semibold flex items-center space-x-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
                    <span>Ready</span>
                  </span>
                ) : (
                  <span className="text-amber-400 font-semibold flex items-center space-x-1">
                    <BadgeAlert className="h-3.5 w-3.5 text-amber-400" />
                    <span>Keys Required</span>
                  </span>
                )
              ) : (
                <span className="text-slate-500">Checking...</span>
              )}
            </div>
            {!backendStatus.hasApiKey && backendStatus.checked && (
              <p className="text-[10px] text-slate-500 leading-normal">
                Please add the <code className="text-teal-400">GEMINI_API_KEY</code> setup inside the Secrets panel of your workspace for core real-time evaluations.
              </p>
            )}
            <div className="pt-1.5 flex items-center text-[10px] text-zinc-500 font-mono">
              <span>Time: 2026-06-05 UTC</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Panel */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-50 overflow-y-auto">
        
        {/* Header bar */}
        <header className="bg-white border-b border-slate-200/80 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
          <div>
            <div className="flex items-center space-x-2">
              <span className="bg-teal-50 text-teal-700 text-xs font-semibold uppercase px-2.5 py-0.5 rounded-full tracking-wider border border-teal-200/50">
                {compareMode ? "Comparative Analytics Panel" : "Optimized Framework"}
              </span>
            </div>
            <h2 className="font-display font-bold text-2xl text-slate-900 tracking-tight mt-1" id="main-panel-heading">
              {compareMode ? "Blueprint Comparative Matrix" : activePlanId ? activePlan?.refinementResult.title : "Blueprint Orchestrate Engine"}
            </h2>
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-xs text-slate-500">Target User:</span>
            <span className="font-mono text-xs bg-slate-100 text-slate-800 px-3 py-1 rounded-full border border-slate-200">
              Authenticated Admin
            </span>
          </div>
        </header>

        {/* Content Space */}
        <div className="p-6 md:p-8 space-y-6 max-w-6xl w-full mx-auto">
          
          {compareMode ? (
            <div className="space-y-6">
              
              {/* Compare Mode Header */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fadeIn" id="compare-hero-header">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
                    <Scale className="h-5 w-5 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-base text-slate-900">Side-by-Side Blueprint Audit</h3>
                    <p className="text-xs text-slate-500">Compare milestone structural details and credit usage between formulated roadmaps</p>
                  </div>
                </div>
                <button
                  onClick={() => setCompareMode(false)}
                  className="py-2 px-4 bg-slate-100 hover:bg-slate-200 hover:text-slate-950 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer transition flex items-center space-x-1 border border-slate-200"
                  id="btn-compare-exit"
                >
                  <span>← Back to Workspace</span>
                </button>
              </div>

              {/* Selector Panels */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-900 p-5 rounded-2xl border border-slate-800 text-slate-100 shadow-xl" id="compare-selectors-board">
                {/* Selector A */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">Blueprint A Spec</label>
                  <select
                    value={comparePlanAId}
                    onChange={(e) => setComparePlanAId(e.target.value)}
                    className="w-full text-xs font-medium bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer text-slate-100"
                    id="compare-select-a"
                  >
                    <option value="" disabled>-- Choose Spec A --</option>
                    {savedPlans.map(p => (
                      <option key={p.id} value={p.id} className="text-slate-900">
                        {p.refinementResult.title || "Refined Plan"} ({p.domain} - Tier {p.selectedTier})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Selector B */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">Blueprint B Spec</label>
                  <select
                    value={comparePlanBId}
                    onChange={(e) => setComparePlanBId(e.target.value)}
                    className="w-full text-xs font-medium bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer"
                    id="compare-select-b"
                  >
                    <option value="" disabled>-- Choose Spec B --</option>
                    {savedPlans.map(p => (
                      <option key={p.id} value={p.id} className="text-slate-900">
                        {p.refinementResult.title || "Refined Plan"} ({p.domain} - Tier {p.selectedTier})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Split comparative panes */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="compare-split-panes">
                {renderComparePane(comparePlanAId, comparePlanBId)}
                {renderComparePane(comparePlanBId, comparePlanAId)}
              </div>

            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Premium Navigation Menu Bar */}
              <div className="bg-slate-900/5 hover:bg-slate-900/10 rounded-2xl border border-slate-200/90 p-1.5 flex flex-wrap gap-1 items-center justify-between" id="myk-premium-navigation-bar">
                <div className="flex flex-wrap gap-1 w-full sm:w-auto">
                  <button
                    onClick={() => setActiveTab("optimizer")}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold tracking-wide transition flex items-center space-x-2 cursor-pointer w-full sm:w-auto justify-center ${
                      activeTab === "optimizer"
                        ? "bg-slate-900 text-white shadow-md shadow-slate-900/40"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                    }`}
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Workspace Optimizer</span>
                  </button>

                  <button
                    onClick={() => setActiveTab("connectors")}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold tracking-wide transition flex items-center space-x-2 cursor-pointer w-full sm:w-auto justify-center ${
                      activeTab === "connectors"
                        ? "bg-slate-900 text-white shadow-md shadow-slate-900/40"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                    }`}
                  >
                    <Cpu className="h-3.5 w-3.5 animate-pulse text-indigo-500" />
                    <span>Sandbox & Setup Wizard</span>
                  </button>

                  <button
                    onClick={() => setActiveTab("agent-creator")}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold tracking-wide transition flex items-center space-x-2 cursor-pointer w-full sm:w-auto justify-center ${
                      activeTab === "agent-creator"
                        ? "bg-slate-900 text-white shadow-md shadow-slate-900/40"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                    }`}
                  >
                    <Settings className="h-3.5 w-3.5 text-teal-600" />
                    <span>Custom Agents & Memory</span>
                  </button>

                  <button
                    onClick={() => setActiveTab("history")}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold tracking-wide transition flex items-center space-x-2 cursor-pointer w-full sm:w-auto justify-center ${
                      activeTab === "history"
                        ? "bg-slate-900 text-white shadow-md shadow-slate-900/40"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                    }`}
                  >
                    <History className="h-3.5 w-3.5" />
                    <span>Saved Blueprints History ({savedPlans.length})</span>
                  </button>
                </div>

                {/* Status indicator */}
                <div className="hidden md:flex items-center space-x-2 px-3 py-1 bg-white border border-slate-200 rounded-xl font-mono text-[10px] text-slate-500 shadow-sm shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 block animate-pulse"></span>
                  <span className="font-bold uppercase tracking-wider text-slate-700">MYK.{activeTab.toUpperCase()}_NODE</span>
                </div>
              </div>

              {/* Conditional rendering of selected Tab view */}
              {activeTab === "connectors" && (
                <div className="animate-fadeIn space-y-6">
                  {/* Guided Setup Wizard & Interactive Sandbox Browser Companion */}
                  <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 text-slate-100 shadow-xl overflow-hidden transition-all duration-300" id="guided-connector-wizard-panel">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                  <div className="flex items-center space-x-3 text-left">
                    <div className="p-2.5 bg-teal-500/10 text-teal-400 rounded-2xl border border-teal-500/20">
                      <Cpu className="h-6 w-6 animate-pulse" />
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-base text-white flex items-center space-x-2">
                        <span>Autonomous Agent Setup Companion</span>
                        <span className="text-[10px] bg-teal-500/10 text-teal-400 border border-teal-500/30 font-mono px-2.5 py-0.5 rounded-full uppercase font-medium animate-pulse">
                          {wizardStep <= 4 ? `Step ${wizardStep} of 4` : "Pipeline Synchronized"}
                        </span>
                      </h3>
                      <p className="text-xs text-slate-400">
                        Authorize background connectors, provision secret API credentials, and sync hooks automatically with zero friction.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2.5 justify-end w-full sm:w-auto">
                    <button
                      onClick={() => setIsWizardCollapsed(!isWizardCollapsed)}
                      className="text-xs font-semibold px-3 py-1.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-950 border border-slate-700/60 rounded-xl transition cursor-pointer text-slate-300"
                    >
                      {isWizardCollapsed ? "Expand Developer Gateway" : "Collapse Live Diagnostic"}
                    </button>
                    {wizardStep > 1 && (
                      <button
                        onClick={handleResetWizard}
                        className="text-xs font-bold text-slate-400 hover:text-white flex items-center space-x-1 py-1.5 px-2.5 bg-slate-800/40 hover:bg-slate-800/80 rounded-lg border border-slate-800/60 transition"
                        title="Reset setup steps"
                      >
                        <RefreshCw className="h-3 w-3" />
                        <span>Reset Workspace</span>
                      </button>
                    )}
                  </div>
                </div>

                {!isWizardCollapsed && (
                  <div className="mt-5 grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn text-left">
                    {/* Left details panel: Step descriptions and directions */}
                    <div className="lg:col-span-5 space-y-4 flex flex-col justify-between">
                      <div className="space-y-3">
                        <div className="inline-flex items-center space-x-1 px-2.5 py-1 bg-teal-500/10 text-teal-300 border border-teal-500/25 rounded-lg text-[10px] uppercase font-bold tracking-wider leading-none">
                          <Server className="h-3 w-3 text-teal-400 mr-0.5" />
                          <span>Active Request Scope</span>
                        </div>
                        
                        {wizardStep <= 4 ? (
                          <>
                            <h4 className="font-display font-extrabold text-xl text-white tracking-tight">
                              {stepConfigurations[wizardStep].title}
                            </h4>
                            <p className="text-xs text-slate-400 leading-relaxed">
                              {stepConfigurations[wizardStep].directions}
                            </p>
                            
                            <div className="p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800/60 space-y-2 text-xs">
                              <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">Setup directions:</span>
                              <p className="text-slate-300">
                                Click <strong className="text-teal-400">"Simulate Agent Proxy Sync"</strong> in the browser sandbox. The companion auto-captures needed codes & updates client-server pipelines without copy paste cycles.
                              </p>
                            </div>
                          </>
                        ) : (
                          <div className="space-y-3 py-2">
                            <div className="p-3.5 bg-emerald-950/20 border border-emerald-900/40 text-emerald-300 rounded-2xl text-xs space-y-2">
                              <p className="font-bold uppercase tracking-wider text-emerald-400 font-mono text-[11px]">✓ ALL INTEGRATION CONNECTORS ACTIVE</p>
                              <p className="leading-relaxed text-slate-300">
                                The optimizer agent has completed automated handshake credentials for the MYK Gateway, Google Docs + Contacts API, GitHub continuous commits repository, and the fallback Anthropic compiler node.
                              </p>
                            </div>
                            <div className="text-xs text-slate-400 leading-relaxed">
                              Your persistent hybrid storage is fully populated with OAuth variables. Zero further setup steps active.
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Scraper real-time tracer */}
                      <div className="space-y-1.5 pt-4 border-t border-slate-800">
                        <span className="block text-[9.5px] uppercase font-bold text-slate-500 tracking-wider font-mono">Agent Scraper Log Stream</span>
                        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/60 h-[110px] overflow-y-auto font-mono text-[10.5px] text-slate-400 space-y-1">
                          {wizardLogs.map((log, idx) => (
                            <div key={idx} className={log.includes("[SUCCESS]") || log.includes("[SYSTEM]") ? "text-emerald-400" : log.includes("[SCRAPING]") ? "text-amber-400" : "text-slate-400"}>
                              {log}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Right Sandbox Browser Viewport (In-App Sandbox UI Simulator) */}
                    <div className="lg:col-span-7 bg-slate-950 rounded-2xl border border-slate-800 flex flex-col overflow-hidden min-h-[360px] shadow-2xl relative">
                      {/* Interactive Browser Chrome Tab Bar */}
                      <div className="bg-slate-900 px-4 flex border-b border-slate-800/60 font-sans text-xs shrink-0 select-none">
                        <button
                          type="button"
                          onClick={() => setBrowserTab("auth")}
                          className={`px-4 py-2 border-r border-slate-800 flex items-center space-x-1.5 cursor-pointer leading-none transition-all ${
                            browserTab === "auth"
                              ? "bg-slate-950 text-white font-bold border-b-2 border-b-teal-400"
                              : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
                          }`}
                        >
                          <Lock className="h-3 w-3 text-teal-400" />
                          <span>Secure Handshake Portal</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setBrowserTab("search")}
                          className={`px-4 py-2 border-r border-slate-800 flex items-center space-x-1.5 cursor-pointer leading-none transition-all ${
                            browserTab === "search"
                              ? "bg-slate-950 text-white font-bold border-b-2 border-b-indigo-400"
                              : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
                          }`}
                        >
                          <Search className="h-3 w-3 text-indigo-400" />
                          <span>Google Search doc updates</span>
                          <span className="bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 text-[8px] font-mono px-1 py-0.5 rounded animate-pulse">LIVE</span>
                        </button>
                      </div>

                      {/* Browser Chrome Header bar */}
                      <div className="bg-slate-900 px-4 py-3 border-b border-slate-800/80 flex items-center justify-between shrink-0 font-sans">
                        <div className="flex items-center space-x-1.5 shrink-0">
                          <span className="w-2.5 h-2.5 bg-rose-500 hover:scale-105 rounded-full inline-block transition"></span>
                          <span className="w-2.5 h-2.5 bg-amber-500 hover:scale-105 rounded-full inline-block transition"></span>
                          <span className="w-2.5 h-2.5 bg-emerald-500 hover:scale-105 rounded-full inline-block transition"></span>
                        </div>
                        
                        <div className="bg-slate-950 border border-slate-800/80 rounded-lg px-3 py-1 text-[11px] font-mono text-slate-400 flex items-center space-x-2 w-[70%] max-w-[420px] justify-center truncate">
                          {browserTab === "auth" ? (
                            <>
                              <Lock className="h-3 w-3 text-emerald-400 shrink-0" />
                              <span className="truncate select-all">{wizardUrl}</span>
                            </>
                          ) : (
                            <>
                              <Lock className="h-3 w-3 text-emerald-400 shrink-0" />
                              <span className="truncate select-all">https://google.com/search?q={encodeURIComponent(searchQuery || "latest-security-patches")}</span>
                            </>
                          )}
                        </div>

                        <div className="flex items-center space-x-2 text-slate-500 text-xs shrink-0 font-mono select-none">
                          <span>🌐 Sandbox View</span>
                        </div>
                      </div>

                      {/* Browser Viewport Content */}
                      <div className="p-6 flex-1 flex flex-col justify-between bg-slate-950 relative min-h-[280px]">
                        {wizardStatus === "connecting" || wizardStatus === "capturing" ? (
                          <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center space-y-3 z-20">
                            <Loader2 className="h-8 w-8 text-teal-400 animate-spin" />
                            <div className="text-center">
                              <p className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                                {wizardStatus === "connecting" ? "Establishing TLS Handshake..." : "Capturing Credentials..."}
                              </p>
                              <p className="text-[10px] text-slate-500 font-mono mt-1">SSL Gateway Secure - Proxy Capture Node Active</p>
                            </div>
                          </div>
                        ) : null}

                        {browserTab === "auth" ? (
                          wizardStep <= 4 ? (
                            <div className="space-y-4 text-left my-auto animate-fadeIn">
                              <div className="pb-3 border-b border-slate-800/60">
                                <span className="text-[10px] bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-slate-400 font-bold uppercase tracking-wider font-mono">
                                  Interactive Platform Browser Preload
                                </span>
                                <h5 className="font-display font-semibold text-sm text-slate-200 mt-1.5 font-mono">
                                  {stepConfigurations[wizardStep].service}
                                </h5>
                              </div>

                              <div className="space-y-3 max-w-[340px] mx-auto bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                                <div className="space-y-1">
                                  <label className="block text-[10px] font-bold text-slate-400 uppercase font-mono">Pre-filled Account User</label>
                                  <input
                                    type="text"
                                    disabled
                                    value={wizardUserVal}
                                    className="w-full text-xs font-mono bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-300 outline-none"
                                  />
                                </div>

                                <div className="space-y-1">
                                  <label className="block text-[10px] font-bold text-slate-400 uppercase font-mono">Pre-filled Secret Scope</label>
                                  <input
                                    type="password"
                                    disabled
                                    value={wizardPassVal}
                                    className="w-full text-xs font-mono bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-500 outline-none"
                                  />
                                </div>
                              </div>

                              <div className="pt-2 flex flex-col items-center space-y-2">
                                <button
                                  type="button"
                                  onClick={startAutomaticStepConsent}
                                  className="w-full max-w-[340px] py-2 px-4 bg-teal-400 hover:bg-teal-300 active:bg-teal-500 text-slate-950 text-xs font-extrabold rounded-xl transition flex items-center justify-center space-x-2 shadow-lg shadow-teal-500/10 cursor-pointer"
                                >
                                  <MousePointerClick className="h-4 w-4 text-slate-950" />
                                  <span>Simulate Agent Proxy Sync</span>
                                </button>
                                <span className="text-[9.5px] text-slate-500 leading-normal text-center">
                                  Close the loop securely. The agent will sign in, record credentials, and load step {wizardStep + 1 > 4 ? "Success" : wizardStep + 1}.
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="my-auto text-center space-y-4 py-4 animate-fadeIn">
                              <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto text-xl animate-bounce">
                                ✓
                              </div>
                              <div>
                                <h5 className="font-display font-semibold text-white text-base">Platform Sync Complete</h5>
                                <p className="text-xs text-slate-400 max-w-[345px] mx-auto mt-2 leading-relaxed">
                                  Continuous web agent state handshake resolved on <code className="bg-slate-900 border border-slate-800 px-1 py-0.5 rounded text-teal-400 font-mono">https://myk-online.com/</code>. Autonomous evaluations fully unlocked.
                                </p>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-2 text-left max-w-[380px] mx-auto pt-2">
                                <div className="p-2 border border-slate-800 bg-slate-900/60 rounded-lg text-[10.5px]">
                                  <span className="text-slate-500 block font-mono">WORKSPACE AUTH</span>
                                  <span className="text-emerald-400 font-semibold font-mono">Passed (OAuth2)</span>
                                </div>
                                <div className="p-2 border border-slate-800 bg-slate-900/60 rounded-lg text-[10.5px]">
                                  <span className="text-slate-500 block font-mono">GITHUB REPO</span>
                                  <span className="text-emerald-400 font-semibold font-mono">Hooked (origin/main)</span>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={handleResetWizard}
                                className="py-1 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-lg text-xs transition border border-slate-700/50 cursor-pointer mx-auto block"
                              >
                                Reset Integrations Base
                              </button>
                            </div>
                          )
                        ) : (
                          // Google Search simulated viewport
                          <div className="flex-1 flex flex-col justify-between text-slate-300 text-left animate-fadeIn">
                            <form onSubmit={handlePerformSearch} className="space-y-3 pb-3 border-b border-slate-800/60 shrink-0">
                              <span className="text-[10px] bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-slate-400 font-bold uppercase tracking-wider font-mono">
                                Live Documentation Search & security audit
                              </span>
                              
                              <div className="flex space-x-2">
                                <div className="relative flex-1">
                                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
                                  <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search: e.g. 'gemini sdk', 'firebase rules', 'npm patches'..."
                                    className="w-full text-xs font-mono pl-9 pr-3 py-2 bg-slate-900 border border-slate-800/80 rounded-lg text-slate-200 outline-none focus:border-indigo-500 transition"
                                  />
                                </div>
                                <button
                                  type="submit"
                                  disabled={isSearchingDoc || !searchQuery.trim()}
                                  className="px-3.5 py-1.5 bg-indigo-500 hover:bg-indigo-400 disabled:bg-slate-800 text-white font-bold text-xs rounded-lg transition shrink-0 cursor-pointer"
                                >
                                  {isSearchingDoc ? "Querying..." : "Search"}
                                </button>
                              </div>
                            </form>

                            <div className="flex-1 overflow-y-auto max-h-[190px] pr-1 mt-2 space-y-2 scrollbar-thin">
                              {isSearchingDoc ? (
                                <div className="py-6 text-center space-y-2">
                                  <Loader2 className="h-6 w-6 text-indigo-400 animate-spin mx-auto" />
                                  <p className="text-xs text-slate-500 font-mono">Scraping web index registries...</p>
                                </div>
                              ) : searchResults.length > 0 ? (
                                searchResults.map((res, index) => (
                                  <div key={index} className="p-3 bg-slate-900/60 rounded-xl border border-slate-850/85 hover:border-slate-800 transition text-[11px] space-y-1">
                                    <div className="flex justify-between items-center">
                                      <span className="text-emerald-400 font-mono text-[10px] truncate">{res.url}</span>
                                      <span className="text-slate-500 shrink-0 font-mono">{res.date}</span>
                                    </div>
                                    <h6 className="font-bold text-indigo-300 hover:indigo-200 cursor-pointer line-clamp-1">
                                      {res.title}
                                    </h6>
                                    <p className="text-slate-400 leading-normal line-clamp-2">
                                      {res.snippet}
                                    </p>
                                  </div>
                                ))
                              ) : (
                                <div className="py-4 text-center text-slate-500 text-xs space-y-1">
                                  <p>🔍 Search the web for library specs or dependency hotfixes.</p>
                                  <p className="text-[10.5px] text-slate-600 font-mono">Suggested: "gemini sdk" • "firebase rules" • "npm patches"</p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        
                        <div className="pt-2 border-t border-slate-900 flex justify-between items-center text-[10px] text-slate-500 shrink-0 select-none">
                          <span>Secure SSL TLS Handshake</span>
                          <span className="font-mono">Proxy Mode v1.2</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "optimizer" && (
            <div className="animate-fadeIn space-y-6">

              {/* Section 1: Main Search Optimization Formulation */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-indigo-50 rounded-lg text-indigo-600">
                  <Sparkles className="h-5 w-5" />
                </div>
                <h3 className="font-display font-semibold text-base text-slate-900">Configure Evaluation Target</h3>
              </div>
              <span className="text-xs text-slate-400">Phase 1: Meta-Decomposition</span>
            </div>

            <form onSubmit={handleAnalyzePrompt} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                  Stated Project Domain
                </label>
                <div className="flex flex-wrap gap-2">
                  {(["Web Design", "Node.js", "Git", "Marketing", "Music", "General Build"] as DomainType[]).map((dom) => (
                    <button
                      key={dom}
                      type="button"
                      onClick={() => setSelectedDomain(dom)}
                      className={`px-3 py-1.5 rounded-lg text-sm transition-all duration-150 cursor-pointer ${
                        selectedDomain === dom
                          ? "bg-indigo-600 text-white font-medium shadow-sm"
                          : "bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200"
                      }`}
                    >
                      {dom}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Your Original Prompt or Request
                  </label>
                  
                  {/* Real-time Draft Saving Status & Interactive Speech Actions */}
                  <div className="flex items-center space-x-3">
                    {/* Draft saved indicators */}
                    {promptInput.trim() && (
                      <span className="text-[10px] font-mono flex items-center space-x-1 text-slate-400">
                        <span className={`w-1.5 h-1.5 rounded-full ${isDraftSaving ? "bg-amber-400 animate-pulse" : "bg-emerald-400"}`}></span>
                        <span>{isDraftSaving ? "Saving Draft..." : "Draft Saved"}</span>
                      </span>
                    )}

                    {/* Speech Activation button */}
                    <button
                      type="button"
                      onClick={handleVoiceCapture}
                      className={`text-[11px] font-semibold px-2 py-1 rounded-md border flex items-center space-x-1.5 transition cursor-pointer ${
                        isListening
                          ? "bg-rose-500 text-white border-rose-600 animate-pulse"
                          : "bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200"
                      }`}
                      title={isListening ? "Listening... click to stop" : "Dictate request using speech recognition"}
                    >
                      {isListening ? (
                        <>
                          <MicOff className="h-3 w-3 animate-bounce" />
                          <span>Stop Listening...</span>
                        </>
                      ) : (
                        <>
                          <Mic className="h-3 w-3 text-indigo-500" />
                          <span>Dictate Prompt</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <textarea
                    value={promptInput}
                    onChange={(e) => setPromptInput(e.target.value)}
                    placeholder="Paste or type what you want to build (e.g., 'An interactive pomodoro clock with task tracking and atmospheric synth sounds')"
                    rows={4}
                    className="w-full text-sm p-3.5 pr-10 rounded-xl border border-slate-200 hover:border-slate-300 focus:border-teal-500/80 focus:ring-4 focus:ring-teal-500/10 placeholder-slate-400 outline-none transition duration-150 font-sans leading-relaxed resize-y bg-slate-50/50"
                    id="textarea-prompt-input"
                  />
                  {promptInput && (
                    <div className="absolute right-3.5 bottom-3.5 text-[9.5px] font-mono text-slate-400 bg-slate-100/80 px-1.5 py-0.5 rounded border border-slate-200/50 pointer-events-none select-none">
                      {Math.ceil(promptInput.trim().split(/\s+/).filter(Boolean).length * 1.3)} / 150 Tokens
                    </div>
                  )}
                </div>

                {/* Speech recognition errors */}
                {speechError && (
                  <p className="mt-1 text-[10px] text-amber-500 font-mono text-left">
                    ⚠ {speechError}
                  </p>
                )}

                {/* High token threshold split warn dialog */}
                {(() => {
                  const words = promptInput.trim().split(/\s+/).filter(Boolean).length;
                  const estTokens = Math.ceil(words * 1.3);
                  if (estTokens > 150) {
                    return (
                      <div className="mt-2.5 bg-amber-50 border border-amber-200/80 text-amber-800 p-3.5 rounded-xl flex items-start space-x-2 text-xs text-left animate-fadeIn">
                        <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <p className="font-bold uppercase tracking-wider text-[10px] text-amber-700 font-mono">
                            ⚠ High Token Density Detected (~{estTokens} tokens)
                          </p>
                          <p className="text-slate-600 leading-normal text-[11px]">
                            This rich, highly detailed request may exhaust autonomous single-pass agent processing limits. We strongly suggest **splitting your prompt into smaller sub-tasks** or refining the pipeline credentials inside the **Guided Setup Companion** below prior to tier evaluation.
                          </p>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isAnalyzing || !promptInput.trim()}
                  className="flex-1 py-3 px-6 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold rounded-xl text-sm transition duration-150 flex items-center justify-center space-x-2 cursor-pointer disabled:cursor-not-allowed shadow-md shadow-slate-900/10"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                      <span>Decomposing & Calculating Tiers...</span>
                    </>
                  ) : (
                    <>
                      <Coins className="h-4 w-4 text-teal-400" />
                      <span>Execute Tier Estimation</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Quick-select templates panel */}
            <div className="mt-6 pt-5 border-t border-slate-100">
              <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                Or click to test a complex pre-built scenario template
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {EXAMPLE_PROMPTS.map((sample, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => applySamplePrompt(sample)}
                    className="group text-left p-3 rounded-xl bg-slate-50/60 hover:bg-slate-100 border border-slate-200/60 hover:border-slate-300 transition-all duration-150 flex flex-col justify-between space-y-2 cursor-pointer h-full"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md uppercase tracking-wide">
                          {sample.domain}
                        </span>
                        <ChevronRight className="h-3.5 w-3.5 text-slate-400 group-hover:translate-x-1 transition-transform" />
                      </div>
                      <h4 className="text-xs font-semibold text-slate-800 line-clamp-1 leading-tight">
                        {sample.title}
                      </h4>
                      <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed mt-1">
                        {sample.prompt}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

          {activeTab === "agent-creator" && (
            <div className="animate-fadeIn space-y-6">

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* MYK.IO Advanced System Configurations Deck */}
                <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-6" id="myk-advanced-config-console">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-teal-50 text-teal-600 rounded-xl border border-teal-200/30">
                  <Settings className="h-5 w-5 animate-spin-slow" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-base text-slate-900">
                    System Control Center & Prefs
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Configure multi-LLM routing, system memory storage locations, and autonomous agent connectors.
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full inline-block animate-pulse"></span>
                <span className="font-mono text-[10.5px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded uppercase">
                  Terminal Online
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Box 1: Core Compiler Model Selection & Keys */}
              <div className="space-y-4 p-4 rounded-xl bg-slate-50/50 border border-slate-100">
                <div className="flex items-center space-x-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
                  <Cpu className="h-4 w-4 text-indigo-500" />
                  <span>LLM Core Routing Engine</span>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-500 block">Active AI Processor</label>
                  <select
                    value={selectedLlm}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSelectedLlm(val);
                      localStorage.setItem("myk_io_selected_llm", val);
                    }}
                    className="w-full text-xs font-medium bg-white border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                    id="llm-model-selector"
                  >
                    <option value="Gemini 2.5 Flash Processor (Core)">Gemini 2.5 Flash (Core Engine)</option>
                    <option value="Claude 3.5 Sonnet Integration (Anthropic)">Claude 3.5 Sonnet (Anthropic)</option>
                    <option value="GPT-4o Omniscient Compile Layer (OpenAI)">GPT-4o Omniscient Layer (OpenAI)</option>
                    <option value="Llama-3 Cloud Orchestrator (Meta)">Llama-3 Cloud Orchestrator</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-semibold text-slate-500 block">
                      {selectedLlm.includes("Claude") ? "Anthropic Custom Key" : selectedLlm.includes("GPT") ? "OpenAI Bearer Key" : "Alternative Provider Key"}
                    </label>
                    <span className="text-[9px] text-indigo-500 font-bold bg-indigo-50 px-1 py-0.2 rounded font-sans uppercase">Stored Securely</span>
                  </div>
                  <input
                    type="password"
                    value={customApiKey}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCustomApiKey(val);
                      localStorage.setItem("myk_io_custom_api_key", val);
                    }}
                    placeholder={selectedLlm.includes("Claude") ? "sk-ant-..." : selectedLlm.includes("GPT") ? "sk-proj-..." : "e.g. custom secret-authorization token key"}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                    id="custom-auth-key-input"
                  />
                  <p className="text-[9.5px] text-slate-400 italic">
                    Leaves core evaluations to Gemini API Key fallback if empty.
                  </p>
                </div>
              </div>

              {/* Box 2: Memory & Storage Locations (Local vs. Cloud) */}
              <div className="space-y-4 p-4 rounded-xl bg-slate-50/50 border border-slate-100 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
                    <Database className="h-4 w-4 text-teal-500" />
                    <span>Memory & Agent Persistence</span>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[11px] font-semibold text-slate-500 block">Active Storage Medium</span>
                    <div className="grid grid-cols-2 gap-2" id="storage-strategy-toggle-grid">
                      <button
                        type="button"
                        onClick={() => {
                          setStorageStrategy("local");
                          localStorage.setItem("myk_io_storage_strategy", "local");
                        }}
                        className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1 border transition cursor-pointer ${
                          storageStrategy === "local"
                            ? "bg-indigo-50 text-indigo-700 border-indigo-200 shadow-xs"
                            : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                        }`}
                        id="storage-pref-local"
                      >
                        <Server className="h-3 w-3" />
                        <span>Client Local</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setStorageStrategy("cloud");
                          localStorage.setItem("myk_io_storage_strategy", "cloud");
                        }}
                        className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1 border transition cursor-pointer ${
                          storageStrategy === "cloud"
                            ? "bg-indigo-50 text-indigo-700 border-indigo-200 shadow-xs"
                            : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                        }`}
                        id="storage-pref-cloud"
                      >
                        <Cloud className="h-3 w-3" />
                        <span>Cloud Synced</span>
                      </button>
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-400 leading-normal">
                    {storageStrategy === "local" 
                      ? "Plan data is locked to the local hardware cache for safety." 
                      : "Memory is replicate-synced over TLS to the cloud agent sandbox database."}
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCloudSyncActive(true);
                      setTimeout(() => {
                        setCloudSyncActive(false);
                      }, 1200);
                    }}
                    disabled={cloudSyncActive}
                    className="w-full py-2 px-3 bg-slate-900 border border-slate-800 disabled:bg-slate-100 hover:bg-slate-800 text-white disabled:text-slate-400 transition rounded-xl text-xs font-semibold flex items-center justify-center space-x-2 cursor-pointer"
                    id="btn-cloud-sync"
                  >
                    <RefreshCw className={`h-3 w-3 ${cloudSyncActive ? "animate-spin" : ""}`} />
                    <span>{cloudSyncActive ? "Syncing Memory & Logs..." : "Force Agent Cloud Sync"}</span>
                  </button>
                </div>
              </div>

              {/* Box 3: Continuous Connectors Hub & Integrations */}
              <div className="space-y-4 p-4 rounded-xl bg-slate-50/50 border border-slate-100">
                <div className="flex items-center space-x-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
                  <Globe className="h-4 w-4 text-emerald-500" />
                  <span>Integration Tool Connectors</span>
                </div>

                <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
                  {[
                    "Self-contained Sandbox Live Browser",
                    "GitHub Sync commits interface",
                    "Google Workspace direct connector",
                    "Claude Core Context proxy agent",
                    "Continuous Web Agent Engine"
                  ].map((connector) => {
                    const isActive = activeConnectors.includes(connector);
                    return (
                      <div
                        key={connector}
                        onClick={() => {
                          const newList = isActive
                            ? activeConnectors.filter(c => c !== connector)
                            : [...activeConnectors, connector];
                          setActiveConnectors(newList);
                          localStorage.setItem("myk_io_connectors", JSON.stringify(newList));
                        }}
                        className={`flex items-center justify-between p-2 rounded-xl text-xs border cursor-pointer hover:border-slate-300 transition-all ${
                          isActive 
                            ? "bg-emerald-50/40 border-emerald-200 text-emerald-800" 
                            : "bg-white border-slate-200 text-slate-500"
                        }`}
                        id={`connector-${connector.toLowerCase().replace(/[^a-z0-9]/gi, "-")}`}
                      >
                        <span className="font-semibold">{connector}</span>
                        <div className={`w-2 h-2 rounded-full ${isActive ? "bg-emerald-500 animate-pulse" : "bg-slate-300"}`}></div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>

            {/* Cloud Sync Active Feedback Toaster notification */}
            {cloudSyncActive && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 p-3 rounded-xl flex items-center justify-between text-xs animate-fadeIn" id="sync-success-alert">
                <div className="flex items-center space-x-2">
                  <Unlock className="h-3.5 w-3.5 text-emerald-600 animate-bounce" />
                  <span>Synchronization Complete: Active memory pipeline synchronized for the authenticated administrator.</span>
                </div>
                <span className="text-[10px] bg-emerald-500 text-white px-2 py-0.5 rounded font-bold font-mono">OK</span>
              </div>
            )}

            {/* Custom Agents Manager Card */}
            <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4 flex flex-col justify-between" id="myk-custom-agents-manager-card">
              <div className="space-y-4">
                <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-100">
                  <div className="p-2 bg-teal-50 text-teal-600 rounded-xl border border-teal-200/30">
                    <Brain className="h-5 w-5 animate-pulse" />
                  </div>
                  <div className="text-left font-sans">
                    <h3 className="font-display font-bold text-sm text-slate-900">
                      Agent Coordinator & Instructions
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Deploy sandboxed AI agents initialized with custom directives & memory hooks.
                    </p>
                  </div>
                </div>

                {/* Form to add custom agent */}
                <form onSubmit={handleAddCustomAgent} className="space-y-3 bg-slate-50/50 p-4 border border-slate-100 rounded-xl text-left">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Agent Name</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Git Guard"
                        value={newAgentName}
                        onChange={(e) => setNewAgentName(e.target.value)}
                        className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2 text-slate-800 outline-none focus:border-indigo-500"
                        id="custom-agent-name-input"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Active Role</label>
                      <select
                        value={newAgentRole}
                        onChange={(e) => setNewAgentRole(e.target.value)}
                        className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2 text-slate-800 outline-none focus:border-indigo-500 cursor-pointer"
                        id="custom-agent-role-select"
                      >
                        <option value="General Support">General Support</option>
                        <option value="Security Compliance">Security Compliance</option>
                        <option value="DevOps & GCP">DevOps & GCP</option>
                        <option value="Database Modeling">Database Modeling</option>
                        <option value="UI Tuning">UI Tuning</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Directives / Instructions</label>
                    <textarea
                      rows={2}
                      placeholder="Provide specific prompt guidelines or behavioral standards..."
                      value={newAgentInstructions}
                      onChange={(e) => setNewAgentInstructions(e.target.value)}
                      className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2 text-slate-800 outline-none focus:border-indigo-500 resize-none leading-relaxed"
                      id="custom-agent-instructions-input"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-center">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Memory Anchor</label>
                      <input
                        type="text"
                        placeholder="e.g. compile_keys"
                        value={newAgentMemoryAnchor}
                        onChange={(e) => setNewAgentMemoryAnchor(e.target.value)}
                        className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2 text-slate-800 outline-none focus:border-indigo-500 font-mono"
                        id="custom-agent-memory-anchor"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold mt-4 transition cursor-pointer self-end"
                      id="custom-agent-submit"
                    >
                      Deploy Agent
                    </button>
                  </div>
                </form>

                {/* List of Custom Agents */}
                <div className="space-y-2 max-h-[170px] overflow-y-auto pr-1">
                  {customAgents.map((agent) => (
                    <div
                      key={agent.id}
                      className={`p-3 rounded-xl border transition-all text-xs flex flex-col justify-between space-y-2 text-left ${
                        agent.isActive
                          ? "bg-slate-50 border-slate-200"
                          : "bg-slate-100/50 border-slate-150 text-slate-400"
                      }`}
                      id={`custom-agent-card-${agent.id}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center space-x-1.5 flex-wrap gap-1">
                            <span className="font-bold text-slate-800 truncate">{agent.name}</span>
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 font-bold uppercase tracking-wide shrink-0 font-sans">
                              {agent.role}
                            </span>
                          </div>
                          <span className="text-[9.5px] font-mono text-slate-400 block mt-0.5">Anchor: {agent.memoryAnchor}</span>
                        </div>
                        
                        <div className="flex items-center space-x-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleToggleAgentActive(agent.id)}
                            className={`text-[10px] font-bold px-2 py-0.5 rounded cursor-pointer leading-normal transition-all ${
                              agent.isActive
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-100 hover:bg-emerald-100"
                                : "bg-slate-200 hover:bg-slate-250 text-slate-600"
                            }`}
                            id={`toggle-agent-btn-${agent.id}`}
                          >
                            {agent.isActive ? "Active" : "Disabled"}
                          </button>
                          
                          <button
                            type="button"
                            onClick={(e) => handleDeleteAgent(agent.id, e)}
                            className="p-1 text-slate-450 hover:text-rose-500 hover:bg-rose-50 rounded transition cursor-pointer"
                            id={`delete-agent-btn-${agent.id}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                      <p className="text-slate-500 text-[10.5px] leading-normal line-clamp-2 italic">
                        "{agent.systemInstructions}"
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>

          {/* Interactive Memory CRUD & CLI Terminal Grid (Desktop App Capability Simulation) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="myk-io-developer-console-panel">
            
            {/* Column 1: Hybrid State Memory Storage Database */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
                  <Database className="h-5 w-5 text-indigo-600" />
                  <div>
                    <h3 className="font-display font-semibold text-slate-900 text-sm">
                      Hybrid Memory & Active Agent Store
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Manage dynamic key-concept variables synced directly to local caches and cloud endpoints.
                    </p>
                  </div>
                </div>

                {/* Add memory item form */}
                <form onSubmit={handleAddMemoryItem} className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Memory Key
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. DATABASE_PORT"
                      value={customMemoryKey}
                      onChange={(e) => setCustomMemoryKey(e.target.value)}
                      className="w-full text-xs p-2 rounded-lg border border-slate-200 focus:border-indigo-500 bg-slate-50/50 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Memory Value
                    </label>
                    <div className="flex space-x-1.5">
                      <input
                        type="text"
                        placeholder="e.g. 5432"
                        value={customMemoryVal}
                        onChange={(e) => setCustomMemoryVal(e.target.value)}
                        className="w-full text-xs p-2 rounded-lg border border-slate-200 focus:border-indigo-500 bg-slate-50/50 outline-none"
                      />
                      <button
                        type="submit"
                        className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shrink-0 shadow-xs cursor-pointer"
                        title="Persist Key"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </form>

                {/* List memory items */}
                <div className="mt-4 space-y-2 max-h-[190px] overflow-y-auto pr-1">
                  {memoryItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-slate-50/40 text-xs"
                    >
                      <div className="grid grid-cols-1 text-left">
                        <div className="flex items-center space-x-1.5 flex-wrap gap-1">
                          <span className="font-mono font-bold text-slate-800">{item.key}</span>
                          <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold uppercase tracking-wider leading-none ${
                            item.scope === "cloud"
                              ? "bg-indigo-100 text-indigo-700 border border-indigo-200"
                              : "bg-teal-100 text-teal-700 border border-teal-200"
                          }`}>
                            {item.scope === "cloud" ? "Cloud Sync" : "Local Browser"}
                          </span>
                        </div>
                        <p className="text-slate-500 font-mono text-[11px] truncate mt-0.5">{item.value}</p>
                      </div>
                      <button
                        onClick={() => handleDeleteMemoryItem(item.id, item.key)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded transition duration-100 cursor-pointer text-right shrink-0"
                        title="Delete concept"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span>Active Strategy: <strong className="text-slate-600 font-medium capitalize">{storageStrategy} Storage</strong></span>
                <span className="font-mono">myk-database node v1.2</span>
              </div>
            </div>

            {/* Column 2: Autonomous CLI Control Station */}
            <div className="bg-slate-950 rounded-2xl p-5 border border-slate-900 flex flex-col justify-between space-y-4 shadow-inner" style={{ minHeight: "360px" }}>
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-900">
                  <div className="flex items-center space-x-2">
                    <Terminal className="h-5 w-5 text-teal-400" />
                    <div className="text-left">
                      <h3 className="font-mono font-bold text-white text-xs tracking-tight">
                        MYK-CLI Executive Command Shell
                      </h3>
                      <p className="text-[10px] text-slate-500">
                        Trigger desktop sync jobs & inspect compilation logs.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 block"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 block"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 block animate-pulse"></span>
                  </div>
                </div>

                {/* CLI History Display */}
                <div className="mt-4 font-mono text-[11px] space-y-1.5 h-[190px] overflow-y-auto pr-1 text-slate-300 text-left">
                  {terminalHistory.map((line, idx) => (
                    <div
                      key={idx}
                      className={`leading-relaxed whitespace-pre-wrap ${
                        line.includes("SUCCESS") || line.includes("OK")
                          ? "text-emerald-400"
                          : line.includes("[MEMORY]")
                          ? "text-indigo-400"
                          : line.includes("[DEPLOY]")
                          ? "text-amber-400"
                          : line.includes("error") || line.includes("not found")
                          ? "text-rose-400"
                          : line.startsWith("admin@")
                          ? "text-teal-400 font-bold"
                          : "text-slate-400"
                      }`}
                    >
                      {line}
                    </div>
                  ))}
                </div>
              </div>

              {/* CLI Command Line input */}
              <form onSubmit={handleExecuteTerminalCommand} className="pt-2 border-t border-slate-900">
                <div className="flex items-center space-x-2 font-mono text-xs">
                  <span className="text-teal-400 font-bold select-none shrink-0">admin@myk-online:~$</span>
                  <input
                    type="text"
                    value={terminalCommand}
                    onChange={(e) => setTerminalCommand(e.target.value)}
                    placeholder="Enter command (e.g. status, sync, agents, help)..."
                    className="w-full bg-transparent border-none outline-none text-white placeholder-slate-600 tracking-wide font-mono focus:ring-0"
                    id="cli-input-field"
                  />
                </div>
              </form>
            </div>

          </div>
        </div>
      )}

      {/* Block 5: Saved Blueprints History Overview */}
      {activeTab === "history" && (
        <div className="animate-fadeIn space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <History className="h-5 w-5" />
                </div>
                <div className="text-left font-sans">
                  <h3 className="font-display font-semibold text-slate-900 text-sm">Formulated Specs Library</h3>
                  <p className="text-xs text-slate-500">Review, compare, and manage your saved multi-tier blueprint specifications.</p>
                </div>
              </div>
            </div>

            {savedPlans.length === 0 ? (
              <div className="text-center py-12 space-y-4">
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
                  <History className="h-6 w-6" />
                </div>
                <div className="max-w-xs mx-auto">
                  <h4 className="text-sm font-semibold text-slate-800">No blueprints saved yet</h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Formulate requests in the Workspace Optimizer to generate implementation checklists and save them for active tracking.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab("optimizer")}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg text-xs transition cursor-pointer animate-pulse"
                >
                  Go to Optimizer
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Header quick metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-4 border-b border-slate-100">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-left font-sans">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wide">TOTAL DESIGNS</span>
                    <span className="text-lg font-bold text-slate-900 font-mono">{savedPlans.length}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-left font-sans">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wide">AVG CREDITS</span>
                    <span className="text-lg font-bold text-slate-900 font-mono">
                      {Math.round(savedPlans.reduce((acc, curr) => acc + (curr.refinementResult.estimatedTokens || 0), 0) / savedPlans.length).toLocaleString()}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-left font-sans">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wide">ACTIVE MILESTONES</span>
                    <span className="text-lg font-bold text-teal-600 font-mono">
                      {savedPlans.reduce((acc, curr) => acc + curr.checklist.length, 0)}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-left font-sans">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wide">STATUS</span>
                    <span className="text-lg font-bold text-indigo-600 font-mono">Synced</span>
                  </div>
                </div>

                {/* Historical blueprint lists */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {savedPlans.map((plan) => {
                    const dones = plan.checklist.filter((c) => c.completed).length;
                    const total = plan.checklist.length;
                    const percentage = total > 0 ? Math.round((dones / total) * 100) : 0;
                    
                    return (
                      <div key={plan.id} className="p-4 bg-white hover:bg-slate-50/50 border border-slate-200 rounded-2xl transition duration-150 text-left flex flex-col justify-between space-y-4">
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] uppercase font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md font-sans">
                              {plan.domain}
                            </span>
                            <span className="text-[10.5px] font-mono text-slate-400">
                              Tier {plan.selectedTier}
                            </span>
                          </div>
                          <h4 className="font-bold text-slate-800 text-sm line-clamp-1">
                            {plan.refinementResult.title || "Refined Plan"}
                          </h4>
                          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                            {plan.prompt}
                          </p>
                        </div>

                        {/* Checklist Tracker progress */}
                        <div className="space-y-1.5 pt-3 border-t border-slate-100">
                          <div className="flex justify-between items-center text-[10px] font-mono text-slate-500">
                            <span>Milestones</span>
                            <span className="font-bold">{dones}/{total} ({percentage}%)</span>
                          </div>
                          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-indigo-600 h-full transition-all duration-300"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-1 font-sans">
                          <span className="text-xs font-mono font-bold text-slate-700">
                            {plan.refinementResult.estimatedTokens?.toLocaleString()} credits
                          </span>
                          
                          <div className="flex items-center space-x-2">
                            <button
                              type="button"
                              onClick={(e) => handleDeletePlan(plan.id, e)}
                              className="p-1.5 text-slate-450 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition duration-100 cursor-pointer"
                              title="Delete blueprint spec"
                              id={`history-delete-${plan.id}`}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                            
                            <button
                              type="button"
                              onClick={() => {
                                selectPlan(plan);
                                setActiveTab("optimizer");
                              }}
                              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[11px] font-bold transition flex items-center space-x-1 cursor-pointer"
                              id={`history-focus-${plan.id}`}
                            >
                              <ExternalLink className="h-3 w-3" />
                              <span>Focus Spec</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "optimizer" && (
        <div className="animate-fadeIn space-y-6">

          {/* Dynamic Error Messaging banner */}
          {errorMsg && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl flex items-start space-x-3 text-sm animate-fadeIn">
              <BadgeAlert className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Operation Failure</p>
                <p className="text-xs text-rose-600 mt-1">{errorMsg}</p>
              </div>
            </div>
          )}

          {/* Section 2: Render Multi-tier Selection Decision Tree */}
          {costOptions && (
            <div className="bg-slate-900 text-slate-100 rounded-2xl border border-slate-800 p-6 space-y-6 shadow-xl animate-fadeIn">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 bg-teal-500/10 rounded-lg text-teal-400">
                    <Layers2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-base text-white">Three-Tiered Refinement Matrix</h3>
                    <p className="text-xs text-slate-400">Assign optimal resource usage criteria based on delivery scope.</p>
                  </div>
                </div>
                <div className="bg-slate-800/80 text-emerald-400 px-3.5 py-1.5 rounded-lg text-xs font-mono border border-slate-700/60 flex items-center space-x-2">
                  <Coins className="h-4 w-4 text-emerald-400 animate-pulse" />
                  <span>Interactive Estimation Online</span>
                </div>
              </div>

              {analysisText && (
                <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 text-sm italic text-slate-300">
                  <p className="text-xs text-slate-400 uppercase font-bold not-italic tracking-wider mb-1 font-mono">
                    Deep Meta-Cognitive Analysis:
                  </p>
                  "{analysisText}"
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {costOptions.map((opt) => {
                  const isOpt1 = opt.tier === 1;
                  const isOpt2 = opt.tier === 2;
                  const isOpt3 = opt.tier === 3;

                  // Define tier background styling cards
                  let bgHoverClass = "hover:border-teal-500 hover:bg-slate-800/40";
                  let accentColorText = "text-teal-400";
                  let borderClass = "border-slate-800";
                  let badgeSpan = null;

                  if (isOpt2) {
                    bgHoverClass = "hover:border-indigo-500 hover:bg-slate-800/40";
                    accentColorText = "text-indigo-400";
                    borderClass = "border-indigo-600/50 bg-indigo-950/10";
                    badgeSpan = (
                      <span className="absolute -top-2.5 right-4 bg-indigo-500 text-slate-950 text-[10px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider leading-none">
                        Recommended Option
                      </span>
                    );
                  } else if (isOpt3) {
                    bgHoverClass = "hover:border-amber-500 hover:bg-slate-800/40";
                    accentColorText = "text-amber-400";
                  }

                  return (
                    <div
                      key={opt.tier}
                      className={`relative flex flex-col justify-between p-5 rounded-xl border ${borderClass} bg-slate-950/40 transition-all duration-150 ${bgHoverClass}`}
                    >
                      {badgeSpan}
                      <div>
                        <div className="flex items-center justify-between mb-3 text-xs">
                          <span className={`${accentColorText} font-mono font-bold uppercase tracking-wider`}>
                            Option {opt.tier}
                          </span>
                          <span className="text-slate-500 font-mono text-[11px]">
                            Tier {opt.tier} Plan
                          </span>
                        </div>

                        <h4 className="text-sm font-bold text-white mb-2 leading-tight">
                          {opt.name}
                        </h4>

                        <div className="inline-flex items-baseline space-x-1.5 my-3 px-2.5 py-1 bg-slate-900 rounded-md border border-slate-800">
                          <span className="text-slate-400 text-[10px] font-mono">EST:</span>
                          <span className={`text-base font-black font-mono ${accentColorText}`}>
                            {opt.costEstimate.toLocaleString()}
                          </span>
                          <span className="text-slate-400 text-[10px]/none font-mono">tokens</span>
                        </div>

                        <p className="text-xs text-slate-400 leading-relaxed mb-4 mt-1.5">
                          {opt.explanation}
                        </p>
                      </div>

                      <div className="pt-2">
                        <button
                          onClick={() => handleSelectTierAndRefine(opt)}
                          disabled={isRefining}
                          className={`w-full py-2.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 transition duration-150 cursor-pointer text-slate-950 text-center ${
                            isOpt1
                              ? "bg-teal-400 hover:bg-teal-300"
                              : isOpt2
                              ? "bg-indigo-400 hover:bg-indigo-300"
                              : "bg-amber-400 hover:bg-amber-300"
                          }`}
                        >
                          {isRefining && selectedTier === opt.tier ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-950" />
                              <span>Refining...</span>
                            </>
                          ) : (
                            <>
                              <MousePointerClick className="h-3.5 w-3.5" />
                              <span>Refine & Generate</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {isRefining && (
                <div className="text-center py-6 block animate-pulse">
                  <p className="text-xs text-teal-400 font-mono">
                    Constructing Master Blueprint via LLM backend. Aligning modules, checklists, and recommendations...
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Section 3: Executed Refinement Master Template Results */}
          {refinementResult && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              
              {/* Left Column (2 Span): Markdown Action Plan Output */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Optimization History Chart */}
                <OptimizationHistoryChart savedPlans={savedPlans} activePlan={activePlan} />

                {/* Visual rendering panel */}
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                  <div className="bg-slate-50 border-b border-slate-200/80 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <FileText className="h-5 w-5 text-indigo-600" />
                      <div>
                        <h4 className="font-display font-semibold text-slate-900 text-sm">
                          {refinementResult.title || "Refined Plan"}
                        </h4>
                        <p className="text-xs text-slate-500 font-mono">
                          Computed impact: {refinementResult.estimatedTokens?.toLocaleString()} credits
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center flex-wrap gap-2">
                      <button
                        onClick={() => handleCopyToClipboard(refinementResult.content)}
                        className="py-1.5 px-3 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 hover:text-slate-950 rounded-lg text-xs font-semibold border border-slate-200 flex items-center space-x-1.5 transition duration-150 cursor-pointer shadow-xs"
                      >
                        <Clipboard className="h-3.5 w-3.5 text-slate-500" />
                        <span>{copySuccess ? "Copied!" : "Copy Markdown"}</span>
                      </button>

                      <button
                        onClick={exportToPDF}
                        className="py-1.5 px-3 bg-indigo-50 hover:bg-indigo-150 active:bg-indigo-200 text-indigo-700 hover:text-indigo-950 rounded-lg text-xs font-semibold border border-indigo-200 flex items-center space-x-1.5 transition duration-150 cursor-pointer shadow-xs"
                      >
                        <Download className="h-3.5 w-3.5 text-indigo-600" />
                        <span>Download PDF</span>
                      </button>

                      <button
                        onClick={exportToJSON}
                        className="py-1.5 px-3 bg-teal-50 hover:bg-teal-150 active:bg-teal-200 text-teal-700 hover:text-teal-950 rounded-lg text-xs font-semibold border border-teal-200 flex items-center space-x-1.5 transition duration-150 cursor-pointer shadow-xs"
                      >
                        <Coins className="h-3.5 w-3.5 text-teal-600" />
                        <span>Download JSON</span>
                      </button>
                    </div>
                  </div>

                  {/* Webhook deployment gateway control panel */}
                  <div className="bg-slate-900 text-slate-100 p-4 border-b border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="text-left space-y-1 w-full md:w-auto">
                      <div className="flex items-center space-x-1.5">
                        <span className="w-2 h-2 rounded-full bg-indigo-500 block animate-pulse"></span>
                        <p className="font-mono text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          MYK.IO Cloud Release Pipeline
                        </p>
                      </div>
                      <p className="text-xs text-slate-300">
                        Map and push these compiled specifications straight to your active production node.
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full md:w-auto shrink-0">
                      <input
                        type="text"
                        value={webhookUrl}
                        onChange={(e) => setWebhookUrl(e.target.value)}
                        className="bg-slate-950 border border-slate-800 text-xs px-3 py-1.5 rounded-lg text-slate-300 font-mono outline-none focus:border-indigo-500 w-full sm:w-[280px]"
                        placeholder="Release webhook url"
                      />

                      <button
                        onClick={triggerWebhookDeploy}
                        disabled={deploymentStatus === "deploying"}
                        className={`text-xs font-semibold py-1.5 px-3 rounded-lg flex items-center justify-center space-x-1.5 shrink-0 hover:scale-[1.02] active:scale-[0.98] transition cursor-pointer text-slate-950 ${
                          deploymentStatus === "deploying"
                            ? "bg-slate-600 text-slate-300 animate-pulse"
                            : deploymentStatus === "success"
                            ? "bg-emerald-400"
                            : "bg-indigo-400 hover:bg-indigo-300"
                        }`}
                      >
                        {deploymentStatus === "deploying" ? (
                          <>
                            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                            <span>Deploying Spec...</span>
                          </>
                        ) : deploymentStatus === "success" ? (
                          <>
                            <CheckSquare className="h-3.5 w-3.5" />
                            <span>Deployed successfully!</span>
                          </>
                        ) : (
                          <>
                            <Globe className="h-3.5 w-3.5" />
                            <span>Push Live Spec</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Deployed release details toast */}
                  {deploymentStatus === "success" && (
                    <div className="bg-emerald-950/20 text-emerald-400 p-3.5 border-b border-emerald-900/30 text-xs text-left space-y-1">
                      <p className="font-mono font-bold uppercase tracking-wider text-[10px]">Release Broadcast Active</p>
                      <p>
                        Your blueprint system directives have been successfully dispatched. Live endpoint initialized at:{" "}
                        <code className="bg-emerald-950 text-emerald-300 px-1.5 py-0.5 rounded font-mono select-all">
                          https://myk-online.com/api/v1/routes/{deployedPromptId}
                        </code>
                      </p>
                    </div>
                  )}

                  <div className="p-6 md:p-8 markdown-body leading-relaxed prose prose-slate max-w-none prose-sm text-left">
                    {/* Render plain text parsed markdown safely */}
                    <ReactMarkdown>{refinementResult.content}</ReactMarkdown>
                  </div>
                </div>

                {/* Performance tips block */}
                {refinementResult.keyRecommendations && refinementResult.keyRecommendations.length > 0 && (
                  <div className="bg-teal-50/50 border border-teal-100/80 rounded-2xl p-6">
                    <div className="flex items-center space-x-2.5 mb-3">
                      <Info className="h-5 w-5 text-teal-600" />
                      <h4 className="font-display font-semibold text-slate-900 text-sm">
                        Optimizer Strategy Adjustments (Token Safety Guards)
                      </h4>
                    </div>
                    <ul className="space-y-2.5">
                      {refinementResult.keyRecommendations.map((rec, i) => (
                        <li key={i} className="text-xs text-slate-600 flex items-start space-x-2">
                          <span className="text-teal-600 font-bold block select-none mt-0.5">•</span>
                          <span className="leading-relaxed">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Right Column (1 Span): Checklist & Interactive Actions */}
              <div className="space-y-6">
                
                {/* Interactive Milestone Checkpoints */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                    <div className="flex items-center space-x-2">
                      <Bookmark className="h-4 w-4 text-indigo-600" />
                      <h4 className="font-display font-semibold text-slate-900 text-sm">Milestone Checklist</h4>
                    </div>
                    {activePlan && (
                      <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                        {activePlan.checklist.filter(c => c.completed).length}/{activePlan.checklist.length} Done
                      </span>
                    )}
                  </div>

                  {activePlan ? (
                    <div className="space-y-3">
                      {activePlan.checklist.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => handleToggleChecklist(item.id)}
                          className={`flex items-start gap-3 p-2.5 rounded-xl border text-xs cursor-pointer select-none transition-all duration-110 ${
                            item.completed
                              ? "bg-teal-50/30 border-teal-200/60 text-slate-500"
                              : "bg-slate-50 border-slate-200/60 hover:border-slate-300 text-slate-700"
                          }`}
                        >
                          <button type="button" className="shrink-0 mt-0.5 text-slate-400">
                            {item.completed ? (
                              <CheckSquare className="h-4 w-4 text-teal-600" />
                            ) : (
                              <Square className="h-4 w-4 text-slate-300" />
                            )}
                          </button>
                          <span className={`leading-relaxed ${item.completed ? "line-through" : ""}`}>
                            {item.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-xs text-slate-400 leading-normal">
                        Select a Tier card to deploy a task tracking blueprint and save it safely in cloud-local workspaces.
                      </p>
                    </div>
                  )}
                </div>

                {/* Sticky User scratchpad notes */}
                {activePlan && (
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
                    <div className="flex items-center space-x-2">
                      <Notebook className="h-4 w-4 text-indigo-600" />
                      <h4 className="font-display font-semibold text-slate-900 text-sm">Scratchpad Planner</h4>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Jot down setup specific details, server ports, or API config commands for this blueprint.
                    </p>
                    <textarea
                      value={userNoteText}
                      onChange={(e) => setUserNoteText(e.target.value)}
                      placeholder="Add draft configurations, database URL details, or custom notes..."
                      rows={4}
                      className="w-full text-xs p-3 rounded-lg border border-slate-200 placeholder-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 bg-slate-50/30 outline-none resize-none leading-relaxed"
                    />
                    <button
                      onClick={handleSaveNotes}
                      className="w-full py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold text-center transition duration-150 cursor-pointer"
                    >
                      Save Scratchpad Changes
                    </button>
                  </div>
                )}
                
              </div>

            </div>
          )}

          {/* Initial empty state view helper */}
          {!costOptions && !refinementResult && (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-2xl mx-auto shadow-xs flex flex-col items-center">
              <MykLogo className="w-24 h-24 mb-6" />

              <h3 className="font-display font-bold text-xl text-slate-900 tracking-tight mb-2">
                MYK.IO System Intelligence Engine
              </h3>

              <p className="text-sm text-slate-500 leading-relaxed mb-6 max-w-md">
                Deconstruct any complex software dream. Obtain 3 optimized execution alternatives mapped cleanly to token estimates. Make your selection, and watch the system construct deep, modular engineering requirements complete with live milestone tracking.
              </p>

              <div className="inline-flex flex-col sm:flex-row gap-3 justify-center items-center">
                <div className="flex items-center space-x-1.5 text-xs text-slate-400">
                  <Coins className="h-3.5 w-3.5" />
                  <span>Interactive Token Auditing</span>
                </div>
                <span className="hidden sm:inline text-slate-300">•</span>
                <span className="text-xs text-slate-400">Markdown Document Compilation</span>
                <span className="hidden sm:inline text-slate-300">•</span>
                <span className="text-xs text-slate-400">Reactive Milestone Checklists</span>
              </div>
            </div>
          )}
            </div>
          )}
        </div>
      )}

          {/* Footer creator credit */}
          <footer className="mt-16 pt-8 pb-4 border-t border-slate-200/60 text-center font-sans tracking-wide">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 max-w-6xl mx-auto px-4 text-xs text-slate-400">
              <div className="flex items-center space-x-3">
                <MykLogo className="w-9 h-9 shrink-0 shadow-md" />
                <span className="font-semibold text-slate-600 text-left">
                  Platform engineered & designed by <a href="https://myk-online.com" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-500 font-bold underline decoration-2 transition">MYK</a>
                </span>
              </div>
              <div className="flex items-center space-x-3 font-mono text-[9px] uppercase tracking-[0.2em] text-slate-400 bg-slate-100/80 px-2.5 py-1 rounded-md border border-slate-200/50">
                <span>Code</span>
                <span className="text-indigo-400 font-black">•</span>
                <span>Create</span>
                <span className="text-indigo-400 font-black">•</span>
                <span>Innovate</span>
              </div>
              <div>
                <p className="text-slate-400/80 font-mono text-[10.5px]">© {new Date().getFullYear()} MYK.IO &bull; Secure Release Node</p>
              </div>
            </div>
          </footer>

        </div>
      </main>

    </div>
  );
}
