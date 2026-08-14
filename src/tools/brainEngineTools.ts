// src/tools/brainEngineTools.ts
// Super Agent → MYK Brain Engine bridge tools.
//
// Talks to myk-daemon (myks-app repo, myk-daemon/server.js) running on the Mac
// host, exposed through the dedicated myk-daemon Cloudflare tunnel at
// https://daemon.askmyk.io (isolated from the shared myks-brain tunnel).
// Uses native fetch instead of axios so no new runtime dependency is needed.
//
// Env (set in the Render deployment):
//   MYK_DAEMON_URL   e.g. https://daemon.askmyk.io
//   DAEMON_SECRET    must match DAEMON_SECRET in the Mac's
//                    ~/MYK-BRAIN-Workspace/.env.local

import { Type } from "@google/genai";

const DAEMON_URL = (process.env.MYK_DAEMON_URL || "http://localhost:9090").replace(/\/+$/, "");
const DAEMON_SECRET = process.env.DAEMON_SECRET || "myk-super-agent-secret-key";

export function isBrainEngineConfigured(): boolean {
  return Boolean(process.env.MYK_DAEMON_URL && process.env.DAEMON_SECRET);
}

// Without MYK_DAEMON_URL the fetch falls back to localhost:9090 *inside this
// Render container* and fails with a misleading "fetch failed". Surface the
// real cause and the real fix instead, so the model never tells MYK to
// restart anything on the Mac (the Mac-side bridge is independent of this).
function notConfiguredResult() {
  const missing = [
    !process.env.MYK_DAEMON_URL && "MYK_DAEMON_URL",
    !process.env.DAEMON_SECRET && "DAEMON_SECRET",
  ].filter(Boolean).join(" and ");
  return {
    notConfigured: true,
    error: `This Render service is missing the ${missing} environment variable(s), so the Mac bridge cannot be reached from here.`,
    fix:
      "This is a server-side configuration gap, NOT a problem on MYK's Mac — do not suggest starting or " +
      "restarting anything locally. Fix: in the Render dashboard open the myk-super-agent service → " +
      "Environment, add MYK_DAEMON_URL=https://daemon.askmyk.io and DAEMON_SECRET (the value of " +
      "DAEMON_SECRET in ~/MYK-BRAIN-Workspace/.env.local on the Mac), save, and let Render redeploy.",
  };
}

// Retries are defense-in-depth against transient tunnel routing flaps. The
// historical root cause (a stale connector on the shared myks-brain tunnel
// winning routes) was eliminated on 2026-08-13 by moving daemon.askmyk.io to
// a dedicated tunnel that only MYK's Mac runs.
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
      if (!isBrainEngineConfigured()) return notConfiguredResult();
      try {
        const [status, logs] = await Promise.all([
          daemonFetch("/status"),
          daemonFetch("/logs"),
        ]);
        return { status, logs: logs.logs };
      } catch (err: any) {
        return { error: `Failed to connect to the Mac bridge daemon: ${err.message}` };
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
      if (!isBrainEngineConfigured()) return notConfiguredResult();
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
      if (!isBrainEngineConfigured()) return notConfiguredResult();
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
      if (!isBrainEngineConfigured()) return notConfiguredResult();
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
