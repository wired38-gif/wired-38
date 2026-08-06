import express from "express";
import path from "path";
import crypto from "crypto";
import type { NextFunction, Request, Response } from "express";
import { GoogleGenAI, Type } from "@google/genai";
import { config as loadEnv } from "dotenv";
import { createServer as createViteServer } from "vite";

import fs from "fs";

loadEnv({ path: [".env.local", ".env"] });

// ─── Self-Registration Training Auth System ───────────────────────────────────

const DATA_DIR = path.join(process.cwd(), "data");
const ACCOUNTS_FILE = path.join(DATA_DIR, "accounts.json");

// Master invite code — anyone with this code can self-register
function getInviteCode(): string {
  return (process.env.INVITE_CODE ?? "ENTRATA2026").toUpperCase();
}

interface TraineeAccount {
  id: string;
  email: string;
  name: string;
  property: string;
  pin: string;          // 6-digit auto-generated
  createdAt: string;
  lastActiveAt: string;
  progress: Record<string, unknown>;
  completedWorkflows: string[];
}

type AccountStore = Record<string, TraineeAccount>; // keyed by email (lowercase)

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function loadAccounts(): AccountStore {
  try {
    ensureDataDir();
    if (fs.existsSync(ACCOUNTS_FILE)) {
      return JSON.parse(fs.readFileSync(ACCOUNTS_FILE, "utf-8")) as AccountStore;
    }
  } catch { /* ignore */ }
  return {};
}

function saveAccounts(store: AccountStore) {
  try {
    ensureDataDir();
    fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify(store, null, 2));
  } catch { /* ignore */ }
}

