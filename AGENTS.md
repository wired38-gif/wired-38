# AGENTS.md

## Cursor Cloud specific instructions

MYK.IO ("TheOptimizer") is a single-process app: `server.ts` (Express) serves the JSON API
**and** mounts Vite as middleware to serve the React frontend. There is no separate
frontend/backend process — everything runs on one port (`PORT`, default `3000`).

Standard commands live in `package.json` scripts:
- Dev (use this): `npm run dev` → `tsx server.ts` (Vite middleware, hot reload). Serves UI + API at `http://localhost:3000`.
- Lint / typecheck: `npm run lint` → `tsc --noEmit`.
- Tests: `npm test` → `node --import tsx --test tests/auth.test.ts`.
- Prod build/run (not for dev): `npm run build` then `npm start` (serves `dist/` with `NODE_ENV=production`).

Non-obvious caveats:
- Env is loaded from `.env.local` then `.env` (see `loadEnv` in `server.ts`). `.env*` is gitignored
  except `.env.example`, so create a local `.env.local` for dev secrets — it will not be committed.
- The whole UI is gated behind an admin login. The "Validate Credentials" button stays disabled
  until the server has `ADMIN_USERNAME`, `ADMIN_PASSWORD`, and `AUTH_SECRET` set. Set these in
  `.env.local` to exercise the login flow locally (any values work for dev).
- The paid AI endpoints (`POST /api/analyze-prompt`, `POST /api/refine-prompt`) require a real
  `GEMINI_API_KEY`. Without it they return HTTP 500 ("GEMINI_API_KEY ... not configured"); login,
  `/api/status`, and the UI still work. These endpoints are also protected by `requireAuth`, so a
  valid `myk_io_session` cookie (obtained via `POST /api/login`) is required.
- `npm test` spawns its own server instance with fake keys under `NODE_ENV=production`; it does not
  need real secrets or an already-running dev server. Do not point it at your dev server.
- `DISABLE_HMR=true` disables Vite HMR and file watching (used in AI Studio to avoid flicker during
  edits). Leave it unset for normal local development.
