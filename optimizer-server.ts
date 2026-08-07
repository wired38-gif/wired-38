/**
 * MYK.IO Optimizer Server — research.mykbrands.com
 *
 * Completely standalone Express server for the AI Research & Prompt Optimizer.
 * Has NO connection to the Entrata Training Hub.
 *
 * Endpoints:
 *   GET  /api/status                         — auth status check
 *   POST /api/logout                         — clear session
 *   GET  /api/optimizer/config               — which auth methods are enabled
 *   POST /api/optimizer/pin-login            — PIN access (OPTIMIZER_PIN env var, default 8718)
 *   GET  /api/optimizer/workos/auth          — WorkOS SSO authorization URL
 *   GET  /api/optimizer/workos/callback      — WorkOS OAuth callback
 *   POST /api/analyze-prompt                 — Gemini: 3-tier cost analysis
 *   POST /api/refine-prompt                  — Gemini: execute selected tier
 *   GET  /api/ai-research                    — RSS feed aggregator
 *   GET  /api/ai-research/sites              — configured feed sources
 */

import express from "express";
import path from "path";
import crypto from "crypto";
import type { NextFunction, Request, Response } from "express";
import { GoogleGenAI, Type } from "@google/genai";
import { config as loadEnv } from "dotenv";
import { createServer as createViteServer } from "vite";
import { WorkOS } from "@workos-inc/node";
import fs from "fs";

loadEnv({ path: [".env.local", ".env"] });

const app = express();
const PORT = Number(process.env.PORT || 3001);
const SESSION_COOKIE_NAME = "myk_io_session";
const SESSION_TTL_SECONDS = 8 * 60 * 60;

app.use(express.json());
app.set("trust proxy", 1);

// ─── Session helpers ──────────────────────────────────────────────────────────

type SessionPayload = { sub: string; exp: number };

function getAuthSecret(): string {
  return process.env.AUTH_SECRET || process.env.OPTIMIZER_PIN || "myk-optimizer-secret";
}

function hashValue(value: string) {
  return crypto.createHash("sha256").update(value).digest();
}

function constantTimeEqual(a: string, b: string) {
  return crypto.timingSafeEqual(hashValue(a), hashValue(b));
}

function signPayload(encodedPayload: string) {
  return crypto.createHmac("sha256", getAuthSecret()).update(encodedPayload).digest("base64url");
}

function createSessionToken(sub: string) {
  const payload: SessionPayload = { sub, exp: Date.now() + SESSION_TTL_SECONDS * 1000 };
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

function verifySessionToken(token: string | undefined): boolean {
  if (!token) return false;
  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) return false;
  const expectedSignature = signPayload(encodedPayload);
  if (!constantTimeEqual(signature, expectedSignature)) return false;
  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as SessionPayload;
    return typeof payload.sub === "string" && payload.exp > Date.now();
  } catch {
    return false;
  }
}

function isAuthenticated(req: Request): boolean {
  const cookies = parseCookies(req.headers.cookie);
  return verifySessionToken(cookies[SESSION_COOKIE_NAME]);
}

function buildSessionCookie(token: string, req: Request): string {
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

function clearSessionCookie(): string {
  return `${SESSION_COOKIE_NAME}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`;
}

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!isAuthenticated(req)) {
    res.status(401).json({ error: "Authentication required." });
    return;
  }
  next();
}

function getAppBaseUrl(req: Request): string {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, "");
  const proto = req.secure || req.headers["x-forwarded-proto"] === "https" ? "https" : "http";
  return `${proto}://${req.headers.host}`;
}

// ─── Gemini client ────────────────────────────────────────────────────────────

let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error("GEMINI_API_KEY environment variable is not configured.");
    aiClient = new GoogleGenAI({ apiKey: key, httpOptions: { headers: { "User-Agent": "aistudio-build" } } });
  }
  return aiClient;
}

// ─── WorkOS client ────────────────────────────────────────────────────────────

let workosClient: WorkOS | null = null;

function getWorkOS(): WorkOS | null {
  if (workosClient) return workosClient;
  const apiKey = process.env.WORKOS_API_KEY;
  if (!apiKey) return null;
  workosClient = new WorkOS(apiKey);
  return workosClient;
}

function isWorkOSConfigured(): boolean {
  return Boolean(process.env.WORKOS_API_KEY && process.env.WORKOS_CLIENT_ID);
}

// ─── Auth endpoints ───────────────────────────────────────────────────────────

app.get("/api/status", (req, res) => {
  res.json({
    status: "ok",
    hasApiKey: !!process.env.GEMINI_API_KEY,
    authenticated: isAuthenticated(req),
    timestamp: new Date().toISOString(),
  });
});

