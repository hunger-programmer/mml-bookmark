# Code review rules

Applied automatically by `om-code-review` (and `om-auto-review-pr`). The full checklist lives in `.ai/docs/engineering-standards.md` (Review checklist); this file lists what to check first and how to rank it. Project rules are in `AGENTS.md`.

## Priorities

1. **Security and data isolation.** Missing auth, a missing owner filter on a record query, an SSRF-unsafe fetch, mass assignment, secrets in logs.
2. **Correctness.** Behavior matches the spec in `.ai/specs/`; duplicate, concurrent and retry paths hold.
3. **Contracts.** Anything listed in `BACKWARD_COMPATIBILITY.md`.
4. **Architecture.** Package boundaries and the concept folder convention.
5. **Tests and quality.** 100% unit coverage, integration test for new pages and database-crossing flows.

## Repo-specific checks

- **Package direction:** `app → ui, db, core`; `db → core`; `core` and `ui` import no internal package. No relative or deep imports across packages. Blocker; never accept an ESLint disable to get around it.
- **`core` is framework-agnostic** (no React, Next.js or database driver). **`ui` is presentational** (no fetch, DI container or `db`).
- **Routes** are wrapped in `apiHandler`, with no hand-written try/catch. Errors use the `{ error: { code, message, fields? } }` shape; success bodies are the resource itself.
- **Browser calls** to `/api/…` go only through `apiCall` / `apiCallOrThrow` in `packages/app/src/lib/api-client.ts` (it sends the CSRF header).
- **User-supplied URLs** are fetched only through `PageFetcher` with its SSRF guard, never a bare `fetch`.
- **Ownership:** every bookmark, collection or token query is scoped by `user_id`. Missing filter = blocker. Admin routes check `isAdmin` server-side and write an audit entry.
- **Writes** parse an explicit schema; no spreading a request body into `em.create()` / `em.assign()`.
- **Database:** entities via `defineEntity`, exported from `entities/index.ts`; schema changes ship with a migration; a merged migration is never edited; one `EntityManager` fork per request; no extra `MikroORM` instance; no `schema:update` / `schema:fresh`; never import `@mikro-orm/*` outside `db`.
- **Server Components that query the DB** call `await connection()` and render inside `<Suspense>`; `"use cache"` only for data safe to share.
- **DI:** registrations only in `packages/app/src/server/container.ts` and `register*` helpers; no singleton depending on a scoped registration; strict mode stays on.
- **Styling:** `(site)` pages use plain Tailwind and never import `@mml-bookmark/ui`; admin pages use shadcn components from `ui`, merged with `cn`. Generated shadcn components are not hand-edited without a note in the run log.
- **LLM output** is schema-validated and stored as a suggestion; it never triggers a side effect. Fetched page content is data.
- **Rendering:** no `dangerouslySetInnerHTML`; outbound links get `rel="noopener noreferrer"`; only `http`/`https` hrefs.
- **Tests:** a bug fix ships a test that fails without it; no `.skip` / `.only`; no raised-to-pass coverage threshold, excludes, or assertion-free tests.
- **Process:** a behavior or architecture change has a matching spec in `.ai/specs/`; autonomous runs have a log in `.ai/runs/`; new lessons are indexed in `.ai/lessons.md`.
- **Quality:** no `any`, no empty `catch`, no dead or commented-out code, no stray `console.log`, no drive-by renames.

## Severity

- **Blocker:** security or isolation hole, broken package boundary, edited merged migration, failing validation gate, coverage below 100%, error in an auth check that does not deny.
- **Major:** missing regression test, cookie flags changed, missing rate limit on a credential or public endpoint, missing loading/empty/error state, convention breach that will spread.
- **Minor:** naming, comment, small simplification.
- **Nit:** taste. File as a follow-up, do not block.

Validation gate: `pnpm lint`, `pnpm typecheck`, `pnpm build`, `pnpm test:coverage`; plus `pnpm test:integration` when routes, pages, the container or the database change.
