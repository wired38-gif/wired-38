import express from "express";
import path from "path";
import crypto from "crypto";
import type { NextFunction, Request, Response } from "express";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

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
    try {
      cookies[name] = decodeURIComponent(valueParts.join("="));
    } catch {
      // Treat malformed cookie values as absent rather than failing auth/status requests.
    }
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

// Setup development or production server modes
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite middleware mounted for development.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Serving compiled static files from /dist.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`TheOptimizer server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
