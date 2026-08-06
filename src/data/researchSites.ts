/**
 * Curated AI research sites and Substack RSS feeds.
 * These are fetched by /api/ai-research to surface news about:
 *   - AI token pricing and usage tips
 *   - New/free AI tools (e.g. Microsoft MAI-Code, open-source releases)
 *   - Prompt engineering and LLM developments
 */

export interface ResearchSite {
  id: string;
  name: string;
  url: string;         // Human-readable URL
  rssUrl: string;      // RSS/Atom feed URL
  category: "substack" | "tech-blog" | "official" | "community";
  description: string;
  tags: string[];
}

export const RESEARCH_SITES: ResearchSite[] = [
  // ─── Substack AI Newsletters ──────────────────────────────────────────────
  {
    id: "bens-bites",
    name: "Ben's Bites",
    url: "https://www.bensbites.com",
    rssUrl: "https://bensbites.beehiiv.com/feed",
    category: "substack",
    description: "Daily AI news digest — new models, tools, and cost breakdowns",
    tags: ["ai-news", "tools", "models", "pricing"],
  },
  {
    id: "one-useful-thing",
    name: "One Useful Thing",
    url: "https://www.oneusefulthing.org",
    rssUrl: "https://www.oneusefulthing.org/feed",
    category: "substack",
    description: "Ethan Mollick's newsletter on practical AI use and productivity",
    tags: ["ai-usage", "productivity", "prompt-engineering"],
  },
  {
    id: "interconnects",
    name: "Interconnects",
    url: "https://www.interconnects.ai",
    rssUrl: "https://www.interconnects.ai/feed",
    category: "substack",
    description: "Nathan Lambert on open-source LLMs, RLHF, and new model releases",
    tags: ["open-source", "llm", "models", "free-ai"],
  },
  {
    id: "import-ai",
    name: "Import AI",
    url: "https://jack-clark.net",
    rssUrl: "https://jack-clark.net/feed",
    category: "substack",
    description: "Jack Clark's weekly AI research digest — safety, capabilities, new releases",
    tags: ["research", "safety", "models", "releases"],
  },
  {
    id: "ai-supremacy",
    name: "AI Supremacy",
    url: "https://aisupremacy.substack.com",
    rssUrl: "https://aisupremacy.substack.com/feed",
    category: "substack",
    description: "Michael Spencer on new AI products, Microsoft, and enterprise AI",
    tags: ["microsoft", "enterprise", "new-releases", "mai"],
  },
  {
    id: "substack-ai-tag",
    name: "Substack AI Discover",
    url: "https://substack.com/browse/ai",
    rssUrl: "https://substack.com/browse/ai.rss",
    category: "substack",
    description: "Substack's curated AI category — aggregates top AI newsletters",
    tags: ["ai-news", "curated", "tokens", "tools"],
  },
  // ─── Simon Willison — token/cost optimization authority ──────────────────
  {
    id: "simon-willison",
    name: "Simon Willison's Blog",
    url: "https://simonwillison.net",
    rssUrl: "https://simonwillison.net/atom/everything/",
    category: "tech-blog",
    description: "Deep dives into open-source AI workflows, token efficiency, and LLM tooling",
    tags: ["open-source", "token-optimization", "prompt-engineering", "free-ai", "cost"],
  },
  // ─── Community: Hacker News AI filter ────────────────────────────────────
  {
    id: "hn-ai",
    name: "Hacker News — AI",
    url: "https://news.ycombinator.com",
    rssUrl: "https://hnrss.org/newest?q=AI+tokens+OR+free+API+OR+open+source+LLM+OR+prompt&count=20",
    category: "community",
    description: "HN posts about AI tokens, free APIs, open-source LLMs, and prompt hacks",
    tags: ["community", "ai-news", "free-api", "token-optimization"],
  },
  // ─── Community: Reddit r/LocalLLaMA ──────────────────────────────────────
  {
    id: "reddit-localllama",
    name: "r/LocalLLaMA",
    url: "https://www.reddit.com/r/LocalLLaMA",
    rssUrl: "https://www.reddit.com/r/LocalLLaMA/.rss?limit=15",
    category: "community",
    description: "Reddit's hub for running LLMs locally — free, offline, zero API cost",
    tags: ["local-ai", "free-ai", "open-source", "llm", "zero-cost"],
  },
  // ─── Community: Reddit r/PromptEngineering ───────────────────────────────
  {
    id: "reddit-prompt",
    name: "r/PromptEngineering",
    url: "https://www.reddit.com/r/PromptEngineering",
    rssUrl: "https://www.reddit.com/r/PromptEngineering/.rss?limit=15",
    category: "community",
    description: "Prompt blueprints, secret codes, and token-saving system instructions",
    tags: ["prompt-engineering", "token-optimization", "system-prompts", "tips"],
  },
  // ─── Official Tech Blogs ──────────────────────────────────────────────────
  {
    id: "microsoft-ai-blog",
    name: "Microsoft AI Blog",
    url: "https://blogs.microsoft.com/ai",
    rssUrl: "https://blogs.microsoft.com/ai/feed",
    category: "official",
    description: "Official Microsoft announcements — MAI-Code, Copilot, Azure AI",
    tags: ["microsoft", "mai-code", "copilot", "free-tier"],
  },
  {
    id: "openai-blog",
    name: "OpenAI News",
    url: "https://openai.com/news",
    rssUrl: "https://openai.com/news/rss.xml",
    category: "official",
    description: "OpenAI model releases, pricing changes, and API updates",
    tags: ["openai", "gpt", "pricing", "tokens", "api"],
  },
  {
    id: "google-ai-blog",
    name: "Google AI Blog",
    url: "https://blog.google/technology/ai",
    rssUrl: "https://blog.google/technology/ai/rss",
    category: "official",
    description: "Google Gemini, DeepMind releases, and free AI tools",
    tags: ["google", "gemini", "free-ai", "releases"],
  },
  {
    id: "openrouter-blog",
    name: "OpenRouter Blog",
    url: "https://openrouter.ai/blog",
    rssUrl: "https://openrouter.ai/blog/rss.xml",
    category: "tech-blog",
    description: "Multi-model routing, free daily request quotas, and zero-cost LLM workflows",
    tags: ["openrouter", "free-api", "multi-model", "zero-cost", "daily-quota"],
  },
];

