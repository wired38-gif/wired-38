import express from "express";
import path from "path";
import crypto from "crypto";
import type { NextFunction, Request, Response } from "express";
import { GoogleGenAI, Type } from "@google/genai";
import { config as loadEnv } from "dotenv";
import { createServer as createViteServer } from "vite";
import fs from "fs";
import { brainEngineTools, isBrainEngineConfigured } from "./src/tools/brainEngineTools.ts";

loadEnv({ path: [".env.local", ".env"] });

const app = express();
const PORT = Number(process.env.PORT || 3000);
const DATA_DIR = path.join(process.cwd(), "data");
const SA_DIR = path.join(DATA_DIR, "super-agent");
const SA_KB_DIR = path.join(SA_DIR, "kb");
const SA_CONV_DIR = path.join(SA_DIR, "conversations");

app.use(express.json({ limit: "10mb" }));
app.set("trust proxy", 1);

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Storage ──────────────────────────────────────────────────────────────────

function ensureDirs() {
  [SA_DIR, SA_KB_DIR, SA_CONV_DIR].forEach(d => {
    if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
  });
}

function loadAllKBEntries(): KBEntry[] {
  ensureDirs();
  try {
    return fs.readdirSync(SA_KB_DIR)
      .filter(f => f.endsWith(".json"))
      .map(f => JSON.parse(fs.readFileSync(path.join(SA_KB_DIR, f), "utf-8")) as KBEntry)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  } catch { return []; }
}

function saveKBEntry(entry: KBEntry) {
  ensureDirs();
  fs.writeFileSync(path.join(SA_KB_DIR, `${entry.id}.json`), JSON.stringify(entry, null, 2));
}

function deleteKBEntry(id: string) {
  const p = path.join(SA_KB_DIR, `${id}.json`);
  if (fs.existsSync(p)) fs.unlinkSync(p);
}

function loadAllConversations(): SAConversation[] {
  ensureDirs();
  try {
    return fs.readdirSync(SA_CONV_DIR)
      .filter(f => f.endsWith(".json"))
      .map(f => JSON.parse(fs.readFileSync(path.join(SA_CONV_DIR, f), "utf-8")) as SAConversation)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  } catch { return []; }
}

function loadConversation(id: string): SAConversation | null {
  try { return JSON.parse(fs.readFileSync(path.join(SA_CONV_DIR, `${id}.json`), "utf-8")); }
  catch { return null; }
}

function saveConversation(conv: SAConversation) {
  ensureDirs();
  fs.writeFileSync(path.join(SA_CONV_DIR, `${conv.id}.json`), JSON.stringify(conv, null, 2));
}

function deleteConversation(id: string) {
  const p = path.join(SA_CONV_DIR, `${id}.json`);
  if (fs.existsSync(p)) fs.unlinkSync(p);
}

// ─── Search ───────────────────────────────────────────────────────────────────

