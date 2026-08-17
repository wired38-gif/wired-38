import express from "express";
import path from "path";
import crypto from "crypto";
import fs from "fs";
import type { Request, Response, NextFunction } from "express";
import { GoogleGenAI } from "@google/genai";
import { config as loadEnv } from "dotenv";
import { createServer as createViteServer } from "vite";

loadEnv({ path: [".env.local", ".env"] });

const app = express();
const PORT = Number(process.env.PORT || 3001);

app.use(express.json());
app.set("trust proxy", 1);

// ─── Data directory ───────────────────────────────────────────────────────────

const DATA_DIR =
  process.env.NODE_ENV === "production"
    ? "/opt/render/project/src/data"
    : path.join(process.cwd(), "data");

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

// ─── Admin auth ───────────────────────────────────────────────────────────────

const SESSION_COOKIE = "qc_admin_session";
const SESSION_TTL = 8 * 60 * 60; // 8 hours

function getAdminCreds() {
  return {
    username: process.env.QC_ADMIN_USERNAME ?? process.env.ADMIN_USERNAME,
    password: process.env.QC_ADMIN_PASSWORD ?? process.env.ADMIN_PASSWORD,
    secret:   process.env.QC_AUTH_SECRET    ?? process.env.AUTH_SECRET ?? process.env.ADMIN_PASSWORD ?? "",
  };
}

function hashValue(v: string) {
  return crypto.createHash("sha256").update(v).digest();
}

function constantTimeEqual(a: string, b: string) {
  return crypto.timingSafeEqual(hashValue(a), hashValue(b));
}

function signPayload(encoded: string, secret: string) {
  return crypto.createHmac("sha256", secret).update(encoded).digest("base64url");
}

function createToken(username: string) {
  const { secret } = getAdminCreds();
  const payload = Buffer.from(JSON.stringify({ sub: username, exp: Date.now() + SESSION_TTL * 1000 })).toString("base64url");
  return `${payload}.${signPayload(payload, secret)}`;
}

function parseCookies(header: string | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!header) return out;
  for (const part of header.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k && v.length) out[k] = decodeURIComponent(v.join("="));
  }
  return out;
}

function verifyToken(token: string | undefined): boolean {
  if (!token) return false;
  const { secret } = getAdminCreds();
  const [encoded, sig] = token.split(".");
  if (!encoded || !sig) return false;
  if (!constantTimeEqual(sig, signPayload(encoded, secret))) return false;
  try {
    const p = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as { exp: number };
    return p.exp > Date.now();
  } catch {
    return false;
  }
}

function isAuthenticated(req: Request): boolean {
  return verifyToken(parseCookies(req.headers.cookie)[SESSION_COOKIE]);
}

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!isAuthenticated(req)) {
    res.status(401).json({ error: "Authentication required." });
    return;
  }
  next();
}

function sessionCookie(token: string, req: Request): string {
  const secure = req.secure || process.env.NODE_ENV === "production";
  const parts = [`${SESSION_COOKIE}=${encodeURIComponent(token)}`, "HttpOnly", "SameSite=Lax", "Path=/", `Max-Age=${SESSION_TTL}`];
  if (secure) parts.push("Secure");
  return parts.join("; ");
}

// ─── Support tickets ──────────────────────────────────────────────────────────

const TICKETS_FILE = path.join(DATA_DIR, "queen_tickets.json");

interface SupportTicket {
  id: string;
  name: string;
  email: string;
  issueType: string;
  description: string;
  status: "open" | "in-progress" | "resolved";
  createdAt: string;
  updatedAt: string;
}

type TicketStore = Record<string, SupportTicket>;

function loadTickets(): TicketStore {
  try {
    ensureDataDir();
    if (fs.existsSync(TICKETS_FILE)) return JSON.parse(fs.readFileSync(TICKETS_FILE, "utf-8")) as TicketStore;
  } catch { /* ignore */ }
  return {};
}

function saveTickets(store: TicketStore) {
  try {
    ensureDataDir();
    fs.writeFileSync(TICKETS_FILE, JSON.stringify(store, null, 2));
  } catch { /* ignore */ }
}

// ─── Gemini client ────────────────────────────────────────────────────────────

let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error("GEMINI_API_KEY not configured.");
    aiClient = new GoogleGenAI({ apiKey: key });
  }
  return aiClient;
}

// ─── Queen system prompt ──────────────────────────────────────────────────────