/** Curated expert resources — no RSS, displayed as link cards */
export interface CuratedResource {
  id: string;
  name: string;
  role: string;
  url: string;
  platform: string;
  platformIcon: "youtube" | "x" | "linkedin" | "instagram" | "web" | "github";
  description: string;
  focus: "token-optimization" | "free-models" | "prompt-engineering" | "free-credits";
  badge?: string; // e.g., "Top Follow", "Free Credits"
}

export const CURATED_RESOURCES: CuratedResource[] = [
  // ── Token Optimization & Cost Reduction ───────────────────────────────────
  {
    id: "mckay-wrigley",
    name: "McKay Wrigley",
    role: "AI Developer / Educator",
    url: "https://www.youtube.com/@mckaywrigley",
    platform: "YouTube + X",
    platformIcon: "youtube",
    description: "Practical setups for complex AI apps and agents with strict token limits. Watch for multi-agent pipelines built on cheap open models.",
    focus: "token-optimization",
    badge: "Top Follow",
  },
  {
    id: "simon-willison-resource",
    name: "Simon Willison",
    role: "Developer & Open-Source Advocate",
    url: "https://simonwillison.net",
    platform: "Blog + X",
    platformIcon: "web",
    description: "Breaks down open-source workflows that let you avoid premium pricing entirely. Blog + Datasette LLM library are must-reads.",
    focus: "token-optimization",
    badge: "Advanced",
  },
  {
    id: "allie-k-miller",
    name: "Allie K. Miller",
    role: "AI Business Expert",
    url: "https://www.linkedin.com/in/alliekmiller/",
    platform: "LinkedIn + X",
    platformIcon: "linkedin",
    description: '"Lightning-fast" AI efficiency tips. Teaches lean prompting — choosing lightweight models over burning money on frontier models.',
    focus: "token-optimization",
  },
  // ── Free AI Model Tiers & API Credits ────────────────────────────────────
  {
    id: "ai-perks",
    name: "Get AI Perks",
    role: "Free Credits Directory",
    url: "https://getaiperks.com",
    platform: "Web",
    platformIcon: "web",
    description: "Maps out hundreds of dollars in free sign-up bonuses across OpenAI, Anthropic, and Google AI Studio. Essential for bootstrappers.",
    focus: "free-credits",
    badge: "Free $$$",
  },
  {
    id: "openrouter-resource",
    name: "OpenRouter",
    role: "Multi-Model Gateway",
    url: "https://openrouter.ai",
    platform: "Platform",
    platformIcon: "web",
    description: "Free daily request quotas on dozens of open-source models. Build side projects for $0. Supports Llama, Mistral, Gemma, and more.",
    focus: "free-models",
    badge: "Free Tier",
  },
  {
    id: "google-ai-studio-resource",
    name: "Google AI Studio",
    role: "Free Dev Platform",
    url: "https://aistudio.google.com",
    platform: "Platform",
    platformIcon: "web",
    description: "Most generous sustained free tier for developers — massive context windows, Gemini 1.5 Flash, and no forced paid plan for prototyping.",
    focus: "free-models",
    badge: "Free Tier",
  },
  // ── Prompt Engineering & Secret Codes ────────────────────────────────────
  {
    id: "sufyan-maan",
    name: "Sufyan Maan",
    role: "Prompt Engineer / Creator",
    url: "https://x.com/sufyan_maan",
    platform: "Instagram + X",
    platformIcon: "x",
    description: 'Posts "secret code" prompt blueprints: /deepthink, PARETO, /autoprompt — paste into system instructions to cut "yapping" and save up to 40% in tokens.',
    focus: "prompt-engineering",
    badge: "Secret Codes",
  },
];