function generatePin(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

let accounts: AccountStore = loadAccounts();

// Global express setup
const app = express();
const PORT = Number(process.env.PORT || 3000);
const SESSION_COOKIE_NAME = "myk_io_session";
const SESSION_TTL_SECONDS = 8 * 60 * 60;

app.use(express.json());
app.set("trust proxy", 1);

type SessionPayload = {
  sub: string;
  exp: number;
};

function getAdminCredentials() {
  return {
    username: process.env.ADMIN_USERNAME,
    password: process.env.ADMIN_PASSWORD,
  };
}

function getAuthSecret() {
  return process.env.AUTH_SECRET || process.env.ADMIN_PASSWORD || "";
}

function isAuthConfigured() {
  const credentials = getAdminCredentials();
  return Boolean(credentials.username && credentials.password && getAuthSecret());
}

function isCursorApiConfigured() {
  return Boolean(process.env.CURSOR_API_KEY || process.env.CURSOR_API_TOKEN);
}

function hashValue(value: string) {
  return crypto.createHash("sha256").update(value).digest();
}

function constantTimeEqual(a: string, b: string) {
  return crypto.timingSafeEqual(hashValue(a), hashValue(b));
}

function signPayload(encodedPayload: string) {
  return crypto
    .createHmac("sha256", getAuthSecret())
    .update(encodedPayload)
    .digest("base64url");
}

function createSessionToken(username: string) {
  const payload: SessionPayload = {
    sub: username,
    exp: Date.now() + SESSION_TTL_SECONDS * 1000,
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encodedPayload}.${signPayload(encodedPayload)}`;
}

function parseCookies(cookieHeader: string | undefined) {
  const cookies: Record<string, string> = {};
  if (!cookieHeader) return cookies;

  for (const cookie of cookieHeader.split(";")) {
    const [name, ...valueParts] = cookie.trim().split("=");
    if (!name || valueParts.length === 0) continue;
    cookies[name] = decodeURIComponent(valueParts.join("="));
  }

  return cookies;
}

function verifySessionToken(token: string | undefined) {
  if (!token || !isAuthConfigured()) return false;

  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) return false;

  const expectedSignature = signPayload(encodedPayload);
  if (!constantTimeEqual(signature, expectedSignature)) return false;

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as SessionPayload;
    return typeof payload.sub === "string" && typeof payload.exp === "number" && payload.exp > Date.now();
  } catch {
    return false;
  }
}

function isAuthenticated(req: Request) {
  const cookies = parseCookies(req.headers.cookie);
  return verifySessionToken(cookies[SESSION_COOKIE_NAME]);
}

function buildSessionCookie(token: string, req: Request) {
  const secure = req.secure || process.env.NODE_ENV === "production";
  const parts = [
    `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}`,
    "HttpOnly",
    "SameSite=Lax",
    "Path=/",
    `Max-Age=${SESSION_TTL_SECONDS}`,
  ];
  if (secure) parts.push("Secure");
  return parts.join("; ");
}

function clearSessionCookie() {
  return `${SESSION_COOKIE_NAME}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`;
}

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!isAuthenticated(req)) {
    res.status(401).json({ error: "Authentication required." });
    return;
  }

  next();
}

// Lazy-loaded GoogleGenAI client to avoid crashes if the key isn't configured yet
let aiClient: GoogleGenAI | null = null;

function getAiClient() {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is not configured. Please add it in the Secrets panel.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// 1. API Endpoint: Check backend status and key configuration
app.get("/api/status", (req, res) => {
  const hasKey = !!process.env.GEMINI_API_KEY;
  res.json({
    status: "ok",
    hasApiKey: hasKey,
    hasCursorApiKey: isCursorApiConfigured(),
    authConfigured: isAuthConfigured(),
    authenticated: isAuthenticated(req),
    timestamp: new Date().toISOString(),
  });
});

app.post("/api/login", (req, res) => {
  if (!isAuthConfigured()) {
    res.status(503).json({
      error: "Admin authentication is not configured. Set ADMIN_USERNAME and ADMIN_PASSWORD on the server.",
    });
    return;
  }

  const { username, password } = req.body;
  const credentials = getAdminCredentials();
  const validUsername =
    typeof username === "string" &&
    typeof credentials.username === "string" &&
    constantTimeEqual(username, credentials.username);
  const validPassword =
    typeof password === "string" &&
    typeof credentials.password === "string" &&
    constantTimeEqual(password, credentials.password);

  if (!validUsername || !validPassword) {
    res.status(401).json({ error: "Invalid administrator credentials." });
    return;
  }

  const token = createSessionToken(credentials.username as string);
  res.setHeader("Set-Cookie", buildSessionCookie(token, req));
  res.json({ authenticated: true });
});

app.post("/api/logout", (req, res) => {
  res.setHeader("Set-Cookie", clearSessionCookie());
  res.json({ authenticated: false });
});

// 2. API Endpoint: Analyze Request and produce 3 options
app.post("/api/analyze-prompt", requireAuth, async (req, res) => {
  try {
    const { prompt, domain, selectedLlm } = req.body;
    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({ error: "A valid prompt string is required." });
    }

    const ai = getAiClient();

    const systemInstruction = `You are "TheOptimizer", a hyper-efficient, meta-cognitive AI Agent specializing in project decomposition, resource estimation, and prompt refinement strategy.
Your mission is to perform deep meta-cognitive analysis on the user's project request and assign three clear tiers of execution plans:
Option 1 (Low Cost): High-level revision prompt that achieves the core outcome with minimal tokens.
Option 2 (Balanced - Recommended): A balanced structural blueprint with concrete milestones, clear steps, and optimal token-to-reward ratio.
Option 3 (High Cost): Exhaustive engineering specification, rigorous edge cases, exact database schemas, and complete copy.

Generate a structured JSON output with:
1. "analysis": brief 1-2 sentence meta-analysis of the request's core challenge.
2. "options": an array of exactly 3 objects corresponding to Option 1, Option 2, and Option 3.
Each option must contain:
- "tier": 1, 2, or 3
- "name": String title (e.g., "Cost-Friendly Revision Prompt", "Master Blueprint Plan", "Deep-Dive Engineering Spec")
- "costEstimate": Positive integer (estimate in tokens/credits, e.g., 800 for Tier 1, 2500 for Tier 2, 8500 for Tier 3)
- "focus": Short phrase describing the main core focus (e.g., "High-Impact Core Blueprint", "Production Roadmap with Milestones", "Complete Technical Deep-Dive")
- "explanation": Brief summary of the level of detail the user will receive upon selecting this option.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Perform cost tier analysis on the following user request.
Contextual Domain info (optional): ${domain || "General Project Development"}.

User Request: "${prompt}"`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            analysis: {
              type: Type.STRING,
              description: "A professional, concise summary of the core challenge.",
            },
            options: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  tier: { type: Type.INTEGER },
                  name: { type: Type.STRING },
                  costEstimate: { type: Type.INTEGER },
                  focus: { type: Type.STRING },
                  explanation: { type: Type.STRING },
                },
                required: ["tier", "name", "costEstimate", "focus", "explanation"],
              },
            },
          },
          required: ["analysis", "options"],
        },
      },
    });

    const parsedData = JSON.parse(response.text || "{}");
    res.json(parsedData);
  } catch (err: any) {
    console.error("Error in analyze-prompt:", err);
    res.status(500).json({ error: err.message || "An unexpected error occurred during analysis." });
  }
});

// 3. API Endpoint: Execute / Refine Selected Option
app.post("/api/refine-prompt", requireAuth, async (req, res) => {
  try {
    const { prompt, tier, domain, optionData, selectedLlm } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required." });
    }
    if (!tier || ![1, 2, 3].includes(Number(tier))) {
      return res.status(400).json({ error: "Invalid tier. Must be 1, 2, or 3." });
    }

    const ai = getAiClient();

    let outputSchemaProperties: any = {
      title: { type: Type.STRING },
      content: { type: Type.STRING, description: "Actionable output written in professionally styled Markdown format." },
      estimatedTokens: { type: Type.INTEGER },
      milestones: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "An array of 4 to 8 clear milestone checklist steps parsed from the generated plan.",
      },
      keyRecommendations: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "List of 3 specific recommendations for minimizing token consumption during implementation.",
      },
    };

    let executionPrompt = "";

    // Parse model specific prompt styling adapters
    let llmAdapterStyle = "";
    if (selectedLlm) {
      if (selectedLlm.includes("Claude")) {
        llmAdapterStyle = `

[TARGET ENGINE IS ANTHROPIC CLAUDE 3.5 SONNET]
Please format the optimized prompt strictly leveraging Anthropic XML Tag structures:
- Wrap your system criteria in <system_instructions>...</system_instructions>.
- Wrap raw user requirements in <user_input_context>...</user_input_context>.
- Wrap safety guards or build limits in <safety_constraints>...</safety_constraints>.
This ensures maximum performance and minimal output hallucination on Claude.`;
      } else if (selectedLlm.includes("GPT")) {
        llmAdapterStyle = `

[TARGET ENGINE IS OPENAI GPT-4o]
Please format the optimized prompt using clear system role markers and direct schema layout directives to guide GPT-4o's reasoning tree:
- Prefix developer roles with "SYSTEM COMMAND:" or "USER ACTION:" block headings.
- Specify strict output key variables and JSON layout boundaries where relevant.`;
      } else if (selectedLlm.includes("Llama")) {
        llmAdapterStyle = `

[TARGET ENGINE IS META LLAMA-3]
Please format the optimized prompt using direct, authoritative instruction commands with semantic markers to maximize attention retention:
- Use explicit markdown headers for rules.
- Avoid descriptive words; use direct, compact command blocks.`;
      } else {
        llmAdapterStyle = `

[TARGET ENGINE IS GEMINI 2.5 FLASH]
Please format the optimized prompt leveraging native Gemini directives, parameters, and structured markdown lists to align with the core model's multimodal and token caching features.`;
      }
    }

    if (Number(tier) === 1) {
      executionPrompt = `You are "TheOptimizer". The user has selected Option 1 (Low Cost): "Cost-Friendly Revision Prompt".
Your objective is to rewrite the user's original request into a highly optimized, compact, but rich single prompt. This revision prompt MUST achieve the exact same functional outcome as their original, but contains specialized constraints, avoiding conversational fluff, to ensure maximum developer speed or minimal LLM tokens when fed into another agent.${llmAdapterStyle}

Original Prompt:
"${prompt}"

Your output must contain:
1. "title": "Cost-Friendly Prompt Revision"
2. "content": Write the prompt itself inside a block, clearly formatted in structured markdown. Add a brief description of how it reduces token overhead. Include a deployment tip linking files to the production gateway "https://myk-online.com/".
3. "milestones": Minimum of 4 task steps to build the simplified project.
4. "keyRecommendations": Tips for keeping build steps brief.`;
    } else if (Number(tier) === 2) {
      executionPrompt = `You are "TheOptimizer". The user has selected Option 2 (Balanced - Recommended): "TheMasterBlueprint".
Your objective is to draft a comprehensive, balanced execution plan. It should outline clean engineering Milestones, architecture layouts, and clear steps.${llmAdapterStyle}

Original Prompt:
"${prompt}"

Your output must contain:
1. "title": "The Master Blueprint"
2. "content": A fully articulated Markdown roadmap containing:
   - Architecture & Design Overview (and how to serve it securely at "https://myk-online.com/")
   - Optimal File Structure
   - Direct step-by-step code requirements or guidelines
   - Strategy to build this within a modest token footprint
3. "milestones": A rich sequence of 6 to 8 detailed milestone titles for their construction checklist.
4. "keyRecommendations": Technical optimization advice referencing deployment steps to link system memory via the "https://myk-online.com/" platform.`;
    } else {
      executionPrompt = `You are "TheOptimizer". The user has selected Option 3 (High Cost / Deep Dive): "TheDeepDiveDeepDive".
Your objective is to provide maximum extreme detail. It must be exhaustive. Include step-by-step implementation sequences, full mock schema designs, thorough defensive error handling strategies, and precise copy ideas.${llmAdapterStyle}

Original Prompt:
"${prompt}"

Your output must contain:
1. "title": "The Deep Dive Specification"
2. "content": An incredibly rich, comprehensive Markdown master draft including:
   - Detailed System Architecture & Flowchart representations in markdown (designed for hosting or triggering at "https://myk-online.com/")
   - Complete DB Schemas (tables, relationships, types)
   - Exhaustive Error Handling guide (edge cases, fallback handlers, UI overlays)
   - UX/UI Mock design copy & complete copy guides
3. "milestones": 8 highly descriptive development milestones for the checklist.
4. "keyRecommendations": High-performance optimizations and exact resource cost guards for cloud hosting. Include tips on deploying static assets to the MYK core gateway "https://myk-online.com/".`;
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: executionPrompt,
      config: {
        systemInstruction: `You are "TheOptimizer" (powered by MYK.IO), a hyper-focused AI resource-planning architect. You return beautifully crafted, structured Markdown in your content as well as clear checklist items. Always format responses in high-fidelity JSON following the response schema. Integrate mention of deploying optimized models to https://myk-online.com/ naturally.`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: outputSchemaProperties,
          required: ["title", "content", "estimatedTokens", "milestones", "keyRecommendations"],
        },
      },
    });

    const result = JSON.parse(response.text || "{}");
    res.json(result);
  } catch (err: any) {
    console.error("Error in refine-prompt:", err);
    res.status(500).json({ error: err.message || "An unexpected error occurred during execution." });
  }
});

