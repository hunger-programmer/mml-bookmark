# Platform foundation, Phase 3: users and sessions

- Date: 2026-10-23
- Spec: `.ai/specs/2026-10-23-platform-foundation.md` (Phase 3)
- Status: done (PR open)

## Goal

This phase delivers:

- Zod schemas for auth.
- Core session changes: `via`, `suspended`, `requireCsrf`, `assertActive`.
- A `users` entity with RLS and revoked Data API grants, plus `UserService.resolve`.
- The Supabase session reader (Bearer first, then httpOnly cookies).
- `proxy.ts` session refresh and `GET /api/v1/me`.
- Integration tests for all of it.

## Steps taken

1. Branch `feat/platform-foundation-phase-3` from `main` (bf08250). Phase 2 CI on `main`: all jobs passed, integration included.
2. Dependencies: `zod` (core, app), `@supabase/ssr` 0.12.7 and `@supabase/supabase-js` 2.118 (app), `awilix` (app, same version as core).
3. `core/http`:
   - `Session` gains `email`, `suspended` and `via`.
   - New `requireCsrf`, `assertActive`, `AccountSuspendedError`, `parseWith`.
   - `requireSession` checks CSRF only for cookie sessions and rejects suspended users.
4. `core/validators/auth`: `signIn`, `signUp`, `passwordReset` and `password` schemas. Emails are trimmed and lowercased before the format check. Passwords are 8–72 characters for new passwords, 1–72 for sign-in.
5. `core/services/auth`: `UserRepository` port, `UserService.resolve`, `registerAuth`, and the `@mml-bookmark/core/auth` subpath export.
6. `db`: `User` entity (`rowLevelSecurity: true`), `MikroUserRepository` (`insert … on conflict (id) do nothing`), registered in `registerDb`.
   - Migration `Migration20261023004313`: generated table + RLS, plus hand-written revokes and default privileges.
   - A unit test next to the migration; the migrations glob excludes `*.test`.
7. `app`:
   - `server/env.ts` (lazy Zod env).
   - `server/auth/supabase-server.ts` (httpOnly, lax, secure in production).
   - `server/auth/session-reader.ts` and `server/auth/register.ts`, wired in `container.ts`.
   - `proxy.ts` and `api/v1/me/route.ts`.
8. Logger redacts `sb-*` keys.
9. Integration harness passes the Supabase URL and keys to `next start` and to the tests. New `src/supabase-auth.ts` (admin user creation, password sign-in, session-cookie builder) and `tests/me.test.ts`.
10. AGENTS.md Database rules (Data API lockdown, connections, migration tests, auth env vars), env example, spec decision log, lessons.

## Decisions and assumptions

- See the spec's decision log, "Phase 3 deviations and findings":
  - `Session.email`.
  - Default-privilege revoke.
  - `parseWith`.
  - Migrations glob.
  - `getToken` returns `null`.
  - No `onCreate` on `created_at`.
  - The limit of the refresh test.
- The reader passes no `setAll` to Supabase. Refresh happens in the proxy, before the handler runs. If the proxy's refresh failed, the reader's own attempt fails the same way and the request answers `401` (fail closed).
- A malformed `Authorization` header is a denial. It never falls back to cookies.
- Tokens whose role is not `authenticated`, or that lack a `sub` or an email, are rejected (anon-key JWTs also verify).

## Files changed

- `packages/core`:
  - `package.json`.
  - `src/http/{auth,auth.test,errors,index,parse,parse.test}.ts`.
  - `src/logger{,.test}.ts`.
  - `src/validators/auth/*`.
  - `src/services/auth/*`.
- `packages/db`:
  - `src/config{,.test}.ts`, `src/di{,.test}.ts`, `src/index.test.ts`, `src/mikro-orm.config{,.test}.ts`.
  - `src/entities/{index.ts,auth/user.entity.ts}`.
  - `src/repositories/auth/*`.
  - `src/migrations/Migration20261023004313{,.test}.ts`.
- `packages/app`:
  - `package.json`.
  - `src/proxy{,.test}.ts`.
  - `src/server/{env,env.test,container,container.test}.ts`.
  - `src/server/auth/*`.
  - `src/app/api/v1/me/*`.
- `packages/integration`: `src/{supabase,supabase-auth,app-server,global-setup}.ts`, `tests/me.test.ts`.
- Other: `pnpm-lock.yaml`, `AGENTS.md`, the env example, `.ai/lessons.md`, the spec, this log.

## Verification (commands run + result)

- `pnpm lint` ✅.
- `pnpm typecheck` ✅.
- `pnpm build` with no database or Supabase env ✅: `/api/v1/me` is dynamic and the proxy is registered.
- `pnpm test:coverage` ✅: 170 tests, 100% statements, branches, functions and lines.
- `pnpm db:migration:check` against the local stack ✅ ("No changes required").
- `db:migration:down` then `up` ✅.
- Grants after the migration: only `postgres` and `service_role` hold privileges on `users`, and on a probe table created afterwards ✅.
- `pnpm test:integration` with its own build ✅ 12/12:
  - 401 without credentials.
  - 401 with a forged Bearer token.
  - Bearer `200`.
  - Cookie `200`.
  - Expired cookie session refreshed in the same request, with rotated httpOnly cookies.
  - Data API returns nothing for the publishable key or a user token.
- The 6 earlier tests still pass.

## Open issues / follow-ups

- Phase 4 (web sign-in): auth routes, `(app)` pages, Mailpit confirmation, Google redirect, password reset with the recovery `amr` check.
- `secure` cookies under `next start` on `http://127.0.0.1` in the Phase 4 browser tests: verify that Chrome stores them (localhost counts as a secure context).