function searchKB(query: string, entries: KBEntry[], limit = 5): Array<KBEntry & { score: number }> {
  const stop = new Set(["the","a","an","is","in","it","to","of","and","or","for","with","that","this","was","are"]);
  const words = query.toLowerCase().split(/\W+/).filter(w => w.length > 2 && !stop.has(w));
  if (!words.length) return entries.slice(0, limit).map(e => ({ ...e, score: 1 }));

  return entries
    .map(e => {
      let score = 0;
      const t = e.title.toLowerCase(), c = e.content.toLowerCase(), g = e.tags.join(" ").toLowerCase();
      for (const w of words) {
        const re = new RegExp(w, "g");
        score += (t.match(re) ?? []).length * 4 + (c.match(re) ?? []).length + (g.match(re) ?? []).length * 2;
      }
      return { ...e, score };
    })
    .filter(e => e.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

const SA_COOKIE = "myk_sa_session";
const SA_TTL = 30 * 24 * 60 * 60;

function parseCookies(header: string | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!header) return out;
  for (const c of header.split(";")) {
    const [k, ...v] = c.trim().split("=");
    if (k) out[k] = decodeURIComponent(v.join("="));
  }
  return out;
}

function getSecret(): string {
  return process.env.AUTH_SECRET || process.env.SA_PIN || "sa-fallback-secret";
}

function hashVal(v: string) { return crypto.createHash("sha256").update(v).digest(); }
function safeEq(a: string, b: string) { return crypto.timingSafeEqual(hashVal(a), hashVal(b)); }

function makeToken(): string {
  const payload = Buffer.from(JSON.stringify({ exp: Date.now() + SA_TTL * 1000 })).toString("base64url");
  const sig = crypto.createHmac("sha256", getSecret()).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

function verifyToken(token: string | undefined): boolean {
  if (!token) return false;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return false;
  const expected = crypto.createHmac("sha256", getSecret()).update(payload).digest("base64url");
  if (!safeEq(sig, expected)) return false;
  try {
    const d = JSON.parse(Buffer.from(payload, "base64url").toString("utf-8")) as { exp: number };
    return d.exp > Date.now();
  } catch { return false; }
}

function isAuthed(req: Request): boolean {
  if (!process.env.SA_PIN) return true;
  return verifyToken(parseCookies(req.headers.cookie)[SA_COOKIE]);
}

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!isAuthed(req)) { res.status(401).json({ error: "PIN required", pinRequired: true }); return; }
  next();
}

function cookieHeader(token: string, req: Request): string {
  const secure = req.secure || process.env.NODE_ENV === "production";
  const parts = [`${SA_COOKIE}=${encodeURIComponent(token)}`, "HttpOnly", "SameSite=Lax", "Path=/", `Max-Age=${SA_TTL}`];
  if (secure) parts.push("Secure");
  return parts.join("; ");
}

// ─── AI Clients ───────────────────────────────────────────────────────────────

// gemini-2.0-flash was retired from the model catalog (API returns 404).
// Default to the current recommended flash model; override via GEMINI_MODEL
// env var so future retirements don't require a code change.
const DEFAULT_GEMINI_MODEL = process.env.GEMINI_MODEL?.trim() || "gemini-3.6-flash";

let _gemini: GoogleGenAI | null = null;
function getGemini() {
  if (!_gemini) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error("GEMINI_API_KEY not configured.");
    _gemini = new GoogleGenAI({ apiKey: key, httpOptions: { headers: { "User-Agent": "myk-super-agent" } } });
  }
  return _gemini;
}

async function checkOllama(): Promise<{ available: boolean; models: string[] }> {
  const url = process.env.OLLAMA_URL || "http://localhost:11434";
  try {
    const r = await fetch(`${url}/api/tags`, { signal: AbortSignal.timeout(2000) });
    if (!r.ok) return { available: false, models: [] };
    const d = await r.json() as { models?: Array<{ name: string }> };
    return { available: true, models: (d.models ?? []).map(m => m.name) };
  } catch { return { available: false, models: [] }; }
}

async function checkAppleAI(): Promise<{ available: boolean; modelId: string; contextWindow?: number }> {
  const base = (process.env.APPLE_AI_URL || "http://localhost:11435/v1").replace(/\/v1$/, "");
  try {
    const r = await fetch(`${base}/health`, { signal: AbortSignal.timeout(2000) });
    if (!r.ok) return { available: false, modelId: "apple-foundationmodel" };
    const d = await r.json() as { modelAvailable?: boolean; contextWindow?: number; model?: string };
    return { available: d.modelAvailable !== false, modelId: d.model || "apple-foundationmodel", contextWindow: d.contextWindow };
  } catch { return { available: false, modelId: "apple-foundationmodel" }; }
}