// ─── Self-Registration Auth Endpoints ────────────────────────────────────────

// Check if email has an account
app.post("/api/auth/check-email", (req, res) => {
  const { email } = req.body as { email: string };
  if (!email) return res.status(400).json({ error: "Email required" });
  const key = email.trim().toLowerCase();
  const account = accounts[key];
  if (account) {
    return res.json({ exists: true, name: account.name, property: account.property });
  }
  return res.json({ exists: false });
});

// Register a new account with invite code
app.post("/api/auth/register", (req, res) => {
  const { inviteCode, email, name, property } = req.body as {
    inviteCode: string; email: string; name: string; property: string;
  };

  if (!inviteCode || inviteCode.trim().toUpperCase() !== getInviteCode()) {
    return res.status(401).json({ error: "Invalid invite code. Please check with your manager." });
  }
  if (!email || !name || !property) {
    return res.status(400).json({ error: "Name, email, and property are required." });
  }

  const key = email.trim().toLowerCase();
  if (accounts[key]) {
    return res.status(409).json({ error: "An account with that email already exists. Please log in instead." });
  }

  const pin = generatePin();
  accounts[key] = {
    id: crypto.randomUUID(),
    email: key,
    name: name.trim(),
    property: property.trim(),
    pin,
    createdAt: new Date().toISOString(),
    lastActiveAt: new Date().toISOString(),
    progress: {},
    completedWorkflows: [],
  };
  saveAccounts(accounts);

  return res.json({ success: true, pin, name: accounts[key].name, property: accounts[key].property });
});

// Log in with email + PIN
app.post("/api/auth/login", (req, res) => {
  const { email, pin } = req.body as { email: string; pin: string };
  if (!email || !pin) return res.status(400).json({ error: "Email and PIN required" });

  const key = email.trim().toLowerCase();
  const account = accounts[key];

  if (!account) return res.status(404).json({ error: "No account found for that email. Please register first." });
  if (account.pin !== pin.trim()) return res.status(401).json({ error: "Incorrect PIN. Check your welcome email." });

  account.lastActiveAt = new Date().toISOString();
  saveAccounts(accounts);

  return res.json({
    success: true,
    name: account.name,
    property: account.property,
    email: account.email,
    progress: account.progress,
    completedWorkflows: account.completedWorkflows,
  });
});

// Save progress (email + PIN in body for auth)
app.post("/api/account/progress", (req, res) => {
  const { email, pin, progress, completedWorkflows } = req.body as {
    email: string; pin: string;
    progress: Record<string, unknown>;
    completedWorkflows: string[];
  };
  const key = email?.trim().toLowerCase();
  const account = accounts[key];
  if (!account || account.pin !== pin?.trim()) {
    return res.status(401).json({ error: "Invalid credentials" });
  }
  account.progress = progress;
  account.completedWorkflows = completedWorkflows;
  account.lastActiveAt = new Date().toISOString();
  saveAccounts(accounts);
  return res.json({ saved: true });
});

// Admin: list all registered trainees (requires admin auth)
app.get("/api/admin/trainees", requireAuth, (req, res) => {
  const list = Object.values(accounts).map(a => ({
    name: a.name,
    email: a.email,
    property: a.property,
    pin: a.pin,
    createdAt: a.createdAt,
    lastActiveAt: a.lastActiveAt,
    completedWorkflows: a.completedWorkflows.length,
    workflowsStarted: Object.keys(a.progress).length,
  }));
  return res.json({ total: list.length, trainees: list });
});