const QUEEN_SYSTEM_PROMPT = `You are "Queen" — the warm, stylish, and knowledgeable AI assistant for Queenscustoms.shop, a premium custom goods boutique founded by creative entrepreneur and designer Mykiesha (known lovingly as "Queen" by her community). You speak with confidence, warmth, and a touch of royal flair. Use 👑 sparingly to accent key moments.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ABOUT QUEENSCUSTOMS.SHOP
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Queenscustoms.shop is a boutique custom-design shop offering high-quality personalized products for individuals, businesses, and special occasions. Everything is made with love, precision, and a regal touch. The creator — Mykiesha — has been designing and crafting custom pieces for years, building a loyal community of clients who keep coming back because every order is treated like royalty.

CREATOR BIO — MYKIESHA ("QUEEN"):
Mykiesha is a self-taught designer and entrepreneur with a passion for turning ideas into tangible, beautiful products. She founded Queenscustoms.shop to give people a place where personalization meets luxury. Her aesthetic is bold, elegant, and intentional — from her signature pink-and-black branding to the crown motif that represents her belief that everyone deserves to feel like royalty. She handles every custom order personally, ensuring quality and attention to detail in each piece.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PRODUCTS & SERVICES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CUSTOM APPAREL:
- Custom T-Shirts (adult & youth sizes, S–4XL)
- Hoodies & Sweatshirts (pullover and zip-up)
- Tank Tops & Crop Tops
- Matching Sets / Couples Outfits
- Sports & Activewear
- Business Uniforms & Team Gear

PERSONALIZED ACCESSORIES & GIFTS:
- Custom Tumblers & Cups (Stanleys, 30oz, travel mugs)
- Personalized Jewelry (name necklaces, bracelets, charm sets)
- Custom Bags & Totes
- Keychains & Lanyards
- Hats & Beanies
- Phone Cases

SPECIALTY & EVENT ITEMS:
- Birthday Sashes, Crowns & Party Kits
- Baby Shower & Gender Reveal Sets
- Wedding & Bridal Party Packages
- Memorial & Tribute Items
- Business Branding Packages (logos, business cards, banners)
- Graduation & Achievement Gifts

HOME & LIFESTYLE:
- Custom Pillows & Blankets
- Doormats
- Custom Wall Art / Prints
- Mugs & Coasters

DIGITAL SERVICES:
- Custom Logo Design
- Flyer & Graphic Design
- Social Media Graphics
- Brand Identity Packages

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ORDERING PROCESS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
HOW TO ORDER:
1. Browse the website or reach out with your custom request
2. Provide your design details: text, colors, sizes, quantity, and any reference images
3. Receive a design proof/mockup for approval (usually within 24–48 hours)
4. Review and approve (one free revision included per order)
5. Pay in full before production begins
6. Your order goes into production
7. Receive your items! 👑

DESIGN SUBMISSIONS:
- Send design ideas, text, images, or inspiration to the shop via the website contact form or DMs
- High-resolution files preferred (PNG, JPG, PDF)
- If you don't have a design idea, Queen can create one for you!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PRICING & PAYMENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Pricing varies by product type, quantity, and customization complexity
- Bulk discounts available for orders of 6+ items
- Payment methods accepted: Cash App, Zelle, PayPal, Credit/Debit Card
- Payment is due in full before production begins
- Rush order fee applies for expedited turnaround

PRICING GUIDES (approximate):
- Custom T-Shirts: starting at $25
- Hoodies: starting at $45
- Custom Tumblers: starting at $35
- Jewelry: starting at $20
- Digital Design: starting at $15
- Event packages: varies, contact for quote

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TURNAROUND TIMES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Standard: 7–10 business days after proof approval and payment
- Rush (3–5 business days): available for additional fee
- Large orders (25+ items): 14–21 business days
- Digital designs: 24–72 hours
- Holidays and peak seasons (Mother's Day, Christmas, etc.) may extend timelines — order early!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SHIPPING & DELIVERY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Ships nationwide within the United States
- Standard shipping: 3–7 business days after production
- Expedited shipping available at checkout
- Local pickup available (contact for details)
- Tracking number provided once order ships
- International shipping: contact for rates and availability

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RETURNS & REFUNDS POLICY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
IMPORTANT — Custom items are made specifically for you:
- All sales on CUSTOM items are FINAL — no returns or exchanges unless there is a production error on our part
- If we made a mistake (wrong text, wrong size, wrong color from approved proof), we will remake or refund
- Size exchanges are not available for custom items — please double-check size charts before ordering
- Damaged/defective items must be reported within 5 business days of delivery with photo evidence
- Non-custom/ready-made items may be returned within 14 days of delivery in original unused condition

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONTACT & SUPPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Website: queenscustoms.shop
- Response time: within 24–48 business hours
- Follow on Instagram/TikTok: @queenscustoms
- For urgent inquiries: use the support ticket feature in this chat

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RESPONSE RULES FOR QUEEN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Be warm, friendly, and confident — you represent a premium brand
2. Always offer to help create a support ticket if the client has an issue or needs follow-up
3. If someone wants to place an order or needs a custom quote, guide them through the process and encourage them to submit a support ticket or contact form with their details
4. Keep responses concise and helpful — no walls of text
5. Use bullet points for lists of products, steps, or pricing
6. If you don't know something specific (like a real-time price or current sale), say "For the most current pricing, please reach out directly or submit a support ticket and Queen will get back to you within 24 hours"
7. When a user mentions wanting to create a ticket, end your response with: [ACTION:create-ticket]
8. When a user wants to see products or place an order, you can say: [ACTION:view-products]
9. Always sign off warmly — this is a luxury boutique brand

Remember: Every client is royalty. 👑`;