async function chatWithAppleAI(system: string, messages: Array<{ role: string; content: string }>): Promise<string> {
  const url = process.env.APPLE_AI_URL || "http://localhost:11435/v1";
  const r = await fetch(`${url}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: "apple-foundationmodel", messages: [{ role: "system", content: system }, ...messages], stream: false, max_tokens: 1024 }),
    signal: AbortSignal.timeout(60000),
  });
  if (!r.ok) throw new Error(`Apple AI error ${r.status}`);
  const d = await r.json() as { choices?: Array<{ message?: { content?: string } }> };
  return d.choices?.[0]?.message?.content ?? "";
}

async function chatWithOllama(model: string, system: string, messages: Array<{ role: string; content: string }>): Promise<string> {
  const url = process.env.OLLAMA_URL || "http://localhost:11434";
  const r = await fetch(`${url}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model, messages: [{ role: "system", content: system }, ...messages], stream: false }),
    signal: AbortSignal.timeout(60000),
  });
  if (!r.ok) throw new Error(`Ollama error ${r.status}`);
  const d = await r.json() as { message?: { content: string } };
  return d.message?.content ?? "";
}

function detectTaskType(text: string): string {
  const l = text.toLowerCase();
  if (/\b(code|function|class|bug|error|typescript|javascript|python|sql|api|debug|refactor)\b/.test(l)) return "coding";
  if (/\b(write|story|email|copy|marketing|creative|design)\b/.test(l)) return "creative";
  if (/\b(analyze|compare|evaluate|summarize|report|data|metrics|insights)\b/.test(l)) return "analysis";
  if (/\b(research|find|what is|how does|explain|learn)\b/.test(l)) return "research";
  if (text.split(/\s+/).length < 15) return "quick";
  return "general";
}

const SYSTEM_PROMPT = `You are MYK's Super Agent — a unified, memory-enabled AI assistant for Designs by Myk LLC, accessible at SA.Mykbrands.com.

You help MYK with:
- All MYK brands and side projects (MYK.IO, TheOptimizer, AskMyk.io, MYKBrands, Queenscustoms.shop, etc.)
- Cursor AI development, prompt crafting, and AI model strategy
- Business strategy, branding, and operations
- Technical development (TypeScript, React, Express, AI integrations)
- Cross-project context — you remember conversations and link related ideas

Key URLs:
- Super Agent (you): SA.Mykbrands.com
- Entrata Training Hub: entrata-training.onrender.com
- AskMyk.io: askmyk.io

You have live tools wired to the MYK Brain Engine (the Apple Container / Virtualization environment on MYK's Mac):
- get_brain_engine_status — build status, container health, gateway state, build log tail
- restart_brain_engine_container — hard reset hung Apple Container / Virtualization processes
- trigger_brain_engine_build — kick off a fresh Brain Engine build
- run_brain_engine_command — run an arbitrary shell command on the Mac (git, npm, tests, file inspection) and read stdout/stderr
When MYK asks how the build is coming, whether the engine is up, or whether something is hung, call get_brain_engine_status first and answer from the live data. Only call restart/build tools when the status shows a hang or MYK asks for it. Use run_brain_engine_command for diagnostics, git operations, running builds/tests, and inspecting files; show the relevant stdout/stderr back to MYK and be careful with destructive commands.

When you have CONTEXT from the knowledge base, reference it naturally and build on it.
Be direct, smart, and strategic. Speak as a trusted advisor who knows MYK's entire portfolio.`;

// ─── PIN Auth ─────────────────────────────────────────────────────────────────

app.post("/api/sa/login", (req, res) => {
  const { pin } = req.body as { pin: string };
  const configured = process.env.SA_PIN;
  if (!configured) { res.json({ authenticated: true, open: true }); return; }
  if (!pin || !safeEq(String(pin).trim(), configured)) { res.status(401).json({ error: "Incorrect PIN." }); return; }
  res.setHeader("Set-Cookie", cookieHeader(makeToken(), req));
  res.json({ authenticated: true });
});

app.post("/api/sa/logout", (req, res) => {
  res.setHeader("Set-Cookie", `${SA_COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`);
  res.json({ authenticated: false });
});

// ─── Status ───────────────────────────────────────────────────────────────────

app.get("/api/sa/status", async (req, res) => {
  const [ollama, appleAI] = await Promise.all([checkOllama(), checkAppleAI()]);
  const authed = isAuthed(req);
  res.json({
    geminiConfigured: !!process.env.GEMINI_API_KEY,
    saAuthenticated: authed,
    pinRequired: !!process.env.SA_PIN,
    ollama,
    appleAI,
    brainEngine: { configured: isBrainEngineConfigured() },
    kbSize: authed ? loadAllKBEntries().length : 0,
    conversationCount: authed ? loadAllConversations().length : 0,
  });
});