// ─── Entrata AI Chat Endpoint ────────────────────────────────────────────────
const ENTRATA_SYSTEM_PROMPT = `You are "Entrata AI" — a friendly, expert virtual trainer for Entrata property management software. You help leasing agents, maintenance technicians, and property managers master Entrata quickly.

You have deep expertise in:
- All Entrata navigation paths and workflows
- Leasing: prospects, applications, move-ins, renewals, notice to vacate
- Maintenance: work orders, inspections, emergency procedures
- Financial: ledger, post charges, accept payments, delinquency management
- Reports: daily operations, occupancy, delinquency, lease expiration
- Resident services: portal setup, communications
- Property management terminology: SODA, NTV, PTE, income codes, ledger, MTM, etc.

WORKFLOW NAVIGATION PATHS (memorize these exactly):
- Create Prospect: Residents → Prospects → Add Prospect
- Process Application: Residents → Applicants → [Select] → Review Application
- Move-In: Residents → Prospects → [Select] → Finalize Lease → Financial Tab → Verify Balance → Move In Action → Enter Date/Fob → Save
- Notice to Vacate: Residents → Residents → [Select Resident] → Actions → Notice to Vacate
- Move-Out & SODA: Residents → Residents → [Select] → Actions → Move Out Resident → Financial Tab → Post Charges → Close Ledger → Generate SODA
- Lease Renewal: Residents → Residents → [Select] → Renewals → Create Renewal Offer
- Work Order: Services → Maintenance → Work Orders → Add Work Order → Select Unit → Category/Priority → Permission to Enter → Assign Tech → Submit
- Post Charge: Residents → [Select Resident] → Ledger Tab → Post Charge → Income Code → Amount/Date → Description → Post
- Accept Payment: Residents → [Select Resident] → Ledger Tab → Accept Payment → Method → Amount → Post → Print Receipt
- Daily Operations Report: Reports → Property Management → Daily Operations Report → Filter Property → Set Today → Generate
- Delinquency Report: Reports → Financial → Delinquency Report

KEY TERMS:
- SODA: Security Deposit Disposition Accounting — legal doc mailing security deposit deductions after move-out
- NTV: Notice to Vacate — resident's written intent to move out
- PTE: Permission to Enter — resident authorization for maintenance to enter without them present
- Income Code: Property-defined code categorizing financial transactions (RENT01, LATE01, PET01, etc.)
- Ledger: Full financial transaction history for a resident's account
- MTM: Month-to-Month lease — no fixed end date, usually at premium rent
- Economic Occupancy: % of potential gross rent actually collected (vs Physical Occupancy = units occupied)
- Make Ready: Process of preparing a vacant unit for next resident
- Adverse Action Letter: Required legal notice sent to denied applicants per FCRA

RESPONSE RULES:
1. Be concise and actionable — get to the answer fast
2. For navigation questions, always give the exact path in this format: Entrata → Module → Submenu → Action
3. When your answer relates to a specific workflow, end with: [NAVIGATE:workflow_id] where workflow_id is one of:
   create-prospect, process-application, move-in, notice-to-vacate, move-out, lease-renewal,
   create-work-order, emergency-work-order, unit-inspection, post-manual-fee, accept-payment,
   delinquency, daily-operations-report, occupancy-report, resident-portal-setup
4. Keep answers under 150 words unless a detailed step-by-step is explicitly requested
5. Use bullet points for multi-step answers
6. For legal/compliance questions (SODA timing, adverse action, etc.), note that state laws vary and they should verify locally`;

app.post("/api/entrata-chat", async (req, res) => {
  try {
    const { message, history = [] } = req.body as {
      message: string;
      history: Array<{ role: "user" | "model"; parts: Array<{ text: string }> }>;
    };

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Message is required." });
    }

    // Try Gemini if configured
    if (process.env.GEMINI_API_KEY) {
      const ai = getAiClient();
      const chat = ai.chats.create({
        model: "gemini-2.0-flash",
        config: { systemInstruction: ENTRATA_SYSTEM_PROMPT },
        history,
      });
      const response = await chat.sendMessage({ message });
      return res.json({ reply: response.text ?? "I couldn't generate a response. Please try again." });
    }

    // Fallback: keyword-based local knowledge
    const q = message.toLowerCase();
    let reply = "";

    if (q.includes("move-in") || q.includes("move in") || q.includes("movein")) {
      reply = "**Move-In Process:**\n1. Open the prospect profile: Residents → Prospects → [Select Name]\n2. Click **Finalize Lease** and verify all lease terms\n3. Go to **Financial Tab** — confirm balance is $0.00 or meets your move-in requirement\n4. Click **Actions → Move In**\n5. Enter the official move-in date and key/fob number\n6. Click **Save** ✓\n\n⚠️ Never complete a move-in without verifying the ledger balance first. [NAVIGATE:move-in]";
    } else if (q.includes("soda") || q.includes("security deposit")) {
      reply = "**SODA (Security Deposit Disposition Accounting):**\nThis is the legal document itemizing all deductions from a security deposit after move-out. It must be mailed to the resident's forwarding address within your state's mandated timeframe (typically 14–30 days — check your state law).\n\nTo generate: Resident Profile → Financial Tab → Generate SODA [NAVIGATE:move-out]";
    } else if (q.includes("work order") || q.includes("maintenance request")) {
      reply = "**Create a Work Order:**\nServices → Maintenance → Work Orders → Add Work Order\n\n Key fields:\n- **Priority**: Emergency (4hr), Urgent (24hr), Standard (3–5 days)\n- **Permission to Enter**: Always check if resident authorized entry\n- **Assign Tech**: Select or leave Unassigned for supervisor to dispatch [NAVIGATE:create-work-order]";
    } else if (q.includes("ntv") || q.includes("notice to vacate")) {
      reply = "**Notice to Vacate (NTV):**\nResidents → Residents → [Select Resident] → Actions → Notice to Vacate\n\nEnter the date notice was received, expected move-out date, and vacate reason. The system will automatically update the unit's availability on the leasing calendar. [NAVIGATE:notice-to-vacate]";
    } else if (q.includes("late fee") || q.includes("post charge") || q.includes("ledger")) {
      reply = "**Post a Manual Charge:**\nResident Profile → Ledger Tab → Post Charge\n\nSelect the correct **Income Code** (e.g., LATE01 for late fees), enter amount and date, add a description, then click Post Charge. The charge appears immediately on the resident portal. [NAVIGATE:post-manual-fee]";
    } else if (q.includes("delinquency") || q.includes("delinquent") || q.includes("past due")) {
      reply = "**Delinquency Management:**\nReports → Financial → Delinquency Report\n\nRun daily after the rent due date. Post late fees, generate Pay or Quit notices, and document all contact attempts in the resident's Notes. Escalate to eviction if unpaid after cure period. [NAVIGATE:delinquency]";
    } else if (q.includes("report") || q.includes("daily ops") || q.includes("occupancy")) {
      reply = "**Daily Operations Report:**\nReports → Property Management → Daily Operations Report → Select Property → Set Date to Today → Generate\n\nKey metrics: Occupancy %, Move-Ins/Move-Outs today, Delinquency, Open Work Orders. Run this every morning. [NAVIGATE:daily-operations-report]";
    } else if (q.includes("prospect") || q.includes("lead") || q.includes("new renter")) {
      reply = "**Add a New Prospect:**\nResidents → Prospects → Add Prospect\n\nFill in contact info, unit preference, desired move-in date, and — critically — the lead source. Sending the portal invite immediately speeds up the application process. [NAVIGATE:create-prospect]";
    } else if (q.includes("renewal") || q.includes("renew")) {
      reply = "**Lease Renewal:**\nResidents → Residents → [Select] → Renewals Tab → Create Renewal Offer\n\nStart outreach 90 days before lease end. Set new terms (Fixed-Term or MTM), send the offer, then countersign once the resident signs electronically. [NAVIGATE:lease-renewal]";
    } else if (q.includes("portal") || q.includes("online access") || q.includes("resident portal")) {
      reply = "**Send Resident Portal Invite:**\nResident Profile → Portal section → Send Portal Invite\n\nVerify the email address first! The link expires in 72 hours. Portal benefits include online rent payment, maintenance requests, lease documents, and community announcements. [NAVIGATE:resident-portal-setup]";
    } else if (q.includes("move-out") || q.includes("move out") || q.includes("moveout")) {
      reply = "**Move-Out Process:**\n1. Resident Profile → Actions → Move Out Resident\n2. Enter move-out date & forwarding address (required for SODA)\n3. Financial Tab → Post all move-out charges\n4. Click Close Ledger\n5. Generate SODA PDF and mail within state timeframe\n\n⚠️ Always document charges with photos before posting. [NAVIGATE:move-out]";
    } else if (q.includes("pte") || q.includes("permission to enter")) {
      reply = "**Permission to Enter (PTE):**\nThis authorizes maintenance staff to enter a unit without the resident present. Always check the PTE checkbox on a work order before entering — it's your legal protection.\n\nResident can grant PTE per-work-order or as a standing authorization on their profile. [NAVIGATE:create-work-order]";
    } else if (q.includes("income code") || q.includes("charge code")) {
      reply = "**Income Codes** classify financial transactions in Entrata. Common codes:\n- **RENT01** — Monthly Rent\n- **LATE01** — Late Fee\n- **PET01** — Pet Fee\n- **PARK01** — Parking\n- **CLEAN01** — Cleaning Fee\n- **UTIL01** — Utility Reconciliation\n\nUsing the wrong code misclassifies revenue in accounting. When in doubt, ask your manager. [NAVIGATE:post-manual-fee]";
    } else if (q.includes("application") || q.includes("screening") || q.includes("background")) {
      reply = "**Process an Application:**\nResidents → Applicants → [Select] → Run Screening\n\nScreening checks credit, criminal history, and eviction records. For denials, generate an **Adverse Action Letter** (legally required per FCRA). Verify income is at least 3× the monthly rent before approving. [NAVIGATE:process-application]";
    } else if (q.includes("inspect") || q.includes("make ready") || q.includes("punch list")) {
      reply = "**Unit Inspection:**\nServices → Inspections → Add Inspection\n\nSelect inspection type (Move-Out, Move-In, Make Ready), assign the unit and inspector. Complete the room-by-room checklist and photograph every damaged item. Submit to generate the inspection report PDF. [NAVIGATE:unit-inspection]";
    } else {
      reply = "I'm your Entrata AI assistant! I can help with:\n\n• **Workflows** — move-in, move-out, work orders, renewals\n• **Navigation** — exact paths like Residents → Prospects → Add Prospect\n• **Terms** — SODA, NTV, PTE, income codes, ledger\n• **Procedures** — delinquency, screening, SODA generation\n\nTry asking: *\"How do I process a move-in?\"*, *\"What is SODA?\"*, or *\"How do I post a late fee?\"*";
    }

    return res.json({ reply });
  } catch (err: any) {
    console.error("Entrata chat error:", err);
    res.status(500).json({ error: err.message || "Chat service error." });
  }
});