app.post("/api/logout", (_req, res) => {
  res.setHeader("Set-Cookie", clearSessionCookie());
  res.json({ authenticated: false });
});

app.get("/api/optimizer/config", (_req, res) => {
  res.json({ pinEnabled: true, workosEnabled: isWorkOSConfigured() });
});

app.post("/api/optimizer/pin-login", (req, res) => {
  const { pin } = req.body as { pin: string };
  const correctPin = (process.env.OPTIMIZER_PIN ?? "8718").trim();
  if (!pin || pin.trim() !== correctPin) {
    res.status(401).json({ error: "Incorrect PIN. Please try again." });
    return;
  }
  const token = createSessionToken("optimizer-pin");
  res.setHeader("Set-Cookie", buildSessionCookie(token, req));
  res.json({ authenticated: true, method: "pin" });
});

app.get("/api/optimizer/workos/auth", (req, res) => {
  const wos = getWorkOS();
  if (!wos) {
    res.status(503).json({ error: "WorkOS is not configured on this server." });
    return;
  }
  const redirectUri = `${getAppBaseUrl(req)}/api/optimizer/workos/callback`;
  const authUrl = wos.userManagement.getAuthorizationUrl({
    clientId: process.env.WORKOS_CLIENT_ID!,
    redirectUri,
    provider: "authkit",
  });
  res.json({ authUrl });
});

app.get("/api/optimizer/workos/callback", async (req, res) => {
  const wos = getWorkOS();
  if (!wos) { res.status(503).send("WorkOS is not configured."); return; }
  const code = req.query.code as string;
  if (!code) { res.status(400).send("Missing authorization code."); return; }
  try {
    const { user } = await wos.userManagement.authenticateWithCode({
      clientId: process.env.WORKOS_CLIENT_ID!,
      code,
    });
    console.log(`WorkOS login: ${user.email}`);
    const token = createSessionToken(user.email);
    res.setHeader("Set-Cookie", buildSessionCookie(token, req));
    res.redirect("/");
  } catch (err: any) {
    console.error("WorkOS callback error:", err);
    res.redirect(`/?auth_error=${encodeURIComponent(err.message || "WorkOS login failed")}`);
  }
});

// ─── Prompt optimization endpoints ───────────────────────────────────────────

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
2. "options": an array of exactly 3 objects.
Each option must contain:
- "tier": 1, 2, or 3
- "name": String title
- "costEstimate": Positive integer (tokens)
- "focus": Short phrase describing the main focus
- "explanation": Brief summary of the level of detail.`;

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
            analysis: { type: Type.STRING },
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
    res.json(JSON.parse(response.text || "{}"));
  } catch (err: any) {
    console.error("analyze-prompt error:", err);
    res.status(500).json({ error: err.message || "Analysis failed." });
  }
});

app.post("/api/refine-prompt", requireAuth, async (req, res) => {
  try {
    const { prompt, tier, domain, optionData, selectedLlm } = req.body;
    if (!prompt) return res.status(400).json({ error: "Prompt is required." });
    if (!tier || ![1, 2, 3].includes(Number(tier))) return res.status(400).json({ error: "Invalid tier." });
    const ai = getAiClient();

    let llmAdapterStyle = "";
    if (selectedLlm?.includes("Claude")) {
      llmAdapterStyle = "\n\n[TARGET: ANTHROPIC CLAUDE]\nUse XML tag structures: <system_instructions>, <user_input_context>, <safety_constraints>.";
    } else if (selectedLlm?.includes("GPT")) {
      llmAdapterStyle = "\n\n[TARGET: OPENAI GPT-4o]\nUse SYSTEM COMMAND: / USER ACTION: block headings. Specify JSON layout boundaries.";
    } else if (selectedLlm?.includes("Llama")) {
      llmAdapterStyle = "\n\n[TARGET: META LLAMA-3]\nUse direct command blocks with markdown headers. Avoid descriptive language.";
    } else {
      llmAdapterStyle = "\n\n[TARGET: GEMINI]\nUse native Gemini directives and structured markdown lists.";
    }

    let executionPrompt = "";
    if (Number(tier) === 1) {
      executionPrompt = `You are "TheOptimizer". Option 1 (Low Cost): rewrite the user's request into a compact, optimized single prompt.${llmAdapterStyle}\n\nOriginal: "${prompt}"\n\nOutput: 1) title: "Cost-Friendly Prompt Revision" 2) content: structured markdown with brief description 3) milestones: 4 steps 4) keyRecommendations: token-saving tips.`;
    } else if (Number(tier) === 2) {
      executionPrompt = `You are "TheOptimizer". Option 2 (Balanced): draft a comprehensive execution plan.${llmAdapterStyle}\n\nOriginal: "${prompt}"\n\nOutput: 1) title: "The Master Blueprint" 2) content: full Markdown roadmap with architecture and milestones 3) milestones: 6-8 titles 4) keyRecommendations: optimization advice.`;
    } else {
      executionPrompt = `You are "TheOptimizer". Option 3 (Deep Dive): exhaustive detail. DB schemas, error handling, UX copy.${llmAdapterStyle}\n\nOriginal: "${prompt}"\n\nOutput: 1) title: "The Deep Dive Specification" 2) content: complete Markdown spec with architecture, schemas, UX 3) milestones: 8 descriptive milestones 4) keyRecommendations: performance optimizations.`;
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: executionPrompt,
      config: {
        systemInstruction: `You are "TheOptimizer" by MYK.IO. Return beautifully crafted Markdown in content and clear checklist items in JSON.`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            content: { type: Type.STRING },
            estimatedTokens: { type: Type.INTEGER },
            milestones: { type: Type.ARRAY, items: { type: Type.STRING } },
            keyRecommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ["title", "content", "estimatedTokens", "milestones", "keyRecommendations"],
        },
      },
    });
    res.json(JSON.parse(response.text || "{}"));
  } catch (err: any) {
    console.error("refine-prompt error:", err);
    res.status(500).json({ error: err.message || "Refinement failed." });
  }
});

