import React, { useState } from "react";
import {
  CheckCircle2, Circle, ChevronRight, ChevronLeft, ExternalLink,
  Building2, Globe, CreditCard, Key, AlertTriangle, Copy, Eye, EyeOff,
  Plug, RefreshCw, ShieldCheck, Zap
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

type IntegrationId = "plaid" | "google" | "stripe";

interface Integration {
  id: IntegrationId;
  name: string;
  logo: React.ReactNode;
  description: string;
  tag: string;
  tagColor: string;
  steps: WizardStep[];
}

interface WizardStep {
  id: string;
  title: string;
  description: string;
  fields?: FieldDef[];
  note?: string;
  warning?: string;
  action?: {
    label: string;
    url: string;
  };
  codeSnippet?: string;
}

interface FieldDef {
  key: string;
  label: string;
  placeholder: string;
  type: "text" | "password" | "select";
  options?: string[];
  hint?: string;
}

// ─── Integration Definitions ─────────────────────────────────────────────────

const INTEGRATIONS: Integration[] = [
  {
    id: "plaid",
    name: "Plaid Bank Link",
    logo: <Building2 size={22} className="text-teal-400" />,
    description: "Let users securely connect their bank account so you can read balances and transactions.",
    tag: "Banking",
    tagColor: "bg-teal-600/20 text-teal-400 border-teal-500/30",
    steps: [
      {
        id: "plaid-account",
        title: "Create a Plaid Account",
        description: "Sign up at Plaid's developer portal. You'll get Sandbox credentials instantly — no approval needed to start testing.",
        action: { label: "Open Plaid Dashboard", url: "https://dashboard.plaid.com/signup" },
        note: "Sandbox is free and lets you simulate any bank login. Use 'user_good' / 'pass_good' as test credentials.",
      },
      {
        id: "plaid-keys",
        title: "Copy Your API Keys",
        description: "In the Plaid Dashboard, go to Keys. You need two values for your app.",
        fields: [
          { key: "clientId", label: "Client ID", placeholder: "e.g. 5f3a9d...", type: "text", hint: "Found under Team → Keys" },
          { key: "sandboxSecret", label: "Sandbox Secret", placeholder: "e.g. a9c131...", type: "password", hint: "Never commit this to git" },
        ],
        warning: "Keep your secret keys in .env.local only. Never put them in frontend code or commit them to GitHub.",
      },
      {
        id: "plaid-env",
        title: "Add Keys to Your .env.local",
        description: "Create or open .env.local in your project root and add these lines.",
        codeSnippet: `PLAID_CLIENT_ID=your_client_id_here
PLAID_SECRET=your_sandbox_secret_here
PLAID_ENV=sandbox`,
        note: "Switch PLAID_ENV to 'development' or 'production' when you're ready to go live.",
      },
      {
        id: "plaid-install",
        title: "Install the Plaid SDK",
        description: "Run this in your project terminal to add the Plaid Node.js library.",
        codeSnippet: `npm install plaid`,
        note: "This app uses Express on server.ts — you'll add Plaid routes there.",
      },
      {
        id: "plaid-link",
        title: "Launch Plaid Link (Frontend)",
        description: "Your server creates a link_token, your React frontend opens Plaid's hosted bank-login UI, and returns a public_token.",
        codeSnippet: `// In your React component
import { usePlaidLink } from 'react-plaid-link';

const { open } = usePlaidLink({
  token: linkToken,   // fetched from your server
  onSuccess: (publicToken) => {
    // send publicToken to your server to exchange
  },
});`,
        action: { label: "Plaid Link Docs", url: "https://plaid.com/docs/link/" },
      },
      {
        id: "plaid-exchange",
        title: "Exchange Token (Backend)",
        description: "Your server exchanges the public_token for a permanent access_token, then uses it to fetch account data.",
        codeSnippet: `// In server.ts
import { PlaidApi, Configuration, PlaidEnvironments } from 'plaid';
const client = new PlaidApi(new Configuration({
  basePath: PlaidEnvironments.sandbox,
  baseOptions: { headers: {
    'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
    'PLAID-SECRET': process.env.PLAID_SECRET,
  }},
}));

// Exchange public_token → access_token
const { data } = await client.itemPublicTokenExchange({
  public_token: req.body.publicToken,
});
const accessToken = data.access_token;`,
        note: "Store accessToken securely in your database. Never send it to the frontend.",
      },
    ],
  },
  {
    id: "google",
    name: "Google OAuth",
    logo: <Globe size={22} className="text-blue-400" />,
    description: "Allow users to sign in with their Google account and optionally access Google services (Calendar, Drive, etc.).",
    tag: "Sign-In",
    tagColor: "bg-blue-600/20 text-blue-400 border-blue-500/30",
    steps: [
      {
        id: "google-project",
        title: "Create a Google Cloud Project",
        description: "Go to the Google Cloud Console and create a new project for your app.",
        action: { label: "Open Google Cloud Console", url: "https://console.cloud.google.com/projectcreate" },
        note: "If you already have a project, just select it — no need to create another.",
      },
      {
        id: "google-consent",
        title: "Configure OAuth Consent Screen",
        description: "In your project, go to APIs & Services → OAuth consent screen. Set App name, support email, and your domain. Select External unless this is an internal Google Workspace tool.",
        note: "For testing, add your own email under Test Users so you can log in immediately without publishing.",
      },
      {
        id: "google-credentials",
        title: "Create OAuth 2.0 Credentials",
        description: "Go to APIs & Services → Credentials → Create Credentials → OAuth client ID. Select Web Application.",
        fields: [
          { key: "clientId", label: "Client ID", placeholder: "xxxx.apps.googleusercontent.com", type: "text", hint: "Paste from Google Credentials page" },
          { key: "clientSecret", label: "Client Secret", placeholder: "GOCSPX-...", type: "password", hint: "Keep this server-side only" },
        ],
        warning: "Add http://localhost:3000/api/auth/callback/google to Authorized Redirect URIs. Mismatched URIs cause 'redirect_uri_mismatch' errors.",
      },
      {
        id: "google-env",
        title: "Add to .env.local",
        description: "Store your credentials as environment variables.",
        codeSnippet: `GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret
AUTH_SECRET=any_random_32char_string_here`,
        note: "AUTH_SECRET is used to sign session cookies — generate one with: openssl rand -base64 32",
      },
      {
        id: "google-scopes",
        title: "Choose Permission Scopes",
        description: "Scopes define what your app can access. Request only what you need.",
        fields: [
          {
            key: "scope",
            label: "Scopes Needed",
            placeholder: "Select scope level",
            type: "select",
            options: ["openid email profile (Sign-In only)", "openid email profile + calendar.readonly", "openid email profile + drive.readonly"],
            hint: "Users see exactly these permissions on the consent screen",
          },
        ],
        note: "Start with the minimum (email + profile). Request additional scopes only when the user triggers a feature that needs them.",
      },
      {
        id: "google-flow",
        title: "Implement the Auth Flow",
        description: "Your app redirects the user to Google, Google redirects back with a code, your server exchanges it for tokens.",
        codeSnippet: `// Redirect user to Google
GET /api/auth/google
→ https://accounts.google.com/o/oauth2/v2/auth
  ?client_id=CLIENT_ID
  &redirect_uri=http://localhost:3000/api/auth/callback/google
  &response_type=code
  &scope=openid email profile

// Google calls your callback with ?code=...
GET /api/auth/callback/google
→ exchange code for { access_token, id_token }
→ decode id_token to get user email/name`,
        action: { label: "Google OAuth Docs", url: "https://developers.google.com/identity/protocols/oauth2" },
      },
    ],
  },
  {
    id: "stripe",
    name: "Stripe Payments",
    logo: <CreditCard size={22} className="text-violet-400" />,
    description: "Accept payments in your booking app and optionally use Stripe Financial Connections to read bank account data.",
    tag: "Payments",
    tagColor: "bg-violet-600/20 text-violet-400 border-violet-500/30",
    steps: [
      {
        id: "stripe-account",
        title: "Create a Stripe Account",
        description: "Sign up at stripe.com. Your account starts in Test Mode automatically — no real money moves until you activate.",
        action: { label: "Open Stripe Dashboard", url: "https://dashboard.stripe.com/register" },
        note: "Test Mode is free and includes test card numbers you can use to simulate payments.",
      },
      {
        id: "stripe-keys",
        title: "Get Your API Keys",
        description: "In the Stripe Dashboard, click Developers → API keys. You need both keys.",
        fields: [
          { key: "publishableKey", label: "Publishable Key", placeholder: "pk_test_...", type: "text", hint: "Safe to use in frontend code" },
          { key: "secretKey", label: "Secret Key", placeholder: "sk_test_...", type: "password", hint: "Server-side only — never expose to browser" },
        ],
        warning: "The secret key gives full access to your Stripe account. Never put it in frontend code or commit it to GitHub.",
      },
      {
        id: "stripe-env",
        title: "Add Keys to .env.local",
        description: "Store your Stripe keys as environment variables.",
        codeSnippet: `STRIPE_PUBLISHABLE_KEY=pk_test_your_key
STRIPE_SECRET_KEY=sk_test_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret`,
        note: "Get the webhook secret after you set up a webhook endpoint in the Stripe Dashboard.",
      },
      {
        id: "stripe-install",
        title: "Install Stripe SDK",
        description: "Install both the server-side Node SDK and the browser-safe Stripe.js loader.",
        codeSnippet: `npm install stripe @stripe/stripe-js`,
        note: "stripe is for your server.ts. @stripe/stripe-js is for React — it loads Stripe.js safely from Stripe's CDN.",
      },
      {
        id: "stripe-checkout",
        title: "Create a Payment Intent (Backend)",
        description: "Your server creates a PaymentIntent and returns its client_secret to the frontend.",
        codeSnippet: `import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

app.post('/api/create-payment-intent', async (req, res) => {
  const intent = await stripe.paymentIntents.create({
    amount: req.body.amount,  // in cents
    currency: 'usd',
    automatic_payment_methods: { enabled: true },
  });
  res.json({ clientSecret: intent.client_secret });
});`,
        action: { label: "Stripe Docs: PaymentIntent", url: "https://stripe.com/docs/api/payment_intents" },
      },
      {
        id: "stripe-elements",
        title: "Add Payment Form (Frontend)",
        description: "Use Stripe Elements to render the card input — Stripe handles PCI compliance for you.",
        codeSnippet: `import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PK);

<Elements stripe={stripePromise} options={{ clientSecret }}>
  <PaymentElement />
  <button onClick={stripe.confirmPayment}>Pay</button>
</Elements>`,
        note: "Add VITE_STRIPE_PK=pk_test_... to your .env.local — Vite exposes VITE_ prefixed vars to the browser.",
      },
    ],
  },
];

// ─── SavedField: stores typed values per integration ─────────────────────────

function useFieldValues() {
  const [saved, setSaved] = useState<Record<string, Record<string, string>>>({});
  function getValue(integrationId: string, key: string) {
    return saved[integrationId]?.[key] ?? "";
  }
  function setValue(integrationId: string, key: string, value: string) {
    setSaved(prev => ({
      ...prev,
      [integrationId]: { ...(prev[integrationId] ?? {}), [key]: value },
    }));
  }
  return { getValue, setValue };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  function handleCopy() {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }
  return (
    <div className="relative group mt-2 mb-1">
      <pre className="bg-slate-950 border border-slate-700 rounded-lg p-3 text-[10px] font-mono text-emerald-300 overflow-x-auto leading-relaxed whitespace-pre-wrap break-words">
        {code}
      </pre>
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 p-1.5 rounded bg-slate-800 text-slate-500 hover:text-white border border-slate-700 opacity-0 group-hover:opacity-100 transition-opacity"
        title="Copy"
      >
        {copied ? <CheckCircle2 size={11} className="text-emerald-400" /> : <Copy size={11} />}
      </button>
    </div>
  );
}

function SecretField({ fieldDef, value, onChange }: {
  fieldDef: FieldDef;
  value: string;
  onChange: (v: string) => void;
}) {
  const [visible, setVisible] = useState(false);
  if (fieldDef.type === "select") {
    return (
      <div className="mb-3">
        <label className="block text-[10px] text-slate-400 font-semibold mb-1 uppercase tracking-wider">{fieldDef.label}</label>
        <select
          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
          value={value}
          onChange={e => onChange(e.target.value)}
        >
          <option value="">— Select —</option>
          {fieldDef.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
        {fieldDef.hint && <p className="text-[9px] text-slate-500 mt-1">{fieldDef.hint}</p>}
      </div>
    );
  }
  return (
    <div className="mb-3">
      <label className="block text-[10px] text-slate-400 font-semibold mb-1 uppercase tracking-wider">{fieldDef.label}</label>
      <div className="relative">
        <input
          type={fieldDef.type === "password" && !visible ? "password" : "text"}
          placeholder={fieldDef.placeholder}
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-2 pr-8 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors font-mono"
        />
        {fieldDef.type === "password" && (
          <button
            type="button"
            onClick={() => setVisible(v => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
          >
            {visible ? <EyeOff size={12} /> : <Eye size={12} />}
          </button>
        )}
      </div>
      {fieldDef.hint && <p className="text-[9px] text-slate-500 mt-1">{fieldDef.hint}</p>}
    </div>
  );
}

// ─── Step Wizard ──────────────────────────────────────────────────────────────

function StepWizard({
  integration,
  completedSteps,
  onStepComplete,
  getFieldValue,
  setFieldValue,
}: {
  integration: Integration;
  completedSteps: Set<string>;
  onStepComplete: (stepId: string) => void;
  getFieldValue: (key: string) => string;
  setFieldValue: (key: string, value: string) => void;
}) {
  const [activeIdx, setActiveIdx] = useState(0);
  const step = integration.steps[activeIdx];
  const isStepDone = completedSteps.has(step.id);
  const allDone = integration.steps.every(s => completedSteps.has(s.id));

  return (
    <div className="flex flex-col h-full">
      {/* Step list — top */}
      <div className="flex gap-1 px-4 pt-3 pb-2 overflow-x-auto flex-shrink-0">
        {integration.steps.map((s, i) => {
          const done = completedSteps.has(s.id);
          const active = i === activeIdx;
          return (
            <button
              key={s.id}
              onClick={() => setActiveIdx(i)}
              className={`flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[10px] font-semibold border transition-all ${
                active
                  ? "bg-indigo-600/20 border-indigo-500/40 text-indigo-300"
                  : done
                  ? "bg-emerald-600/10 border-emerald-500/20 text-emerald-400"
                  : "bg-slate-800 border-slate-700 text-slate-500 hover:text-slate-300"
              }`}
            >
              {done
                ? <CheckCircle2 size={10} className="text-emerald-400 flex-shrink-0" />
                : <Circle size={10} className="flex-shrink-0" />}
              Step {i + 1}
            </button>
          );
        })}
      </div>

      {/* Step content */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3 min-h-0">
        {/* Header */}
        <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black border ${
              isStepDone ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400" : "bg-indigo-600/20 border-indigo-500/30 text-indigo-300"
            }`}>
              {isStepDone ? "✓" : activeIdx + 1}
            </div>
            <h3 className="text-sm font-bold text-white">{step.title}</h3>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">{step.description}</p>
        </div>

        {/* External action link */}
        {step.action && (
          <a
            href={step.action.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between gap-3 px-4 py-3 bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/25 rounded-xl transition-colors group"
          >
            <div className="flex items-center gap-2">
              <ExternalLink size={13} className="text-blue-400 flex-shrink-0" />
              <span className="text-xs font-semibold text-blue-300">{step.action.label}</span>
            </div>
            <ChevronRight size={13} className="text-blue-500 group-hover:text-blue-300 transition-colors" />
          </a>
        )}

        {/* Fields */}
        {step.fields && step.fields.length > 0 && (
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Key size={12} className="text-amber-400" />
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Your Credentials</span>
            </div>
            {step.fields.map(f => (
              <SecretField
                key={f.key}
                fieldDef={f}
                value={getFieldValue(f.key)}
                onChange={v => setFieldValue(f.key, v)}
              />
            ))}
            <p className="text-[9px] text-slate-600 mt-1">These values are stored locally only for your reference — they are never sent anywhere.</p>
          </div>
        )}

        {/* Code snippet */}
        {step.codeSnippet && (
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <Zap size={11} className="text-amber-400" />
              <span className="text-[10px] font-semibold text-slate-400">Code</span>
            </div>
            <CodeBlock code={step.codeSnippet} />
          </div>
        )}

        {/* Warning */}
        {step.warning && (
          <div className="flex gap-2.5 bg-red-500/10 border border-red-500/25 rounded-xl p-3">
            <AlertTriangle size={13} className="text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-red-200 leading-relaxed">{step.warning}</p>
          </div>
        )}

        {/* Note */}
        {step.note && (
          <div className="flex gap-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-3">
            <ShieldCheck size={13} className="text-indigo-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-indigo-200 leading-relaxed">{step.note}</p>
          </div>
        )}
      </div>

      {/* Footer nav */}
      <div className="flex-shrink-0 px-4 py-3 border-t border-slate-800 flex items-center gap-2">
        <button
          onClick={() => setActiveIdx(i => Math.max(0, i - 1))}
          disabled={activeIdx === 0}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-700 disabled:opacity-30 disabled:pointer-events-none transition-all"
        >
          <ChevronLeft size={13} /> Back
        </button>

        {!isStepDone ? (
          <button
            onClick={() => onStepComplete(step.id)}
            className="flex-1 flex items-center justify-center gap-2 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-colors"
          >
            <CheckCircle2 size={13} /> Mark Step Done
          </button>
        ) : (
          <div className="flex-1 flex items-center justify-center gap-2 py-2 bg-emerald-600/10 text-emerald-400 text-xs font-bold rounded-lg border border-emerald-500/20">
            <CheckCircle2 size={13} /> Step Complete
          </div>
        )}

        {activeIdx < integration.steps.length - 1 ? (
          <button
            onClick={() => setActiveIdx(i => Math.min(integration.steps.length - 1, i + 1))}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-700 transition-all"
          >
            Next <ChevronRight size={13} />
          </button>
        ) : (
          <button
            disabled={!allDone}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all disabled:opacity-30 disabled:pointer-events-none bg-indigo-600/20 text-indigo-300 border-indigo-500/30"
          >
            Finish <CheckCircle2 size={13} />
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Integration Card ─────────────────────────────────────────────────────────

function IntegrationCard({
  integration,
  completedSteps,
  onClick,
}: {
  integration: Integration;
  completedSteps: Set<string>;
  onClick: () => void;
}) {
  const done = integration.steps.filter(s => completedSteps.has(s.id)).length;
  const total = integration.steps.length;
  const pct = Math.round((done / total) * 100);
  const allDone = done === total;

  return (
    <button
      onClick={onClick}
      className="w-full text-left p-4 bg-slate-800/60 hover:bg-slate-800 border border-slate-700 hover:border-slate-500 rounded-xl transition-all group"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-slate-700 border border-slate-600 flex items-center justify-center flex-shrink-0 group-hover:border-slate-500 transition-colors">
          {integration.logo}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <span className="text-sm font-bold text-white">{integration.name}</span>
            <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded border ${integration.tagColor}`}>{integration.tag}</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed mb-2">{integration.description}</p>
          {/* Progress */}
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-slate-700 rounded-full h-1">
              <div
                className={`h-1 rounded-full transition-all duration-500 ${allDone ? "bg-emerald-500" : "bg-indigo-500"}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className={`text-[10px] font-semibold flex-shrink-0 ${allDone ? "text-emerald-400" : "text-slate-500"}`}>
              {done}/{total} steps
            </span>
          </div>
        </div>
        <ChevronRight size={14} className="text-slate-600 group-hover:text-slate-400 transition-colors flex-shrink-0 mt-1" />
      </div>
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function OAuthSetup() {
  const [selectedId, setSelectedId] = useState<IntegrationId | null>(null);
  const [completedSteps, setCompletedSteps] = useState<Record<string, Set<string>>>({});
  const { getValue, setValue } = useFieldValues();

  const selected = INTEGRATIONS.find(i => i.id === selectedId) ?? null;

  function getIntegrationSteps(id: IntegrationId): Set<string> {
    return completedSteps[id] ?? new Set();
  }

  function markStepDone(integrationId: IntegrationId, stepId: string) {
    setCompletedSteps(prev => {
      const existing = prev[integrationId] ?? new Set<string>();
      const next = new Set(existing);
      next.add(stepId);
      return { ...prev, [integrationId]: next };
    });
  }

  function resetIntegration(id: IntegrationId) {
    setCompletedSteps(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }

  const totalDone = INTEGRATIONS.filter(i =>
    i.steps.every(s => getIntegrationSteps(i.id).has(s.id))
  ).length;

  // ── Detail view ──
  if (selected) {
    const steps = getIntegrationSteps(selected.id);
    const allDone = selected.steps.every(s => steps.has(s.id));

    return (
      <div className="flex flex-col h-full bg-slate-950 overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-800 flex-shrink-0">
          <button
            onClick={() => setSelectedId(null)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-700"
          >
            <ChevronLeft size={15} />
          </button>
          <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center flex-shrink-0">
            {selected.logo}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-bold text-white leading-tight">{selected.name}</h2>
            <p className="text-[10px] text-slate-500">
              {steps.size}/{selected.steps.length} steps complete
            </p>
          </div>
          {allDone && (
            <div className="flex items-center gap-1 text-emerald-400 text-[10px] font-bold">
              <CheckCircle2 size={12} /> Done
            </div>
          )}
          <button
            onClick={() => resetIntegration(selected.id)}
            className="p-1.5 text-slate-600 hover:text-slate-400 rounded-lg hover:bg-slate-800 transition-colors"
            title="Reset progress"
          >
            <RefreshCw size={13} />
          </button>
        </div>

        {/* Wizard */}
        <div className="flex-1 overflow-hidden min-h-0">
          <StepWizard
            integration={selected}
            completedSteps={steps}
            onStepComplete={(stepId) => markStepDone(selected.id, stepId)}
            getFieldValue={(key) => getValue(selected.id, key)}
            setFieldValue={(key, value) => setValue(selected.id, key, value)}
          />
        </div>
      </div>
    );
  }

  // ── List view ──
  return (
    <div className="flex flex-col h-full bg-slate-950 overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b border-slate-800 flex-shrink-0">
        <div className="flex items-center gap-2 mb-1">
          <Plug size={16} className="text-indigo-400" />
          <h1 className="text-base font-black text-white">OAuth & Integrations</h1>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed mb-3">
          Connect your app to external services step by step. Each guide walks you through credentials, environment setup, and code snippets.
        </p>

        {/* Overall badge */}
        <div className="flex items-center gap-3 bg-slate-800 rounded-xl p-3 border border-slate-700">
          <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
            <ShieldCheck size={15} className="text-indigo-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-0.5">Setup Progress</div>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-slate-700 rounded-full h-1.5">
                <div
                  className="bg-gradient-to-r from-indigo-500 to-violet-500 h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${Math.round((totalDone / INTEGRATIONS.length) * 100)}%` }}
                />
              </div>
              <span className="text-[10px] text-indigo-400 font-bold flex-shrink-0">{totalDone}/{INTEGRATIONS.length} configured</span>
            </div>
          </div>
        </div>
      </div>

      {/* Integration cards */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
        <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold px-1 mb-2">Choose an Integration</div>
        {INTEGRATIONS.map(integration => (
          <IntegrationCard
            key={integration.id}
            integration={integration}
            completedSteps={getIntegrationSteps(integration.id)}
            onClick={() => setSelectedId(integration.id)}
          />
        ))}

        {/* Info footer */}
        <div className="mt-2 p-3 bg-slate-900 border border-slate-800 rounded-xl">
          <div className="flex gap-2">
            <AlertTriangle size={12} className="text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-[10px] text-slate-500 leading-relaxed">
              Always store secret API keys in <code className="font-mono text-amber-400">.env.local</code> — never in frontend code or committed to GitHub. Production keys require verified accounts with each provider.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