// ─── Super Agent System ──────────────────────────────────────────────────────

const SA_DIR = path.join(DATA_DIR, "super-agent");
const SA_KB_DIR = path.join(SA_DIR, "kb");
const SA_CONV_DIR = path.join(SA_DIR, "conversations");

function ensureSADirs() {
  [SA_DIR, SA_KB_DIR, SA_CONV_DIR].forEach(d => {
    if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
  });
}

interface KBEntry {
  id: string;
  title: string;
  content: string;
  tags: string[];
  source: "manual" | "cursor-chat" | "import" | "auto";
  createdAt: string;
  updatedAt: string;
}

interface SAMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  model?: string;
  promptVariants?: PromptVariant[];
}

interface SAConversation {
  id: string;
  title: string;
  messages: SAMessage[];
  createdAt: string;
  updatedAt: string;
}

interface PromptVariant {
  promptText: string;
  model: string;
  modelLabel: string;
  rationale: string;
  useCase: string;
  estimatedCost: "free" | "low" | "medium" | "high";
  complexity: "fast" | "balanced" | "thorough";
}

// Simple BM25-style keyword search
function searchKB(query: string, entries: KBEntry[], limit = 5): Array<KBEntry & { score: number }> {
  const stopWords = new Set(["the","a","an","is","in","it","to","of","and","or","for","with","that","this","was","are"]);
  const queryWords = query.toLowerCase()
    .split(/\W+/)
    .filter(w => w.length > 2 && !stopWords.has(w));

  if (queryWords.length === 0) {
    return entries.slice(0, limit).map(e => ({ ...e, score: 1 }));
  }

  const scored = entries.map(entry => {
    const titleLower = entry.title.toLowerCase();
    const contentLower = entry.content.toLowerCase();
    const tagsLower = entry.tags.join(" ").toLowerCase();
    let score = 0;

    for (const word of queryWords) {
      const re = new RegExp(word, "g");
      score += (titleLower.match(re) ?? []).length * 4;
      score += (contentLower.match(re) ?? []).length;
      score += (tagsLower.match(re) ?? []).length * 2;
    }

    return { ...entry, score };
  });

  return scored
    .filter(e => e.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

function loadAllKBEntries(): KBEntry[] {
  ensureSADirs();
  try {
    return fs.readdirSync(SA_KB_DIR)
      .filter(f => f.endsWith(".json"))
      .map(f => JSON.parse(fs.readFileSync(path.join(SA_KB_DIR, f), "utf-8")) as KBEntry)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  } catch {
    return [];
  }
}

function saveKBEntry(entry: KBEntry) {
  ensureSADirs();
  fs.writeFileSync(path.join(SA_KB_DIR, `${entry.id}.json`), JSON.stringify(entry, null, 2));
}

function deleteKBEntry(id: string) {
  const filePath = path.join(SA_KB_DIR, `${id}.json`);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
}

function loadAllConversations(): SAConversation[] {
  ensureSADirs();
  try {
    return fs.readdirSync(SA_CONV_DIR)
      .filter(f => f.endsWith(".json"))
      .map(f => JSON.parse(fs.readFileSync(path.join(SA_CONV_DIR, f), "utf-8")) as SAConversation)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  } catch {
    return [];
  }
}

function loadConversation(id: string): SAConversation | null {
  try {
    return JSON.parse(fs.readFileSync(path.join(SA_CONV_DIR, `${id}.json`), "utf-8")) as SAConversation;
  } catch {
    return null;
  }
}

function saveConversation(conv: SAConversation) {
  ensureSADirs();
  fs.writeFileSync(path.join(SA_CONV_DIR, `${conv.id}.json`), JSON.stringify(conv, null, 2));
}

function deleteConversation(id: string) {
  const filePath = path.join(SA_CONV_DIR, `${id}.json`);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
}

// Detect task type from query for smart model routing
function detectTaskType(text: string): "coding" | "creative" | "analysis" | "research" | "quick" | "local-ok" {
  const lower = text.toLowerCase();
  if (/\b(code|function|class|bug|error|typescript|javascript|python|sql|api|debug|refactor|implement)\b/.test(lower)) return "coding";
  if (/\b(write|story|poem|draft|email|copy|marketing|creative|imagine|design)\b/.test(lower)) return "creative";
  if (/\b(analyze|compare|evaluate|breakdown|summarize|report|data|metrics|insights|why)\b/.test(lower)) return "analysis";
  if (/\b(research|find|search|what is|how does|explain|definition|history|learn)\b/.test(lower)) return "research";
  if (text.split(/\s+/).length < 15) return "quick";
  return "local-ok";
}

// Check if Ollama is available locally
async function checkOllama(): Promise<{ available: boolean; models: string[] }> {
  const ollamaUrl = process.env.OLLAMA_URL || "http://localhost:11434";
  try {
    const resp = await fetch(`${ollamaUrl}/api/tags`, { signal: AbortSignal.timeout(2000) });
    if (!resp.ok) return { available: false, models: [] };
    const data = await resp.json() as { models?: Array<{ name: string }> };
    const models = (data.models ?? []).map((m: { name: string }) => m.name);
    return { available: true, models };
  } catch {
    return { available: false, models: [] };
  }
}

// Send a message to Ollama
async function chatWithOllama(model: string, systemPrompt: string, messages: Array<{role: string; content: string}>): Promise<string> {
  const ollamaUrl = process.env.OLLAMA_URL || "http://localhost:11434";
  const payload = {
    model,
    messages: [
      { role: "system", content: systemPrompt },
      ...messages,
    ],
    stream: false,
  };
  const resp = await fetch(`${ollamaUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(60000),
  });
  if (!resp.ok) throw new Error(`Ollama error: ${resp.status}`);
  const data = await resp.json() as { message?: { content: string } };
  return data.message?.content ?? "";
}

const SA_SYSTEM_PROMPT = `You are MYK's Super Agent — a unified, memory-enabled AI assistant that knows MYK's projects, side ventures, and preferences deeply. You represent Designs by Myk LLC.

You help MYK with:
- All MYK brands and side projects (MYK.IO, TheOptimizer, MYKBrands, etc.)
- Cursor AI development, prompt crafting, and AI model strategy  
- Property management tech (ClearWorth, Entrata expertise)
- Business strategy, branding, and operations
- Technical development (TypeScript, React, Express, AI integrations)
- Cross-project context — you remember conversations and link related ideas

When you have CONTEXT from the knowledge base, reference it naturally and build on it.
Be direct, smart, and strategic. Speak as a trusted advisor who knows MYK's entire portfolio.`;

// ── SA API Routes ─────────────────────────────────────────────────────────────

// Status: Ollama + config check
app.get("/api/sa/status", async (req, res) => {
  const ollama = await checkOllama();
  res.json({
    geminiConfigured: !!process.env.GEMINI_API_KEY,
    authConfigured: isAuthConfigured(),
    authenticated: isAuthenticated(req),
    ollama,
    kbSize: loadAllKBEntries().length,
    conversationCount: loadAllConversations().length,
  });
});

// List conversations
app.get("/api/sa/conversations", (req, res) => {
  const conversations = loadAllConversations().map(c => ({
    id: c.id,
    title: c.title,
    messageCount: c.messages.length,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
    preview: c.messages[c.messages.length - 1]?.content?.slice(0, 100) ?? "",
  }));
  res.json({ conversations });
});

// Create conversation
app.post("/api/sa/conversations", (req, res) => {
  const { title } = req.body as { title?: string };
  const conv: SAConversation = {
    id: crypto.randomUUID(),
    title: title || "New Conversation",
    messages: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  saveConversation(conv);
  res.json(conv);
});

// Get single conversation
app.get("/api/sa/conversations/:id", (req, res) => {
  const conv = loadConversation(req.params.id);
  if (!conv) return res.status(404).json({ error: "Conversation not found" });
  res.json(conv);
});

// Delete conversation
app.delete("/api/sa/conversations/:id", (req, res) => {
  deleteConversation(req.params.id);
  res.json({ deleted: true });
});

// Send message to Super Agent (main chat endpoint)
app.post("/api/sa/conversations/:id/messages", async (req, res) => {
  const { message, model: requestedModel } = req.body as { message: string; model?: string };
  if (!message) return res.status(400).json({ error: "Message required" });

  let conv = loadConversation(req.params.id);
  if (!conv) {
    conv = {
      id: req.params.id,
      title: message.slice(0, 60),
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  // Auto-title on first message
  if (conv.messages.length === 0) {
    conv.title = message.slice(0, 60) + (message.length > 60 ? "…" : "");
  }

  const userMsg: SAMessage = {
    id: crypto.randomUUID(),
    role: "user",
    content: message,
    timestamp: new Date().toISOString(),
  };
  conv.messages.push(userMsg);

  // RAG: search KB for relevant context
  const kbEntries = loadAllKBEntries();
  const relevant = searchKB(message, kbEntries, 5);
  const contextBlock = relevant.length > 0
    ? `\n\n--- RELEVANT CONTEXT FROM KNOWLEDGE BASE ---\n${relevant.map(e =>
        `[${e.title}]: ${e.content.slice(0, 500)}`
      ).join("\n\n")}\n--- END CONTEXT ---`
    : "";

  const systemWithContext = SA_SYSTEM_PROMPT + contextBlock;

  // Build message history for AI (last 20 messages)
  const historyMessages = conv.messages
    .slice(-21, -1)
    .map(m => ({ role: m.role === "user" ? "user" : "model" as const, parts: [{ text: m.content }] }));

  let replyText = "";
  let usedModel = requestedModel || "gemini-2.0-flash";

  try {
    // Route to appropriate AI backend
    if (requestedModel?.startsWith("ollama/")) {
      // Explicit Ollama request
      const ollamaModel = requestedModel.replace("ollama/", "");
      const ollamaMessages = [
        ...conv.messages.slice(-20, -1).map(m => ({ role: m.role, content: m.content })),
      ];
      replyText = await chatWithOllama(ollamaModel, systemWithContext, ollamaMessages);
      usedModel = `ollama/${ollamaModel}`;
    } else if (process.env.GEMINI_API_KEY) {
      const ai = getAiClient();
      const modelId = requestedModel || "gemini-2.0-flash";
      const chat = ai.chats.create({
        model: modelId,
        config: { systemInstruction: systemWithContext },
        history: historyMessages,
      });
      const response = await chat.sendMessage({ message });
      replyText = response.text ?? "";
      usedModel = modelId;
    } else {
      replyText = "⚠️ No AI model configured. Set GEMINI_API_KEY in your .env.local file, or run Ollama locally and select an Ollama model.";
      usedModel = "none";
    }
  } catch (err: any) {
    replyText = `⚠️ Error: ${err.message}`;
  }

  const assistantMsg: SAMessage = {
    id: crypto.randomUUID(),
    role: "assistant",
    content: replyText,
    timestamp: new Date().toISOString(),
    model: usedModel,
  };
  conv.messages.push(assistantMsg);
  conv.updatedAt = new Date().toISOString();
  saveConversation(conv);

  res.json({ message: assistantMsg, conversation: { id: conv.id, title: conv.title } });
});

// ── Knowledge Base Routes ─────────────────────────────────────────────────────

// List KB entries
app.get("/api/sa/kb", (req, res) => {
  const entries = loadAllKBEntries();
  res.json({ entries, total: entries.length });
});

// Search KB
app.post("/api/sa/kb/search", (req, res) => {
  const { query, limit } = req.body as { query: string; limit?: number };
  if (!query) return res.status(400).json({ error: "Query required" });
  const entries = loadAllKBEntries();
  const results = searchKB(query, entries, limit || 10);
  res.json({ results });
});

// Add KB entry
app.post("/api/sa/kb", (req, res) => {
  const { title, content, tags, source } = req.body as Partial<KBEntry>;
  if (!title || !content) return res.status(400).json({ error: "title and content required" });

  const entry: KBEntry = {
    id: crypto.randomUUID(),
    title: title.trim(),
    content: content.trim(),
    tags: Array.isArray(tags) ? tags : [],
    source: (source as KBEntry["source"]) || "manual",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  saveKBEntry(entry);
  res.json(entry);
});

// Update KB entry
app.put("/api/sa/kb/:id", (req, res) => {
  const { title, content, tags } = req.body as Partial<KBEntry>;
  const filePath = path.join(SA_KB_DIR, `${req.params.id}.json`);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: "Entry not found" });

  const existing = JSON.parse(fs.readFileSync(filePath, "utf-8")) as KBEntry;
  const updated: KBEntry = {
    ...existing,
    title: title?.trim() ?? existing.title,
    content: content?.trim() ?? existing.content,
    tags: Array.isArray(tags) ? tags : existing.tags,
    updatedAt: new Date().toISOString(),
  };
  saveKBEntry(updated);
  res.json(updated);
});

// Delete KB entry
app.delete("/api/sa/kb/:id", (req, res) => {
  deleteKBEntry(req.params.id);
  res.json({ deleted: true });
});

// Import Cursor chat export (paste raw JSON or text)
app.post("/api/sa/kb/import-cursor-chat", (req, res) => {
  const { rawText, title } = req.body as { rawText: string; title?: string };
  if (!rawText) return res.status(400).json({ error: "rawText required" });

  // Try to parse as JSON (Cursor export format), fallback to plain text
  let content = rawText;
  let parsedTitle = title || "Cursor Chat Import";

  try {
    const parsed = JSON.parse(rawText);
    // Handle various Cursor export formats
    if (Array.isArray(parsed)) {
      content = parsed
        .map((m: any) => `${m.role ?? m.author ?? "?"}: ${m.content ?? m.text ?? ""}`)
        .join("\n\n");
      parsedTitle = title || `Cursor Chat (${parsed.length} messages)`;
    } else if (parsed.messages) {
      content = parsed.messages
        .map((m: any) => `${m.role}: ${m.content}`)
        .join("\n\n");
      parsedTitle = title || parsed.title || "Cursor Chat Import";
    } else {
      content = JSON.stringify(parsed, null, 2);
    }
  } catch {
    // Plain text — use as-is
  }

  // Auto-extract tags from content
  const words = content.toLowerCase().split(/\W+/);
  const tagCandidates = new Set<string>();
  const techKeywords = ["typescript","react","express","vite","tailwind","gemini","ollama","api","cursor","myk","entrata","clearworth"];
  for (const kw of techKeywords) {
    if (words.includes(kw)) tagCandidates.add(kw);
  }

  const entry: KBEntry = {
    id: crypto.randomUUID(),
    title: parsedTitle,
    content: content.slice(0, 50000), // cap at 50k chars
    tags: Array.from(tagCandidates),
    source: "cursor-chat",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  saveKBEntry(entry);
  res.json({ entry, charCount: content.length, tags: entry.tags });
});

// ── Prompt Optimizer ──────────────────────────────────────────────────────────

app.post("/api/sa/optimize-prompt", async (req, res) => {
  const { rawPrompt } = req.body as { rawPrompt: string };
  if (!rawPrompt) return res.status(400).json({ error: "rawPrompt required" });

  const taskType = detectTaskType(rawPrompt);

  // Model menu with cost/capability info
  const MODEL_CATALOG: Record<string, { label: string; cost: PromptVariant["estimatedCost"]; strengths: string }> = {
    "gemini-2.0-flash":   { label: "Gemini 2.0 Flash",   cost: "low",    strengths: "Fast responses, great for quick tasks, summarization, classification" },
    "gemini-2.5-flash":   { label: "Gemini 2.5 Flash",   cost: "medium", strengths: "Balanced reasoning + speed, coding, structured output" },
    "gemini-2.5-pro":     { label: "Gemini 2.5 Pro",     cost: "high",   strengths: "Deep reasoning, complex code, long documents, highest accuracy" },
    "gemini-2.0-flash-lite": { label: "Gemini Flash Lite", cost: "free", strengths: "Ultra-fast, minimal tasks, classification, one-shot Q&A" },
    "ollama/llama3":      { label: "Llama 3 (Local)",    cost: "free",   strengths: "100% private, runs locally, good for sensitive data, general use" },
    "ollama/mistral":     { label: "Mistral (Local)",    cost: "free",   strengths: "Fast local model, good for coding + structured tasks, private" },
    "ollama/codellama":   { label: "Code Llama (Local)", cost: "free",   strengths: "Local code generation, debugging, refactoring — fully offline" },
    "ollama/phi3":        { label: "Phi-3 Mini (Local)", cost: "free",   strengths: "Tiny + fast local model, classification, quick Q&A, edge deployment" },
  };

  // Route by task type
  const taskRoutes: Record<string, Array<{ model: string; complexity: PromptVariant["complexity"]; useCase: string }>> = {
    coding:    [
      { model: "gemini-2.5-flash", complexity: "balanced", useCase: "Write/review code with good reasoning" },
      { model: "gemini-2.5-pro",   complexity: "thorough", useCase: "Complex architecture, debugging, full codebase analysis" },
      { model: "ollama/codellama", complexity: "fast",     useCase: "Local code generation — no API cost, fully private" },
    ],
    creative:  [
      { model: "gemini-2.5-flash", complexity: "balanced", useCase: "Copywriting, emails, creative content" },
      { model: "gemini-2.5-pro",   complexity: "thorough", useCase: "Long-form writing, brand strategy, narrative depth" },
      { model: "ollama/llama3",    complexity: "fast",     useCase: "Draft content locally, iterate cheaply" },
    ],
    analysis:  [
      { model: "gemini-2.5-pro",   complexity: "thorough", useCase: "Deep analysis, comparisons, structured reports" },
      { model: "gemini-2.5-flash", complexity: "balanced", useCase: "Summaries and key insights at lower cost" },
      { model: "ollama/mistral",   complexity: "fast",     useCase: "Local quick analysis, no API dependency" },
    ],
    research:  [
      { model: "gemini-2.5-flash", complexity: "balanced", useCase: "Research summaries and explanation" },
      { model: "gemini-2.0-flash", complexity: "fast",     useCase: "Quick factual lookups and definitions" },
      { model: "ollama/llama3",    complexity: "fast",     useCase: "Private local research, no data sharing" },
    ],
    quick:     [
      { model: "gemini-2.0-flash",     complexity: "fast",     useCase: "Fast answer, minimal token cost" },
      { model: "gemini-2.0-flash-lite", complexity: "fast",    useCase: "Cheapest option for simple questions" },
      { model: "ollama/phi3",           complexity: "fast",    useCase: "Ultra-fast local answer, no cost" },
    ],
    "local-ok": [
      { model: "gemini-2.0-flash",  complexity: "fast",     useCase: "Standard task with good speed/cost balance" },
      { model: "ollama/llama3",     complexity: "balanced", useCase: "Free local option — good quality general model" },
      { model: "ollama/mistral",    complexity: "fast",     useCase: "Local alternative with good reasoning" },
    ],
  };

  const routes = taskRoutes[taskType] || taskRoutes["local-ok"];

  // Generate improved prompt variants using Gemini if available
  if (process.env.GEMINI_API_KEY) {
    try {
      const ai = getAiClient();
      const optimizerPrompt = `You are an expert prompt engineer for Designs by Myk LLC's Super Agent.
Given a raw user request, generate ${routes.length} improved prompt variants optimized for different AI models.

Raw request: "${rawPrompt}"
Detected task type: ${taskType}

For each variant, optimize the prompt for these specific model + use-case combinations:
${routes.map((r, i) => `Variant ${i+1}: ${MODEL_CATALOG[r.model]?.label ?? r.model} — ${r.useCase}`).join("\n")}

Rules:
1. Keep the user's core intent but make it clearer and more actionable
2. Add context, constraints, and output format hints that help the specific model
3. For local models: keep prompts concise (they have smaller context windows)
4. For Pro models: add detail, ask for reasoning, specify edge cases
5. For Flash/fast models: focus on direct, clear instructions
6. Each variant should be meaningfully different — not just the same text repeated

Return JSON:
{
  "taskType": "${taskType}",
  "variants": [
    {
      "promptText": "...",
      "rationale": "why this version is better and what makes it optimal for this model"
    }
  ]
}`;

      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: optimizerPrompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              taskType: { type: Type.STRING },
              variants: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    promptText: { type: Type.STRING },
                    rationale: { type: Type.STRING },
                  },
                  required: ["promptText", "rationale"],
                },
              },
            },
            required: ["taskType", "variants"],
          },
        },
      });

      const parsed = JSON.parse(response.text || "{}") as { variants: Array<{ promptText: string; rationale: string }> };

      const variants: PromptVariant[] = routes.map((route, i) => {
        const catalog = MODEL_CATALOG[route.model];
        return {
          promptText: parsed.variants?.[i]?.promptText ?? rawPrompt,
          model: route.model,
          modelLabel: catalog?.label ?? route.model,
          rationale: parsed.variants?.[i]?.rationale ?? catalog?.strengths ?? "",
          useCase: route.useCase,
          estimatedCost: catalog?.cost ?? "low",
          complexity: route.complexity,
        };
      });

      return res.json({ taskType, variants });
    } catch {
      // fall through to simple variant generation
    }
  }

  // Fallback: generate simple variants without AI
  const variants: PromptVariant[] = routes.map(route => {
    const catalog = MODEL_CATALOG[route.model];
    let promptText = rawPrompt;

    if (route.complexity === "thorough") {
      promptText = `${rawPrompt}\n\nPlease be thorough: explain your reasoning step-by-step, cover edge cases, and format output clearly with headers and bullets where appropriate.`;
    } else if (route.complexity === "fast") {
      promptText = rawPrompt.length > 200
        ? `${rawPrompt.slice(0, 200).trim()}... [Be concise — direct answer only.]`
        : rawPrompt;
    }

    return {
      promptText,
      model: route.model,
      modelLabel: catalog?.label ?? route.model,
      rationale: catalog?.strengths ?? "",
      useCase: route.useCase,
      estimatedCost: catalog?.cost ?? "low",
      complexity: route.complexity,
    };
  });

  res.json({ taskType, variants });
});