// ─── AI Research Feed ─────────────────────────────────────────────────────────

interface ResearchArticle {
  id: string;
  title: string;
  url: string;
  publishedAt: string;
  summary: string;
  source: string;
  sourceUrl: string;
  category: string;
  tags: string[];
  relevant: boolean;
}

function parseRssFeed(xml: string, siteId: string, siteName: string, siteUrl: string): ResearchArticle[] {
  const articles: ResearchArticle[] = [];
  const itemPattern = /<(?:item|entry)[\s>]([\s\S]*?)<\/(?:item|entry)>/g;
  let match: RegExpExecArray | null;
  let count = 0;
  while ((match = itemPattern.exec(xml)) !== null && count < 10) {
    const block = match[1];
    const title = (/<title[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/.exec(block)?.[1] ?? "")
      .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#39;/g, "'").trim();
    const link =
      /<link[^>]*href="([^"]+)"/.exec(block)?.[1] ??
      /<link[^>]*>(https?:\/\/[^\s<]+)<\/link>/.exec(block)?.[1] ?? "";
    const pubDate =
      /<pubDate>([\s\S]*?)<\/pubDate>/.exec(block)?.[1] ??
      /<published>([\s\S]*?)<\/published>/.exec(block)?.[1] ??
      /<updated>([\s\S]*?)<\/updated>/.exec(block)?.[1] ?? "";
    const description =
      (/<description[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/.exec(block)?.[1] ??
       /<summary[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/summary>/.exec(block)?.[1] ?? "")
        .replace(/<[^>]+>/g, " ").replace(/\s+/g, " ")
        .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&nbsp;/g, " ")
        .trim().slice(0, 500);
    if (!title || !link) continue;
    articles.push({
      id: `${siteId}-${count}`,
      title, url: link,
      publishedAt: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
      summary: description, source: siteName, sourceUrl: siteUrl,
      category: "feed", tags: [], relevant: true,
    });
    count++;
  }
  return articles;
}

