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
  category: "substack" | "tech-blog" | "official";
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
    id: "the-rundown-ai",
    name: "The Rundown AI",
    url: "https://therundown.ai",
    rssUrl: "https://www.therundownai.com/feed",
    category: "substack",
    description: "Daily AI news and free tool spotlights for non-technical users",
    tags: ["ai-news", "free-tools", "beginner"],
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
];

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
];