// Ollama proxy: check status + list models
app.get("/api/sa/local-models", async (req, res) => {
  const result = await checkOllama();
  res.json(result);
});

// Pull/run an Ollama model (triggers download)
app.post("/api/sa/local-models/pull", async (req, res) => {
  const { model } = req.body as { model: string };
  if (!model) return res.status(400).json({ error: "model required" });
  const ollamaUrl = process.env.OLLAMA_URL || "http://localhost:11434";
  try {
    const resp = await fetch(`${ollamaUrl}/api/pull`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: model, stream: false }),
      signal: AbortSignal.timeout(300000),
    });
    res.json({ ok: resp.ok, status: resp.status });
  } catch (err: any) {
    res.status(503).json({ error: err.message, hint: "Make sure Ollama is running: https://ollama.com" });
  }
});

// Setup development or production server modes
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true, allowedHosts: true },
      appType: "mpa",
    });
    app.use(vite.middlewares);
    console.log("Vite middleware mounted for development.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));

    // Super Agent SPA — serve its HTML for any /super-agent/* path
    app.get(["/super-agent", "/super-agent/*"], (req, res) => {
      const saHtml = path.join(distPath, "super-agent.html");
      if (fs.existsSync(saHtml)) {
        res.sendFile(saHtml);
      } else {
        res.status(404).send("Super Agent not built. Run: npm run build");
      }
    });

    // Main app catch-all
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Serving compiled static files from /dist.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`TheOptimizer + Super Agent server running at http://0.0.0.0:${PORT}`);
    console.log(`  Main app:    http://0.0.0.0:${PORT}/`);
    console.log(`  Super Agent: http://0.0.0.0:${PORT}/super-agent.html`);
  });
}

startServer();