async function fetchFeed(rssUrl: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(rssUrl, {
      signal: controller.signal,
      headers: { "User-Agent": "MYK.IO-ResearchBot/1.0 (+https://research.mykbrands.com)" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(timeout);
  }
}

const AI_KEYWORDS = [
  "ai token", "token pricing", "free ai", "microsoft mai", "mai-code", "mai-1",
  "new model", "open-source llm", "prompt engineering", "ai cost", "free tier",
  "copilot", "claude", "gemini", "gpt", "llama", "mistral", "ai news",
  "ai tool", "ai release", "large language model", "openrouter", "google ai studio",
  "api credit", "token optimization", "context caching", "prompt cache",
  "free api", "zero cost", "open source model", "local llm", "free model",
];

const RESEARCH_SITES = [
  { id: "bens-bites",        name: "Ben's Bites",           url: "https://www.bensbites.com",                  rssUrl: "https://bensbites.beehiiv.com/feed" },
  { id: "one-useful-thing",  name: "One Useful Thing",      url: "https://www.oneusefulthing.org",             rssUrl: "https://www.oneusefulthing.org/feed" },
  { id: "interconnects",     name: "Interconnects",         url: "https://www.interconnects.ai",               rssUrl: "https://www.interconnects.ai/feed" },
  { id: "import-ai",         name: "Import AI",             url: "https://jack-clark.net",                     rssUrl: "https://jack-clark.net/feed" },
  { id: "ai-supremacy",      name: "AI Supremacy",          url: "https://aisupremacy.substack.com",           rssUrl: "https://aisupremacy.substack.com/feed" },
  { id: "simon-willison",    name: "Simon Willison",        url: "https://simonwillison.net",                  rssUrl: "https://simonwillison.net/atom/everything/" },
  { id: "openrouter-blog",   name: "OpenRouter Blog",       url: "https://openrouter.ai/blog",                 rssUrl: "https://openrouter.ai/blog/rss.xml" },
  { id: "hn-ai",             name: "Hacker News — AI",      url: "https://news.ycombinator.com",               rssUrl: "https://hnrss.org/newest?q=AI+tokens+OR+free+API+OR+open+source+LLM+OR+prompt&count=20" },
  { id: "reddit-localllama", name: "r/LocalLLaMA",          url: "https://www.reddit.com/r/LocalLLaMA",        rssUrl: "https://www.reddit.com/r/LocalLLaMA/.rss?limit=15" },
  { id: "reddit-prompt",     name: "r/PromptEngineering",   url: "https://www.reddit.com/r/PromptEngineering", rssUrl: "https://www.reddit.com/r/PromptEngineering/.rss?limit=15" },
  { id: "ms-ai-blog",        name: "Microsoft AI Blog",     url: "https://blogs.microsoft.com/ai",             rssUrl: "https://blogs.microsoft.com/ai/feed" },
  { id: "openai-blog",       name: "OpenAI News",           url: "https://openai.com/news",                    rssUrl: "https://openai.com/news/rss.xml" },
  { id: "google-ai-blog",    name: "Google AI Blog",        url: "https://blog.google/technology/ai",          rssUrl: "https://blog.google/technology/ai/rss" },
];

const feedCache = new Map<string, { articles: ResearchArticle[]; fetchedAt: number }>();
const FEED_CACHE_TTL = 30 * 60 * 1000;

app.get("/api/ai-research", async (req, res) => {
  try {
    const forceRefresh = req.query.refresh === "true";
    const now = Date.now();
    const feedPromises = RESEARCH_SITES.map(async site => {
      const cached = feedCache.get(site.id);
      if (!forceRefresh && cached && now - cached.fetchedAt < FEED_CACHE_TTL) {
        return { siteId: site.id, name: site.name, articles: cached.articles };
      }
      try {
        const xml = await fetchFeed(site.rssUrl);
        const articles = parseRssFeed(xml, site.id, site.name, site.url);
        feedCache.set(site.id, { articles, fetchedAt: now });
        return { siteId: site.id, name: site.name, articles };
      } catch (err: any) {
        const cached = feedCache.get(site.id);
        return { siteId: site.id, name: site.name, articles: cached?.articles ?? [], error: err.message };
      }
    });
    const feeds = await Promise.all(feedPromises);
    let allArticles = feeds.flatMap(f => f.articles);
    allArticles = allArticles.map(a => {
      const text = (a.title + " " + a.summary).toLowerCase();
      return { ...a, relevant: AI_KEYWORDS.some(kw => text.includes(kw)) };
    });
    allArticles.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
    const relevant = allArticles.filter(a => a.relevant);
    const other = allArticles.filter(a => !a.relevant);
    res.json({
      articles: [...relevant, ...other].slice(0, 40),
      relevantCount: relevant.length,
      totalCount: allArticles.length,
      sources: RESEARCH_SITES.map(s => ({ id: s.id, name: s.name, url: s.url })),
      fetchedAt: new Date().toISOString(),
      errors: feeds.filter(f => (f as any).error).map(f => ({ site: f.name, error: (f as any).error })),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/ai-research/sites", (_req, res) => {
  res.json({ sites: RESEARCH_SITES.map(s => ({ id: s.id, name: s.name, url: s.url })) });
});

// ─── SPA serving ──────────────────────────────────────────────────────────────

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true, allowedHosts: true },
      appType: "custom",
    });
    app.use(vite.middlewares);

    // Serve optimizer.html for all non-API routes in dev
    app.get("*", async (req, res, next) => {
      if (req.path.startsWith("/api")) return next();
      try {
        let html = fs.readFileSync("optimizer.html", "utf-8");
        html = await vite.transformIndexHtml(req.url, html);
        res.status(200).set({ "Content-Type": "text/html" }).end(html);
      } catch (e) {
        next(e);
      }
    });
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "optimizer.html"));
    });
    console.log("Serving optimizer from /dist/optimizer.html");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`MYK.IO Optimizer server running at http://0.0.0.0:${PORT}`);
    console.log(`  WorkOS configured: ${isWorkOSConfigured()}`);
    console.log(`  Gemini configured: ${!!process.env.GEMINI_API_KEY}`);
  });
}

startServer();
