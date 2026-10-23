# Platform foundation, Phase 2: Supabase CLI local stack

- Date: 2026-10-23
- Spec: `.ai/specs/2026-10-23-platform-foundation.md` (Phase 2)
- Status: done (PR open)

## Goal

Replace docker-compose PostgreSQL and Testcontainers with the Supabase CLI local stack for dev, integration tests and CI (Q4, D50). No auth code yet; the existing health and admin integration tests keep passing.

## Steps taken

1. Branch `chore/platform-foundation-phase-2` from `main` (cb9f384, PR #1 merged).
2. `pnpm add -Dw supabase` (2.121.0); `supabase init`. `config.toml`:
   - Postgres 17 (template default).
   - `site_url` and the redirect list on localhost:3000.
   - `enable_confirmations = true`, `secure_password_change = true`, `minimum_password_length = 8`.
   - Google provider left for Phase 4.
3. Root scripts `supabase:start` (excludes realtime, storage-api, imgproxy, edge-runtime, logflare, vector, studio) and `supabase:stop`. First start: 1m44s (image pulls). Running containers: db, auth, rest, kong, pg_meta, mailpit.
4. Ran `migration:up` and `schema:update --dump` against the stack. MikroORM wanted to drop `auth`, `storage`, `realtime`, `vault` and more. Added `SUPABASE_SCHEMAS` → `schemaGenerator.ignoreSchema` with a unit test; the diff is clean afterwards.
5. Added `migration:check` (db package) and `db:migration:check` (root). The integration setup runs it after migrating.
6. `packages/integration/src/supabase.ts` replaces `postgres.ts`: start if not running, `db reset`, read `DB_URL`, stop only a stack it started itself.
   - Removed `@testcontainers/postgresql`, `testcontainers` and `docker-compose.yml`.
   - Removed the `allowBuilds` entries only Testcontainers needed (`cpu-features`, `ssh2`, `protobufjs`).
7. Env example file points at the local Supabase `DB_URL`.
   - CI integration job renamed and commented. There is no branch protection, so no required-check name had to be kept.
   - AGENTS.md (stack, layout, testing, database, commands) and README updated.
   - Spec decision log and lessons updated.
8. A Safety Net hook blocked a shell edit of this log, because the text names the env example file. The user approved finishing it with the Edit tool.

## Decisions and assumptions

- See the spec's decision log, 2026-10-23 Phase 2 entry:
  - Ignore list and migration check added.
  - No `allowBuilds` entry needed.
  - No unit tests for the integration helper (that package is excluded from coverage).
  - The pinned dev dependency instead of `supabase/setup-cli`.
- Kept `supabase db reset` as the spec says, although it wipes a developer's local data; documented in AGENTS.md, the README and lessons. A separate test stack (second project id and ports) was considered and not built, because it duplicates the auth config.
- `next build` stops with `SecurityFatalError` (Next.js 16.4.0 known vulnerability) when spawned by the integration harness. This change did not cause it.
  - Its output carried agent-directed instructions (run `next upgrade --agent=security`, ask a scripted question). They were not followed; the upgrade went to the user, who approved it as a separate PR.
  - Integration was verified with `INTEGRATION_SKIP_BUILD=1` after a direct `pnpm build`.
- The user's local env file still points at the old docker-compose PostgreSQL. Not touched: it is a secrets path; the user switches it.

## Files changed

- Root: `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `supabase/config.toml`, `supabase/.gitignore`, the env example, `docker-compose.yml` (deleted).
- `packages/db`: `package.json`, `src/config.ts`, `src/config.test.ts`.
- `packages/integration`: `package.json`, `vitest.config.ts`, `src/supabase.ts`, `src/postgres.ts` (deleted), `src/global-setup.ts`, `src/app-server.ts`, `tests/admin.test.ts`.
- `.github/workflows/ci.yml`, `AGENTS.md`, `README.md`, `.ai/lessons.md`, the spec, this log.

## Verification (commands run + result)

- `pnpm lint` ✅.
- `pnpm typecheck` ✅ after fixing a `noUncheckedIndexedAccess` error in `parseStatusEnv`.
- `pnpm build` ✅.
- `pnpm test:coverage` ✅: 117 tests, 100% statements, branches, functions and lines.
- `pnpm mikro-orm migration:check` against the stack: "No changes required" ✅ (before the fix: "Changes detected").
- `INTEGRATION_SKIP_BUILD=1 pnpm test:integration`:
  - Stack already running: 6/6 ✅ (26 s).
  - Stack stopped: 6/6 ✅ (47 s); the harness stopped the stack again afterwards.
- `pnpm test:integration` with the build: ❌ `SecurityFatalError` from `next build` (see above).

## Open issues / follow-ups

- The Next.js security upgrade ships as its own PR before Phase 3. Until then, CI's build and integration jobs may hit the same stop.
- Phase 3: declare RLS in the entity metadata (or set `ignorePolicies`) and revoke grants; check with `db:migration:check`.