/** Token-saving quick tips shown in the Tips tab */
export interface TokenTip {
  id: string;
  title: string;
  detail: string;
  savings?: string;
  category: "output" | "caching" | "context" | "model" | "prompt";
}

export const TOKEN_TIPS: TokenTip[] = [
  {
    id: "stop-yapping",
    title: "Stop the Yapping",
    detail: 'Add to your system prompt: "Never write a README, preamble, or pleasantry. Output code/answers only." Output tokens cost 3–5× more than input tokens — eliminating filler is the fastest win.',
    savings: "20–40% output reduction",
    category: "output",
  },
  {
    id: "prompt-caching",
    title: "Use Prompt Caching",
    detail: "When using large system prompts, use providers that support context caching (Anthropic, Google Gemini). You only pay for the setup prompt once — subsequent calls re-use the cached prefix at a fraction of the cost.",
    savings: "Up to 90% on repeated calls",
    category: "caching",
  },
  {
    id: "clear-chat",
    title: "Clear the Chat History",
    detail: "Carrying an infinite chat history means you pass all old, dead text back with every single message. Every new message re-sends everything above it. Start fresh sessions for unrelated tasks.",
    savings: "Exponential compounding avoided",
    category: "context",
  },
  {
    id: "right-model",
    title: "Match Model to Task",
    detail: 'Use frontier models (GPT-4o, Claude Opus) only for hard reasoning. Use Flash, Haiku, or free open-source models (Llama, Mistral via OpenRouter) for drafting, formatting, and simple Q&A.',
    savings: "10–100× cheaper per call",
    category: "model",
  },
  {
    id: "secret-codes",
    title: "Sufyan's Prompt Codes",
    detail: 'Add these to your system instructions: "/deepthink" (forces step-by-step reasoning), "PARETO" (focus on 20% of effort that gives 80% of output), "/autoprompt" (lets the AI rewrite your next prompt for you before answering).',
    savings: "Up to 40% token reduction",
    category: "prompt",
  },
  {
    id: "free-credits",
    title: "Claim Free API Credits First",
    detail: "Before paying, visit getaiperks.com to claim sign-up bonuses across OpenAI, Anthropic, and Google. Use Google AI Studio free tier for prototyping (Gemini 1.5 Flash is free up to 15 req/min). Use OpenRouter for free daily quotas on open-source models.",
    category: "model",
    badge: "Free $$$",
  } as unknown as TokenTip,
  {
    id: "lean-input",
    title: "Compress Your Input",
    detail: 'Paste code snippets, not entire files. Use comments like "// rest of class unchanged" instead of repeating unedited code. Summarize context instead of copy-pasting paragraphs.',
    savings: "30–60% input reduction",
    category: "output",
  },
] as TokenTip[];

/** Topics used to filter article relevance in Gemini summarization */
export const AI_RESEARCH_TOPICS = [
  "AI tokens",
  "token pricing",
  "free AI tools",
  "Microsoft MAI-Code",
  "MAI-1",
  "new AI model",
  "open-source LLM",
  "prompt engineering",
  "AI cost savings",
  "free tier AI",
  "AI news",
  "Copilot",
  "Claude",
  "Gemini",
  "GPT",
  "Llama",
  "Mistral",
  "OpenRouter",
  "Google AI Studio",
  "API credits",
  "token optimization",
];
