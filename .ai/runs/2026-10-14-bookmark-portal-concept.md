# Bookmark portal initial concept

- Date: 2026-10-14
- Spec: none (user request)
- Status: done

## Goal
Concept docs (users, use cases/flows, screen map, per-screen specs) and clickable HTML/CSS/TS mockups, zipped, stored in `.ai/mockups/funtionality/`.

## Steps taken
1. Read lessons and AGENTS.md; created branch `docs/bookmark-portal-concept`.
2. Wrote docs 01–04 (users, use cases/flows, screen map, per-screen specs + endpoint catalogue).
3. Built the mockup (`index.html`, `styles.css`, `app.ts` → `app.js`); smoke-tested all 18 routes x 4 forced states in jsdom plus the add / validate / duplicate / inbox-accept flows (0 errors).
4. Zipped as `.ai/mockups/bookmark-portal-concept.zip` (README, docs/, mockups/). Committed unpacked too.
5. User follow-up: rewrote `.ai/docs/engineering-standards.md`. The committed file described another product (mentor booking, `app → core → db`); rewritten for mml-bookmark from AGENTS.md + the mockup structure.
6. User follow-up: implemented the standards' foundation (section 5 steps 1–4).

## Decisions and assumptions
- Folder name `funtionality` kept exactly as the user spelled it.
- Mockups are plain static files (no Next.js, no new dependencies); TS compiled with `npx -p typescript@6.0` and both committed so `index.html` opens from `file://`.
- Pushed to a feature branch, not `main`.
- Standards: services depend on repository ports declared in `core` (AGENTS.md has `db → core`); `api-client` in `app` because `ui` must not fetch; `makeCrudRoute`, `data-table`, `crud-form`, `config/env.ts` deferred until a second consumer (YAGNI).
- Not decided, listed in standards section 6: `(app)` route group, Zod, auth mechanism, test runner. Nothing was installed for these.

## Files changed
- `.ai/mockups/**`, `.ai/mockups/bookmark-portal-concept.zip`
- `.ai/docs/engineering-standards.md`, `AGENTS.md`, `.ai/lessons.md`
- `packages/core`: `src/http/{errors,api-handler,auth,index}.ts`, `src/events/*`, `src/logger.ts`, `src/register.ts`, `src/index.ts`, `package.json` (subpath exports `./http`, `./events`)
- `packages/app`: `src/lib/api-client.ts`, `src/app/api/v1/health/route.ts`, `src/server/container.ts` (`registerCore`)
- `packages/ui`: `src/components/feedback/{loading,error,empty}-state.tsx`

## Verification
- `tsc` for app.ts: no errors. jsdom smoke test: 72 route/state renders, 0 errors; flows behave as documented.
- `pnpm typecheck && pnpm lint && pnpm build`: all pass.
- `next start` + `curl /api/v1/health` → 200 `{"status":"ok"}` with no database running.
- Throwaway script (esbuild bundle): apiHandler maps 409/422/429 (+Retry-After)/500 correctly, unknown errors give a generic body and are logged, CSRF header required on POST, reader failure → 401, ownership miss → 403, logger redacts password/Authorization.
- No unit tests committed: the stack has no test runner (open decision).

## Open issues / follow-ups
- Not visually checked in a real browser (jsdom only).
- Decisions in standards section 6 need the user's answer before the `bookmarks` concept is built.
- `pnpm install` printed "Ignored build scripts: esbuild" (pnpm approve-builds); did not change it.