// ─── API routes ───────────────────────────────────────────────────────────────

app.get("/api/status", (_req, res) => {
  res.json({ status: "ok", app: "queenscustoms", hasApiKey: !!process.env.GEMINI_API_KEY });
});

// Admin login
app.post("/api/admin/login", (req, res) => {
  const { username, password } = req.body as { username: string; password: string };
  const creds = getAdminCreds();
  if (!creds.username || !creds.password) {
    return res.status(503).json({ error: "Admin credentials not configured." });
  }
  const validUser = typeof username === "string" && constantTimeEqual(username, creds.username);
  const validPass = typeof password === "string" && constantTimeEqual(password, creds.password);
  if (!validUser || !validPass) {
    return res.status(401).json({ error: "Invalid credentials." });
  }
  res.setHeader("Set-Cookie", sessionCookie(createToken(username), req));
  return res.json({ authenticated: true });
});

app.post("/api/admin/logout", (_req, res) => {
  res.setHeader("Set-Cookie", `${SESSION_COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`);
  return res.json({ authenticated: false });
});

app.get("/api/admin/me", (req, res) => {
  res.json({ authenticated: isAuthenticated(req) });
});

// Queen chat
app.post("/api/queen-chat", async (req, res) => {
  const { message, history = [] } = req.body as {
    message: string;
    history: Array<{ role: "user" | "model"; parts: Array<{ text: string }> }>;
  };

  if (!message?.trim()) return res.status(400).json({ error: "Message is required." });

  try {
    if (process.env.GEMINI_API_KEY) {
      const ai = getAiClient();
      const chat = ai.chats.create({
        model: "gemini-2.0-flash",
        config: { systemInstruction: QUEEN_SYSTEM_PROMPT },
        history,
      });
      const response = await chat.sendMessage({ message });
      return res.json({ reply: response.text ?? "I'm having trouble right now — please try again!" });
    }

    // Keyword fallback
    const q = message.toLowerCase();
    let reply = "";
    if (q.includes("price") || q.includes("cost") || q.includes("how much")) {
      reply = "Here's a quick pricing guide 👑\n\n- **Custom T-Shirts**: starting at $25\n- **Hoodies**: starting at $45\n- **Tumblers**: starting at $35\n- **Jewelry**: starting at $20\n- **Digital Design**: starting at $15\n\nBulk discounts for 6+ items! For a custom quote, submit a ticket and Queen will get back to you within 24 hours. [ACTION:create-ticket]";
    } else if (q.includes("order") || q.includes("how do i") || q.includes("process")) {
      reply = "Ready to order? Here's how:\n\n1. Share your design details (text, colors, sizes, quantity)\n2. Receive your proof in 24–48 hours\n3. Approve the proof (one free revision included)\n4. Pay in full to start production\n5. Your items ship! 👑\n\nWant to get started? [ACTION:create-ticket]";
    } else if (q.includes("shipping") || q.includes("delivery") || q.includes("how long")) {
      reply = "**Turnaround & Shipping** 👑\n\n- Standard production: 7–10 business days after proof approval\n- Rush orders (3–5 days): available for additional fee\n- Shipping: 3–7 business days after production\n- Tracking number provided when your order ships\n\nNeed it by a specific date? Let us know! [ACTION:create-ticket]";
    } else if (q.includes("return") || q.includes("refund") || q.includes("exchange")) {
      reply = "**Return Policy** — All custom items are final sale since they're made just for you. However:\n\n- If we made a production error, we'll remake or refund 100%\n- Damaged items must be reported within 5 business days with photos\n- Non-custom items can be returned within 14 days\n\nHave a concern? [ACTION:create-ticket]";
    } else if (q.includes("product") || q.includes("what do you sell") || q.includes("what can")) {
      reply = "Queenscustoms.shop offers 👑\n\n- **Apparel**: T-shirts, hoodies, matching sets, uniforms\n- **Accessories**: Tumblers, jewelry, bags, hats\n- **Events**: Birthday, wedding, graduation packages\n- **Home**: Pillows, blankets, wall art\n- **Digital**: Logo design, flyers, social media graphics\n\nEvery item is custom-made with love. What can I help you create?";
    } else if (q.includes("about") || q.includes("creator") || q.includes("mykiesha") || q.includes("who")) {
      reply = "**About Queen (Mykiesha)** 👑\n\nMykiesha is a self-taught designer and entrepreneur who founded Queenscustoms.shop to make personalization accessible to everyone. Her bold pink-and-black aesthetic and crown motif reflect her belief: *everyone deserves to feel like royalty.*\n\nShe personally handles every order to ensure quality and love in every piece.";
    } else if (q.includes("ticket") || q.includes("support") || q.includes("help") || q.includes("issue")) {
      reply = "I'd love to help! Let's get you a support ticket so Queen can personally follow up within 24 hours. [ACTION:create-ticket]";
    } else if (q.includes("contact") || q.includes("reach") || q.includes("social")) {
      reply = "**Reach Queenscustoms.shop:**\n\n- **Website**: queenscustoms.shop\n- **Social**: @queenscustoms (Instagram & TikTok)\n- **Response time**: within 24–48 business hours\n\nOr submit a support ticket right here! [ACTION:create-ticket]";
    } else {
      reply = "Hey, I'm Queen — your guide to Queenscustoms.shop! 👑\n\nI can help you with:\n- **Products & pricing** — custom apparel, gifts, accessories\n- **Ordering** — how to place your custom order\n- **Shipping & turnaround** — timelines and delivery\n- **Returns & support** — any issues with your order\n\nWhat would you like to know?";
    }
    return res.json({ reply });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Chat service error.";
    console.error("Queen chat error:", err);
    res.status(500).json({ error: message });
  }
});

