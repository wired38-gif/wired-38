import assert from "node:assert/strict";
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import test from "node:test";

const TEST_PORT = 3456;

function startServer(port: number, env: Record<string, string>) {
  const server = spawn(process.execPath, ["--import", "tsx", "server.ts"], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      NODE_ENV: "production",
      PORT: String(port),
      ...env,
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

  return {
    server,
    baseUrl: `http://127.0.0.1:${port}`,
  };
}

async function waitForServer(server: ChildProcessWithoutNullStreams, baseUrl: string) {
  let output = "";
  server.stdout.on("data", (chunk) => {
    output += chunk.toString();
  });
  server.stderr.on("data", (chunk) => {
    output += chunk.toString();
  });

  for (let attempt = 0; attempt < 50; attempt++) {
    if (server.exitCode !== null) {
      throw new Error(`Server exited before readiness check completed:\n${output}`);
    }

    try {
      const response = await fetch(`${baseUrl}/api/status`);
      if (response.ok) return;
    } catch {
      // Retry until the server binds the port.
    }

    await delay(100);
  }

  throw new Error(`Server did not become ready:\n${output}`);
}

test("server-issued admin session protects paid AI endpoints", async (t) => {
  const { server, baseUrl } = startServer(TEST_PORT, {
    ADMIN_USERNAME: "admin",
    ADMIN_PASSWORD: "correct-password",
    AUTH_SECRET: "test-only-auth-secret",
    GEMINI_API_KEY: "fake-gemini-key",
  });

  t.after(() => {
    if (server.exitCode === null) {
      server.kill("SIGTERM");
    }
  });

  await waitForServer(server, baseUrl);

  const unauthenticatedApiResponse = await fetch(`${baseUrl}/api/analyze-prompt`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: "Generate a build plan" }),
  });
  assert.equal(unauthenticatedApiResponse.status, 401);

  const failedLogin = await fetch(`${baseUrl}/api/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "admin", password: "wrong-password" }),
  });
  assert.equal(failedLogin.status, 401);
  assert.equal(failedLogin.headers.get("set-cookie"), null);

  const successfulLogin = await fetch(`${baseUrl}/api/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "admin", password: "correct-password" }),
  });
  assert.equal(successfulLogin.status, 200);

  const sessionCookie = successfulLogin.headers.get("set-cookie");
  assert.match(sessionCookie || "", /myk_io_session=/);
  assert.match(sessionCookie || "", /HttpOnly/);
  assert.match(sessionCookie || "", /SameSite=Lax/);

  const authenticatedStatus = await fetch(`${baseUrl}/api/status`, {
    headers: { Cookie: sessionCookie || "" },
  });
  assert.equal(authenticatedStatus.status, 200);
  assert.equal((await authenticatedStatus.json()).authenticated, true);

  const logout = await fetch(`${baseUrl}/api/logout`, {
    method: "POST",
    headers: { Cookie: sessionCookie || "" },
  });
  assert.equal(logout.status, 200);
  assert.match(logout.headers.get("set-cookie") || "", /Max-Age=0/);
});

test("malformed unrelated cookies do not break auth checks", async (t) => {
  const { server, baseUrl } = startServer(TEST_PORT + 1, {
    ADMIN_USERNAME: "admin",
    ADMIN_PASSWORD: "correct-password",
    AUTH_SECRET: "test-only-auth-secret",
  });

  t.after(() => {
    if (server.exitCode === null) {
      server.kill("SIGTERM");
    }
  });

  await waitForServer(server, baseUrl);

  const unauthenticatedStatus = await fetch(`${baseUrl}/api/status`, {
    headers: { Cookie: "legacy=100%" },
  });
  assert.equal(unauthenticatedStatus.status, 200);
  assert.equal((await unauthenticatedStatus.json()).authenticated, false);

  const successfulLogin = await fetch(`${baseUrl}/api/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "admin", password: "correct-password" }),
  });
  const sessionCookie = successfulLogin.headers.get("set-cookie");

  const authenticatedStatus = await fetch(`${baseUrl}/api/status`, {
    headers: { Cookie: `legacy=100%; ${sessionCookie || ""}` },
  });
  assert.equal(authenticatedStatus.status, 200);
  assert.equal((await authenticatedStatus.json()).authenticated, true);
});

test("admin password rotation invalidates existing sessions", async (t) => {
  const oldServer = startServer(TEST_PORT + 2, {
    ADMIN_USERNAME: "admin",
    ADMIN_PASSWORD: "old-password",
    AUTH_SECRET: "stable-auth-secret",
  });

  t.after(() => {
    if (oldServer.server.exitCode === null) {
      oldServer.server.kill("SIGTERM");
    }
  });

  await waitForServer(oldServer.server, oldServer.baseUrl);

  const successfulLogin = await fetch(`${oldServer.baseUrl}/api/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "admin", password: "old-password" }),
  });
  const oldSessionCookie = successfulLogin.headers.get("set-cookie");
  assert.match(oldSessionCookie || "", /myk_io_session=/);

  const newServer = startServer(TEST_PORT + 3, {
    ADMIN_USERNAME: "admin",
    ADMIN_PASSWORD: "new-password",
    AUTH_SECRET: "stable-auth-secret",
  });

  t.after(() => {
    if (newServer.server.exitCode === null) {
      newServer.server.kill("SIGTERM");
    }
  });

  await waitForServer(newServer.server, newServer.baseUrl);

  const rotatedStatus = await fetch(`${newServer.baseUrl}/api/status`, {
    headers: { Cookie: oldSessionCookie || "" },
  });
  assert.equal(rotatedStatus.status, 200);
  assert.equal((await rotatedStatus.json()).authenticated, false);
});
