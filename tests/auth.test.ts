import assert from "node:assert/strict";
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import test from "node:test";

const TEST_PORT = 3456;
const BASE_URL = `http://127.0.0.1:${TEST_PORT}`;

async function waitForServer(server: ChildProcessWithoutNullStreams) {
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
      const response = await fetch(`${BASE_URL}/api/status`);
      if (response.ok) return;
    } catch {
      // Retry until the server binds the port.
    }

    await delay(100);
  }

  throw new Error(`Server did not become ready:\n${output}`);
}

test("server-issued admin session protects paid AI endpoints", async (t) => {
  const server = spawn(process.execPath, ["--import", "tsx", "server.ts"], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      NODE_ENV: "production",
      PORT: String(TEST_PORT),
      ADMIN_USERNAME: "admin",
      ADMIN_PASSWORD: "correct-password",
      AUTH_SECRET: "test-only-auth-secret",
      GEMINI_API_KEY: "fake-gemini-key",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

  t.after(() => {
    if (server.exitCode === null) {
      server.kill("SIGTERM");
    }
  });

  await waitForServer(server);

  const unauthenticatedApiResponse = await fetch(`${BASE_URL}/api/analyze-prompt`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: "Generate a build plan" }),
  });
  assert.equal(unauthenticatedApiResponse.status, 401);

  const failedLogin = await fetch(`${BASE_URL}/api/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "admin", password: "wrong-password" }),
  });
  assert.equal(failedLogin.status, 401);
  assert.equal(failedLogin.headers.get("set-cookie"), null);

  const successfulLogin = await fetch(`${BASE_URL}/api/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "admin", password: "correct-password" }),
  });
  assert.equal(successfulLogin.status, 200);

  const sessionCookie = successfulLogin.headers.get("set-cookie");
  assert.match(sessionCookie || "", /myk_io_session=/);
  assert.match(sessionCookie || "", /HttpOnly/);
  assert.match(sessionCookie || "", /SameSite=Lax/);

  const authenticatedStatus = await fetch(`${BASE_URL}/api/status`, {
    headers: { Cookie: sessionCookie || "" },
  });
  assert.equal(authenticatedStatus.status, 200);
  assert.equal((await authenticatedStatus.json()).authenticated, true);

  const statusWithMalformedUnrelatedCookie = await fetch(`${BASE_URL}/api/status`, {
    headers: { Cookie: `unrelated=%; ${sessionCookie || ""}` },
  });
  assert.equal(statusWithMalformedUnrelatedCookie.status, 200);
  assert.equal((await statusWithMalformedUnrelatedCookie.json()).authenticated, true);

  const protectedApiWithMalformedCookie = await fetch(`${BASE_URL}/api/analyze-prompt`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: "unrelated=%",
    },
    body: JSON.stringify({ prompt: "Generate a build plan" }),
  });
  assert.equal(protectedApiWithMalformedCookie.status, 401);

  const logout = await fetch(`${BASE_URL}/api/logout`, {
    method: "POST",
    headers: { Cookie: sessionCookie || "" },
  });
  assert.equal(logout.status, 200);
  assert.match(logout.headers.get("set-cookie") || "", /Max-Age=0/);
});