// Submit support ticket (public)
app.post("/api/queen-ticket", (req, res) => {
  try {
    const { name, email, issueType, description } = req.body as {
      name: string; email: string; issueType: string; description: string;
    };
    if (!name || !email || !issueType || !description) {
      return res.status(400).json({ error: "All fields are required." });
    }
    const tickets = loadTickets();
    const id = `QC-${Date.now().toString(36).toUpperCase()}`;
    const now = new Date().toISOString();
    tickets[id] = {
      id, name: name.trim(), email: email.trim().toLowerCase(),
      issueType: issueType.trim(), description: description.trim(),
      status: "open", createdAt: now, updatedAt: now,
    };
    saveTickets(tickets);
    return res.json({
      success: true,
      ticketId: id,
      message: `Your ticket ${id} has been submitted! Queen will follow up at ${email.trim().toLowerCase()} within 24 hours. 👑`,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create ticket.";
    res.status(500).json({ error: message });
  }
});

// Admin: list tickets
app.get("/api/admin/tickets", requireAuth, (_req, res) => {
  const tickets = loadTickets();
  const list = Object.values(tickets).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  return res.json({ total: list.length, tickets: list });
});

// Admin: update ticket status
app.patch("/api/admin/tickets/:id", requireAuth, (req, res) => {
  const ticketId = String(req.params.id ?? "");
  const { status } = req.body as { status: SupportTicket["status"] };
  const tickets = loadTickets();
  const ticket = ticketId ? tickets[ticketId] : undefined;
  if (!ticket || !ticketId) return res.status(404).json({ error: "Ticket not found." });
  ticket.status = status;
  ticket.updatedAt = new Date().toISOString();
  tickets[ticketId] = ticket;
  saveTickets(tickets);
  return res.json({ success: true, ticket });
});

// ─── Dev / Prod server ────────────────────────────────────────────────────────

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true, allowedHosts: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const dist = path.join(process.cwd(), "dist");
    app.use(express.static(dist));
    app.get("*", (_req, res) => res.sendFile(path.join(dist, "index.html")));
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Queenscustoms.shop server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
