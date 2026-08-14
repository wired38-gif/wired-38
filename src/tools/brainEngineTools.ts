// src/tools/brainEngineTools.ts
// Super Agent → MYK Brain Engine bridge tools.
//
// Talks to myk-daemon (myks-app repo, myk-daemon/server.js) running on the Mac
// host, exposed through the myks-brain Cloudflare tunnel at
// https://daemon.askmyk.io. Uses native fetch instead of axios so no new
// runtime dependency is needed.
//
// Env (set in the Render deployment):
//   MYK_DAEMON_URL   e.g. https://daemon.askmyk.io
//   DAEMON_SECRET    must match DAEMON_SECRET in the Mac's
//                    ~/MYK-BRAIN-Workspace/.env.local

import { Type } from "@google/genai";

const DAEMON_URL = (process.env.MYK_DAEMON_URL || "http://localhost:9090").replace(/\/+$/, "");
const DAEMON_SECRET = process.env.DAEMON_SECRET || "myk-super-agent-secret-key";

export function isBrainEngineConfigured(): boolean {
  return Boolean(process.env.MYK_DAEMON_URL);
}

// Retries cover transient tunnel routing flaps (e.g. a stale Cloudflare tunnel
// connector without the daemon ingress rule serving a 404 for a request or two).
// With two registered connectors the stale one wins ~half the routes, so five
// attempts keep the effective failure rate low until it is decommissioned.
const RETRYABLE_STATUS = new Set([404, 502, 503, 530]);
const MAX_ATTEMPTS = 5;

async function daemonFetch(pathname: string, init: RequestInit = {}, timeoutMs = 10000): Promise<any> {
  let lastError: Error = new Error("daemon unreachable");
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const response = await fetch(`${DAEMON_URL}${pathname}`, {
        ...init,
        headers: {
          Authorization: `Bearer ${DAEMON_SECRET}`,
          "Content-Type": "application/json",
          ...(init.headers as Record<string, string> | undefined),
        },
        signal: AbortSignal.timeout(timeoutMs),
      });
      const body = await response.json().catch(() => ({}));
      if (response.ok) return body;
      lastError = new Error(`daemon ${pathname} → HTTP ${response.status}: ${JSON.stringify(body).slice(0, 200)}`);
      if (!RETRYABLE_STATUS.has(response.status)) throw lastError;
    } catch (err: any) {
      lastError = err instanceof Error ? err : new Error(String(err));
      // Non-retryable daemon error already formatted above — rethrow immediately.
      if (lastError.message.includes("→ HTTP") && !RETRYABLE_STATUS.has(Number(lastError.message.match(/HTTP (\d+)/)?.[1]))) {
        throw lastError;
      }
    }
    if (attempt < MAX_ATTEMPTS) await new Promise(r => setTimeout(r, 400 * attempt));
  }
  throw lastError;
}

// Schema type usable directly as a Gemini functionDeclaration `parameters`.
interface ToolSchema {
  type: Type;
  properties: Record<string, { type: Type; description?: string }>;
  required?: string[];
}

export interface BrainEngineTool {
  name: string;
  description: string;
  parameters: ToolSchema;
  execute: (args?: Record<string, unknown>) => Promise<unknown>;
}

const NO_PARAMS: ToolSchema = { type: Type.OBJECT, properties: {} };

export const brainEngineTools: BrainEngineTool[] = [
  {
    name: "get_brain_engine_status",
    description:
      "Check the live MYK Brain Engine on the Mac host: Apple Container / Virtualization process health, " +
      "gateway status, autopilot build progress, and the tail of the build log. " +
      "Use whenever MYK asks how the build is coming, whether the engine is up, or whether a build is hung.",
    parameters: NO_PARAMS,
    execute: async () => {
      try {
        const [status, logs] = await Promise.all([
          daemonFetch("/status"),
          daemonFetch("/logs"),
        ]);
        return { status, logs: logs.logs };
      } catch (err: any) {
        return { error: `Failed to connect to local Apple Container Daemon: ${err.message}` };
      }
    },
  },
  {
    name: "restart_brain_engine_container",
    description:
      "Hard reset hung Apple Virtualization / Apple Container processes on the Mac host " +
      "(e.g. a container build stuck at step 23). Restarts the Apple container system service.",
    parameters: NO_PARAMS,
    execute: async () => {
      try {
        // container system stop + start can take ~50s — allow a longer window.
        return await daemonFetch("/restart", { method: "POST" }, 70000);
      } catch (err: any) {
        return { error: `Failed to execute restart command: ${err.message}` };
      }
    },
  },
  {
    name: "trigger_brain_engine_build",
    description:
      "Trigger a fresh Brain Engine build on the Mac host (Apple Silicon ARM64). " +
      "Runs the configured build command, or the gateway autopilot self-build when none is configured.",
    parameters: NO_PARAMS,
    execute: async () => {
      try {
        return await daemonFetch("/build", { method: "POST" }, 30000);
      } catch (err: any) {
        return { error: `Failed to trigger build: ${err.message}` };
      }
    },
  },
  {
    name: "run_brain_engine_command",
    description:
      "Run an arbitrary shell command on the Mac host from the Brain Engine repo root " +
      "(e.g. 'git status', 'npm run test:smoke', 'git pull', 'tail -n 40 logs/gateway.log') and return " +
      "stdout/stderr. Use for diagnostics, git operations, running builds/tests, and inspecting files. " +
      "Requires the daemon to have exec enabled (DAEMON_ALLOW_EXEC=1); if disabled it returns an error. " +
      "Prefer the dedicated status/restart/build tools when they fit; use this for anything else.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        command: {
          type: Type.STRING,
          description: "The shell command to execute on the Mac host, e.g. \"git status\" or \"npm run build\".",
        },
      },
      required: ["command"],
    },
    execute: async (args) => {
      const command = typeof args?.command === "string" ? args.command.trim() : "";
      if (!command) return { error: "command (string) is required" };
      try {
        // Builds/tests can run long — allow a 5-minute window.
        return await daemonFetch(
          "/exec",
          { method: "POST", body: JSON.stringify({ command, timeoutMs: 240000 }) },
          300000,
        );
      } catch (err: any) {
        return { error: `Failed to run command: ${err.message}` };
      }
    },
  },
];