// Live Brain Engine snapshot (daemon on the Mac via MYK_DAEMON_URL).
app.get("/api/sa/brain-engine", requireAuth, async (req, res) => {
  const statusTool = brainEngineTools.find(t => t.name === "get_brain_engine_status")!;
  res.json({ configured: isBrainEngineConfigured(), ...(await statusTool.execute() as object) });
});

// ─── Conversations ────────────────────────────────────────────────────────────

app.get("/api/sa/conversations", requireAuth, (req, res) => {
  res.json({ conversations: loadAllConversations().map(c => ({
    id: c.id, title: c.title,
    messageCount: c.messages.length,
    createdAt: c.createdAt, updatedAt: c.updatedAt,
    preview: c.messages[c.messages.length - 1]?.content?.slice(0, 100) ?? "",
  }))});
});

app.post("/api/sa/conversations", requireAuth, (req, res) => {
  const conv: SAConversation = {
    id: crypto.randomUUID(),
    title: (req.body as { title?: string }).title || "New Conversation",
    messages: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  saveConversation(conv);
  res.json(conv);
});

app.get("/api/sa/conversations/:id", requireAuth, (req, res) => {
  const conv = loadConversation(req.params.id);
  if (!conv) return res.status(404).json({ error: "Not found" });
  res.json(conv);
});

app.delete("/api/sa/conversations/:id", requireAuth, (req, res) => {
  deleteConversation(req.params.id);
  res.json({ deleted: true });
});

app.post("/api/sa/conversations/:id/messages", requireAuth, async (req, res) => {
  const {
    message,
    model: requestedModel,
    attachments = [],
  } = req.body as {
    message: string;
    model?: string;
    attachments?: Array<{ data: string; mimeType: string; fileName: string }>;
  };

  if (!message && !attachments.length) return res.status(400).json({ error: "Message or attachment required" });

  const text = message || "Please analyze the attached file(s).";

  let conv = loadConversation(req.params.id) ?? {
    id: req.params.id,
    title: text.slice(0, 60),
    messages: [] as SAMessage[],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (conv.messages.length === 0) conv.title = text.slice(0, 60) + (text.length > 60 ? "…" : "");

  // Store user message — include attachment metadata in content for context
  const attachmentNote = attachments.length
    ? `\n[Attachments: ${attachments.map(a => a.fileName).join(", ")}]`
    : "";
  conv.messages.push({
    id: crypto.randomUUID(),
    role: "user",
    content: text + attachmentNote,
    timestamp: new Date().toISOString(),
  });

  const relevant = searchKB(text, loadAllKBEntries(), 5);
  const context = relevant.length
    ? `\n\n--- KNOWLEDGE BASE CONTEXT ---\n${relevant.map(e => `[${e.title}]: ${e.content.slice(0, 500)}`).join("\n\n")}\n---`
    : "";
  const system = SYSTEM_PROMPT + context;

  let replyText = "";
  let usedModel = requestedModel || DEFAULT_GEMINI_MODEL;

  try {
    if (requestedModel?.startsWith("apple/") || requestedModel === "apple-foundationmodel") {
      // Apple AI doesn't support attachments — text only
      const msgs = conv.messages.slice(-10, -1).map(m => ({ role: m.role, content: m.content }));
      replyText = await chatWithAppleAI(system, msgs);
      usedModel = "apple/foundation";
    } else if (requestedModel?.startsWith("ollama/")) {
      // Ollama — text only for now
      const msgs = conv.messages.slice(-20, -1).map(m => ({ role: m.role, content: m.content }));
      replyText = await chatWithOllama(requestedModel.replace("ollama/", ""), system, msgs);
      usedModel = requestedModel;
    } else if (process.env.GEMINI_API_KEY) {
      const history = conv.messages.slice(-21, -1).map(m => ({
        role: m.role === "user" ? "user" : "model" as const,
        parts: [{ text: m.content }],
      }));
      const gemini = getGemini();
      const modelId = requestedModel || DEFAULT_GEMINI_MODEL;

      if (attachments.length > 0) {
        // Multimodal: use generateContent with inline data
        const userParts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [
          { text: text },
          ...attachments.map(a => ({
            inlineData: { mimeType: a.mimeType, data: a.data },
          })),
        ];
        const r = await gemini.models.generateContent({
          model: modelId,
          contents: [
            ...history.map(h => ({ role: h.role, parts: h.parts })),
            { role: "user" as const, parts: userParts },
          ],
          config: { systemInstruction: system },
        });
        replyText = r.text ?? "";
      } else {
        // Text-only: chat session with Brain Engine tool calling
        const chat = gemini.chats.create({
          model: modelId,
          config: {
            systemInstruction: system,
            tools: [{
              functionDeclarations: brainEngineTools.map(t => ({
                name: t.name,
                description: t.description,
                parameters: t.parameters,
              })),
            }],
          },
          history,
        });
        let r = await chat.sendMessage({ message: text });

        // Execute any daemon tool calls the model requests (bounded rounds).
        for (let round = 0; round < 4 && r.functionCalls?.length; round++) {
          const responseParts = [];
          for (const call of r.functionCalls) {
            const tool = brainEngineTools.find(t => t.name === call.name);
            const result = tool
              ? await tool.execute(call.args as Record<string, unknown> | undefined)
              : { error: `Unknown tool: ${call.name}` };
            responseParts.push({ functionResponse: { name: call.name ?? "", response: { result } } });
          }
          r = await chat.sendMessage({ message: responseParts });
        }
        replyText = r.text ?? "";
      }
      usedModel = modelId;
    } else {
      replyText = "⚠️ No AI model configured. Set GEMINI_API_KEY in env vars, or run Ollama locally and select an Ollama model.";
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

// ─── Knowledge Base ───────────────────────────────────────────────────────────

app.get("/api/sa/kb", requireAuth, (req, res) => {
  const entries = loadAllKBEntries();
  res.json({ entries, total: entries.length });
});

app.post("/api/sa/kb/search", requireAuth, (req, res) => {
  const { query, limit } = req.body as { query: string; limit?: number };
  if (!query) return res.status(400).json({ error: "Query required" });
  res.json({ results: searchKB(query, loadAllKBEntries(), limit || 10) });
});

app.post("/api/sa/kb", requireAuth, (req, res) => {
  const { title, content, tags, source } = req.body as Partial<KBEntry>;
  if (!title || !content) return res.status(400).json({ error: "title and content required" });
  const entry: KBEntry = {
    id: crypto.randomUUID(), title: title.trim(), content: content.trim(),
    tags: Array.isArray(tags) ? tags : [],
    source: (source as KBEntry["source"]) || "manual",
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  };
  saveKBEntry(entry);
  res.json(entry);
});

app.put("/api/sa/kb/:id", requireAuth, (req, res) => {
  const fp = path.join(SA_KB_DIR, `${req.params.id}.json`);
  if (!fs.existsSync(fp)) return res.status(404).json({ error: "Not found" });
  const existing = JSON.parse(fs.readFileSync(fp, "utf-8")) as KBEntry;
  const { title, content, tags } = req.body as Partial<KBEntry>;
  const updated = { ...existing, title: title?.trim() ?? existing.title, content: content?.trim() ?? existing.content, tags: Array.isArray(tags) ? tags : existing.tags, updatedAt: new Date().toISOString() };
  saveKBEntry(updated);
  res.json(updated);
});

app.delete("/api/sa/kb/:id", requireAuth, (req, res) => { deleteKBEntry(req.params.id); res.json({ deleted: true }); });

app.post("/api/sa/kb/import-cursor-chat", requireAuth, (req, res) => {
  const { rawText, title } = req.body as { rawText: string; title?: string };
  if (!rawText) return res.status(400).json({ error: "rawText required" });
  let content = rawText;
  let parsedTitle = title || "Cursor Chat Import";
  try {
    const p = JSON.parse(rawText);
    if (Array.isArray(p)) { content = p.map((m: any) => `${m.role ?? "?"}: ${m.content ?? ""}`).join("\n\n"); parsedTitle = title || `Chat (${p.length} msgs)`; }
    else if (p.messages) { content = p.messages.map((m: any) => `${m.role}: ${m.content}`).join("\n\n"); parsedTitle = title || p.title || "Cursor Chat"; }
  } catch { /* plain text */ }
  const words = content.toLowerCase().split(/\W+/);
  const kwds = ["typescript","react","express","vite","gemini","ollama","cursor","myk","askmyk"];
  const tags = kwds.filter(k => words.includes(k));
  const entry: KBEntry = { id: crypto.randomUUID(), title: parsedTitle, content: content.slice(0, 50000), tags, source: "cursor-chat", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  saveKBEntry(entry);
  res.json({ entry, charCount: content.length });
});

// ─── Prompt Optimizer ─────────────────────────────────────────────────────────

app.post("/api/sa/optimize-prompt", requireAuth, async (req, res) => {
  const { rawPrompt } = req.body as { rawPrompt: string };
  if (!rawPrompt) return res.status(400).json({ error: "rawPrompt required" });
  const taskType = detectTaskType(rawPrompt);

  const CATALOG: Record<string, { label: string; cost: PromptVariant["estimatedCost"]; strengths: string }> = {
    "gemini-3.6-flash":       { label: "Gemini 3.6 Flash",           cost: "low",    strengths: "Fast, great for quick tasks and summaries" },
    "gemini-2.5-flash":       { label: "Gemini 2.5 Flash",           cost: "medium", strengths: "Balanced — coding, structured output" },
    "gemini-2.5-pro":         { label: "Gemini 2.5 Pro",             cost: "high",   strengths: "Deep reasoning, complex code, highest accuracy" },
    "gemini-3.5-flash-lite":  { label: "Gemini 3.5 Flash Lite",      cost: "free",   strengths: "Ultra-fast, minimal tasks" },
    "apple/foundation":       { label: "Apple Intelligence",          cost: "free",   strengths: "100% on-device, private, Neural Engine, no cloud" },
    "ollama/llama3":          { label: "Llama 3 (Local)",            cost: "free",   strengths: "Private, local, general-purpose" },
    "ollama/mistral":         { label: "Mistral (Local)",            cost: "free",   strengths: "Fast local coding + reasoning" },
    "ollama/codellama":       { label: "Code Llama (Local)",         cost: "free",   strengths: "Local code generation" },
  };

  const ROUTES: Record<string, Array<{ model: string; complexity: PromptVariant["complexity"]; useCase: string }>> = {
    coding:   [{ model: "gemini-2.5-flash", complexity: "balanced", useCase: "Code with good reasoning" }, { model: "gemini-2.5-pro", complexity: "thorough", useCase: "Complex architecture / debugging" }, { model: "ollama/codellama", complexity: "fast", useCase: "Local code generation — free" }],
    creative: [{ model: "gemini-2.5-flash", complexity: "balanced", useCase: "Copy, emails, content" }, { model: "gemini-2.5-pro", complexity: "thorough", useCase: "Long-form, brand narrative" }, { model: "ollama/llama3", complexity: "fast", useCase: "Draft locally, iterate free" }],
    analysis: [{ model: "gemini-2.5-pro", complexity: "thorough", useCase: "Deep analysis, reports" }, { model: "gemini-2.5-flash", complexity: "balanced", useCase: "Summaries at lower cost" }, { model: "apple/foundation", complexity: "fast", useCase: "Private on-device analysis" }],
    research: [{ model: "gemini-2.5-flash", complexity: "balanced", useCase: "Research summaries" }, { model: "gemini-3.6-flash", complexity: "fast", useCase: "Quick lookups" }, { model: "apple/foundation", complexity: "fast", useCase: "Private research, no data sharing" }],
    quick:    [{ model: "gemini-3.6-flash", complexity: "fast", useCase: "Fast answer" }, { model: "apple/foundation", complexity: "fast", useCase: "On-device, zero cost" }, { model: "gemini-3.5-flash-lite", complexity: "fast", useCase: "Cheapest cloud option" }],
    general:  [{ model: "gemini-3.6-flash", complexity: "fast", useCase: "Good balance" }, { model: "ollama/llama3", complexity: "balanced", useCase: "Free local model" }, { model: "apple/foundation", complexity: "fast", useCase: "Private on-device" }],
  };

  const routes = ROUTES[taskType] ?? ROUTES.general;

  if (process.env.GEMINI_API_KEY) {
    try {
      const gemini = getGemini();
      const r = await gemini.models.generateContent({
        model: DEFAULT_GEMINI_MODEL,
        contents: `You are an expert prompt engineer for Designs by Myk LLC's Super Agent.\nRaw request: "${rawPrompt}"\nTask type: ${taskType}\nGenerate ${routes.length} improved variants for: ${routes.map((r, i) => `Variant ${i+1}: ${CATALOG[r.model]?.label} — ${r.useCase}`).join("; ")}\nReturn JSON: {"taskType":"${taskType}","variants":[{"promptText":"...","rationale":"..."}]}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: { type: Type.OBJECT, properties: { taskType: { type: Type.STRING }, variants: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { promptText: { type: Type.STRING }, rationale: { type: Type.STRING } }, required: ["promptText","rationale"] } } }, required: ["taskType","variants"] },
        },
      });
      const parsed = JSON.parse(r.text || "{}") as { variants: Array<{ promptText: string; rationale: string }> };
      const variants: PromptVariant[] = routes.map((route, i) => ({
        promptText: parsed.variants?.[i]?.promptText ?? rawPrompt,
        model: route.model, modelLabel: CATALOG[route.model]?.label ?? route.model,
        rationale: parsed.variants?.[i]?.rationale ?? CATALOG[route.model]?.strengths ?? "",
        useCase: route.useCase, estimatedCost: CATALOG[route.model]?.cost ?? "low", complexity: route.complexity,
      }));
      return res.json({ taskType, variants });
    } catch { /* fallback */ }
  }

  const variants: PromptVariant[] = routes.map(route => ({
    promptText: route.complexity === "thorough" ? `${rawPrompt}\n\nBe thorough: explain step-by-step, cover edge cases, format with headers.` : rawPrompt,
    model: route.model, modelLabel: CATALOG[route.model]?.label ?? route.model,
    rationale: CATALOG[route.model]?.strengths ?? "", useCase: route.useCase,
    estimatedCost: CATALOG[route.model]?.cost ?? "low", complexity: route.complexity,
  }));
  res.json({ taskType, variants });
});

// ─── Local Models ─────────────────────────────────────────────────────────────

app.get("/api/sa/local-models", requireAuth, async (req, res) => res.json(await checkOllama()));
app.get("/api/sa/apple-ai", requireAuth, async (req, res) => res.json({ ...(await checkAppleAI()), url: process.env.APPLE_AI_URL || "http://localhost:11435/v1" }));

app.post("/api/sa/local-models/pull", requireAuth, async (req, res) => {
  const { model } = req.body as { model: string };
  if (!model) return res.status(400).json({ error: "model required" });
  try {
    const r = await fetch(`${process.env.OLLAMA_URL || "http://localhost:11434"}/api/pull`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: model, stream: false }), signal: AbortSignal.timeout(300000) });
    res.json({ ok: r.ok, status: r.status });
  } catch (err: any) { res.status(503).json({ error: err.message }); }
});

// ─── Server ───────────────────────────────────────────────────────────────────

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ server: { middlewareMode: true, allowedHosts: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    const dist = path.join(process.cwd(), "dist");
    app.get("/", (req, res) => res.sendFile(path.join(dist, "index.html")));
    app.use(express.static(dist));
    app.get("*", (req, res) => res.sendFile(path.join(dist, "index.html")));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`MYK Super Agent running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
