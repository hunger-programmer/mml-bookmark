## Next.js version

The app runs on Next.js 16 with breaking changes compared to older versions — APIs, conventions and file structure may differ from your training data. Before writing Next.js code, read the relevant guide in `packages/app/node_modules/next/dist/docs/` and heed deprecation notices. `next dev` maintains its own managed block in `packages/app/AGENTS.md`; commit it when it changes.

## Project: mml-bookmark

A personal link library: save a link from the Chrome extension, an iOS Shortcut or by pasting it; the server sorts it into at most one category (sport exercises, recipe, fun) and turns recipe videos and pages into recipe cards. Product source of truth: `.ai/specs/product-brief.md`.

## Stack

These are fixed decisions. Do not swap a library or add an alternative to one of them without the user's approval. Rows marked *(planned)* are decided but not in the code yet; the named spec adds them.

| Concern | Choice |
|---|---|
| Language | TypeScript (strict), pinned to 6.0.x — typescript-eslint does not support TS 7 yet |
| Framework | Next.js 16 (App Router), React 19 |
| Database | PostgreSQL 17, hosted on Supabase (D41) |
| ORM | MikroORM 7 (`@mikro-orm/postgresql`), migrations via `@mikro-orm/migrations`, connection pool configured from env |
| Authentication | Supabase Auth through `@supabase/ssr` + `@supabase/supabase-js`, server-side only; email + password and Google (D22, D46, D54) *(planned: platform-foundation spec)* |
| Validation | Zod 4, schemas in `core` shared by route and form (D49) *(planned: platform-foundation spec)* |
| Transactional email | Resend SMTP, configured as Supabase Auth's custom SMTP *(planned: platform-foundation spec)* |
| Model provider | OpenAI, including Whisper (D38) *(planned: extraction spec)* |
| Hosting | Vercel for the web app at mml-bookmarks.hunger-programmers.com (D41, D61); a Fly.io worker container for background processing (D48, D56, *planned: extraction spec*); production and local only, no staging (D58) |
| Dependency injection | Awilix |
| Styling, public pages | Tailwind CSS 4 |
| Styling, product and admin pages | shadcn/ui (Base UI primitives, `base-nova` style) on Tailwind 4 |
| Unit tests | Vitest 5 + `@vitest/coverage-v8` (root dev dependency) |
| Integration tests | Vitest + Testcontainers (`@testcontainers/postgresql`) + agent-browser, in `packages/integration` |
| Package manager | pnpm workspaces (version pinned in root `packageManager`) |
| Runtime | Node.js >= 22.17 |

## Monorepo layout

```
packages/
├── app/   @mml-bookmark/app   Next.js application: routes, pages, server actions, composition root
├── core/  @mml-bookmark/core  Reusable, framework-agnostic code: DI container helpers, shared types, domain services
├── db/    @mml-bookmark/db    Data layer: MikroORM config, entities, repositories, migrations, ORM bootstrap
├── ui/    @mml-bookmark/ui    Reusable UI components (shadcn/ui), `cn` helper, admin theme CSS
├── integration/ @mml-bookmark/integration  Integration tests only: Testcontainers PostgreSQL + agent-browser against a production build
└── extension/   @mml-bookmark/extension    (planned: clients spec) Chrome extension, loaded unpacked (D57); calls `/api/v1` with a Supabase Bearer token
```

`packages/` is the only place for code. New sub-packages go there, named `@mml-bookmark/<name>`, and are added to this table and to the README.

### Package rules

1. **Dependency direction:** `app → ui, db, core`; `db → core`; `extension → core` (D49; it reaches the server only over HTTP); `core` and `ui` depend on no internal package; `integration` depends on none (it drives the built app over HTTP and a browser). Never import "upwards" (e.g. `core` importing `db`, anything importing `app`).
2. **Source-only packages.** Internal packages have no build step; their `exports` point at `src/*.ts(x)`. Turbopack transpiles workspace packages itself, so no `transpilePackages` entry is needed. Server-only third-party packages that must not be bundled go in `serverExternalPackages` in `packages/app/next.config.ts`.
3. **Import through `exports` only** (`@mml-bookmark/db`, `@mml-bookmark/ui/components/button`). No relative imports across package boundaries, no deep imports into another package's `src/`.
4. **`core` stays framework-agnostic:** no React, no Next.js, no database driver imports.
5. **`ui` is presentational:** no data fetching, no DI container, no `db` imports.

Rules 1, 3, 4 and 5 are enforced by ESLint (`eslint.config.mjs`, `packages/app/eslint.config.mjs`); `pnpm lint` fails on a violation. Do not disable these rules to get a change through; fix the dependency direction.
6. **Shared dependencies keep one version.** `react`/`react-dom` are peer dependencies of library packages. Dev tooling (TypeScript, ESLint) lives in the root `package.json`.

### Domain concept convention

Code is organised by concept, not by a module runtime. A concept (`auth`, `admin`, `bookmarks`, `recipes`, `extraction`, `search`) is a same-named sub-folder repeated in the layers that need it:

- `packages/db/src/entities/<concept>/<name>.entity.ts` and `repositories/<concept>/`
- `packages/core/src/services/<concept>/` (services, repository and external ports, adapters) and `validators/<concept>/`
- `packages/app/src/app/api/v1/<concept>/.../route.ts` and the pages that use it

Create a concept folder only when its first file is added. `core` cannot import `db`, so a service depends on a repository **port** declared in `core`; `db` implements it and the composition root binds the two. Event IDs are `concept.entity.action` (e.g. `bookmarks.bookmark.created`), emitted through the in-process `EventBus` from `@mml-bookmark/core/events`. The event bus is not a queue: background processing (categorisation, extraction, transcription) runs in the worker, which polls a job table that Next.js only writes to (D48, extraction spec). Full naming table, security rules and review checklist: `.ai/docs/engineering-standards.md`.

### Shared API and UI layers

- `@mml-bookmark/core/http` — `AppError` hierarchy, `apiHandler`, `json`/`readJson`, `requireSession`/`requireToken`/`requireAdmin`/`assertOwns`. Every route handler is wrapped in `apiHandler`; none writes its own try/catch. Errors are `{ "error": { code, message, fields? } }`; success bodies are the resource itself.
- `packages/app/src/lib/api-client.ts` (`apiCall`, `apiCallOrThrow`) — the only browser `fetch('/api/…')` call site. It always sends the CSRF header.
- `packages/ui/src/components/feedback/` — `LoadingState`, `ErrorState`, `EmptyState`: the only loading/error/empty renderers.
- Server code that fetches a user-supplied URL goes through a `PageFetcher` port with an SSRF guard, never a bare `fetch`.

## Testing and CI

- **Every new feature is covered 100% by unit tests** (statements, branches, functions, lines). `pnpm test:coverage` enforces it through thresholds in `vitest.config.mts`; CI fails below 100%. Do not lower a threshold, add coverage excludes, or write tests that execute code without asserting behavior to get past the gate. Code that cannot be unit tested needs a refactor (see `database-status.tsx`, split out of the admin page for this reason), not an exclusion.
- Unit tests sit next to the code as `<name>.test.ts(x)`. Pure logic runs in Node; React components render with `renderToStaticMarkup`; Next.js, container and database edges are mocked at the module boundary (`vi.mock`). A bug fix ships a test that fails without the fix.
- **Integration tests** live only in `packages/integration/tests/`. They run against a real production build, a PostgreSQL container started by Testcontainers (`postgres:17-alpine`, migrations applied through `pnpm db:migration:up`) and a real browser driven through the agent-browser CLI (`src/browser.ts`). Add an integration test for every new page and for every flow that crosses the database. They do not count toward unit coverage.
- **CI** (`.github/workflows/ci.yml`) runs on every pull request, as separate jobs: lint, typecheck, build (without a database), unit tests with the coverage gate, integration tests. All five must pass to merge. The build job must pass with no `DATABASE_URL`.
- Never skip or `.only` a test in a committed change.

## Specification-driven development (`.ai/specs/`)

`.ai/specs/` is where decisions live. For any change to behavior, requirements, architecture or tooling:

1. **Spec first.** Before implementing, create `.ai/specs/YYYY-MM-DD-slug.md` from the template in `.ai/specs/README.md`: problem, requirements, decisions with the reason and the alternatives rejected, acceptance criteria, out of scope. Get the user's approval for anything that changes a stated requirement or a fixed decision.
2. **Then implement** exactly what the spec says. If reality forces a deviation, update the spec in the same change and record why under "Decisions"; do not drift silently.
3. **Changed requirements** mean a spec change first, then the code. Record the decision (what changed, why, who approved) in the spec's "Decision log".
4. **Lifecycle:** active specs stay in `specs/` and keep the name `YYYY-MM-DD-slug.md`. Once the spec is implemented, `git mv` it to `specs/archive/` (name unchanged) with its status set to `implemented`. Abandoned or superseded specs go to `specs/archive/` too, with a one-line reason at the top. Never delete. The Decision log stays in the file, so the archive is the project's decision history.
5. Trivial fixes (typo, dependency bump, one-line bug fix with a test) do not need a spec; say so in the run log.

## Styling

- **Public pages** live in `packages/app/src/app/(site)/` and use plain Tailwind utility classes. Their CSS entry is `(site)/globals.css`. Do not import `@mml-bookmark/ui` components there.
- **Product pages** (sign-in, the library and everything a signed-in user sees) live in `packages/app/src/app/(app)/` and are built from shadcn/ui components in `@mml-bookmark/ui`, phone-first (D54). Their CSS entry is `@mml-bookmark/ui/globals.css`. *(The group is created by the platform-foundation spec.)*
- **Admin ("backend") pages** live in `packages/app/src/app/(admin)/admin/` and are built from shadcn/ui components in `@mml-bookmark/ui`. Their CSS entry is `@mml-bookmark/ui/globals.css`.
- `(site)`, `(app)` and `(admin)` are separate root layouts. `(site)` never mixes with the shadcn theme; `(app)` and `(admin)` share it. Moving between groups is a full page load; that is intended.
- The interface is English only (N06).
- Add shadcn components to the ui package, never to the app: `pnpm --filter @mml-bookmark/ui dlx shadcn@latest add <component>`. Do not hand-edit generated components unless the change is deliberate and noted in the run log.
- Merge class names with `cn` from `@mml-bookmark/ui/lib/utils`.

## Database (MikroORM + PostgreSQL)

- **Entities** live in `packages/db/src/entities/`, defined with `defineEntity` (no decorators, no `reflect-metadata`). Export each one from `packages/db/src/entities/index.ts`; the ORM config registers that list explicitly (no folder discovery).
- **Schema changes go through migrations only.** Change the entity, then `pnpm db:migration:create`, review the generated SQL, commit it with the entity change. Never use `schema:update`/`schema:fresh` against a shared or production database. Never edit a migration that has been merged; add a new one.
- **Connection pool** is configured in `packages/db/src/config.ts` from `DB_POOL_MIN` / `DB_POOL_MAX`. Do not create extra `MikroORM` instances; use `getOrm()` from `@mml-bookmark/db`, which caches one connected instance per process (it survives Next.js HMR). MikroORM 7's `init()` does not connect by itself; `getOrm()` calls `connect()`.
- **One `EntityManager` fork per request.** Never use the global `orm.em` in request code. Resolve `em` from a request-scoped container (see DI) or call `orm.em.fork()` yourself in scripts.
- Database access is server-only. Never import `@mml-bookmark/db` from a Client Component.
- **Server Components that query the database** must `await connection()` (from `next/server`) before the query and render inside `<Suspense>`. With `cacheComponents` enabled, Next.js cannot see DB calls and would otherwise try to prerender them. Use `"use cache"` only for data that is safe to share across requests.
- Configuration comes from env vars (`DATABASE_URL`, `DB_POOL_MIN`, `DB_POOL_MAX`, `DB_DEBUG`) in one `.env` at the repo root; see `.env.example`. `next.config.ts` and the MikroORM CLI config both load it explicitly (Next.js alone only reads `packages/app/.env`). Never commit `.env` or real credentials.

## Dependency injection (Awilix)

- The container is created with `createAppContainer()` from `@mml-bookmark/core` (PROXY injection, strict mode). Dependencies are injected as a single cradle object: `constructor({ em, bookmarkRepository }: Cradle)`.
- **Composition root:** `packages/app/src/server/container.ts` is the only place that registers things in the root container. Packages expose `register*` helpers (e.g. `registerDb` in `@mml-bookmark/db`); the composition root calls them.
- **Lifetimes:** stateless services and the ORM are singletons; anything holding the request `EntityManager` is scoped. Strict mode rejects a singleton that depends on a scoped registration; fix the lifetime, do not turn strict mode off.
- **Per-request scope:** server code (pages, route handlers, server actions) calls `getRequestScope()` from `@/server/container` and resolves from its `cradle`. It is wrapped in React `cache()`, so all Server Components of one request share one scope and one `em`. Do not pass the container into components or `ui`.
- Type registrations by augmenting the `Cradle` interface (`declare module "@mml-bookmark/core" { interface Cradle { ... } }`) next to the `register*` helper that adds them.
- The container is server-only; the composition root imports `server-only`.

## Commands

Run from the repo root.

| Command | What it does |
|---|---|
| `pnpm install` | Install all workspace dependencies |
| `docker compose up -d` | Start local PostgreSQL |
| `pnpm dev` | Next.js dev server (`packages/app`) |
| `pnpm build` / `pnpm start` | Production build / server |
| `pnpm typecheck` | `tsc --noEmit` in every package (app runs `next typegen` first) |
| `pnpm lint` | ESLint in every package |
| `pnpm test` / `pnpm test:coverage` | Unit tests / unit tests with the 100% coverage gate |
| `pnpm test:integration` | Builds the app, starts PostgreSQL in Docker, applies migrations, runs browser tests (needs Docker; first run: `pnpm --filter @mml-bookmark/integration browser:install`) |
| `pnpm db:migration:create` | Generate a migration from entity changes |
| `pnpm db:migration:up` / `db:migration:down` | Apply / revert migrations |
| `pnpm db:migration:list` | List applied migrations |

Before calling a task done: `pnpm typecheck && pnpm lint && pnpm build && pnpm test:coverage` must pass. Run `pnpm test:integration` too when the change touches routes, pages, the container or the database.

## `.ai/` — mandatory metadata structure

All AI-related project metadata lives in `.ai/`. Agents MUST follow this structure.

```
.ai/
├── specs/                  # Specifications for spec-driven development (SDD)
│   ├── YYYY-MM-DD-slug.md  # Active specs
│   ├── research/           # Discovery inputs: interview notes, data extracts, decision records (read by om-discover)
│   └── archive/            # Implemented, abandoned or superseded specs (history; never deleted)
├── runs/                   # Logs of autonomous AI runs
│   └── YYYY-MM-DD-slug.md
├── lessons.md              # Index of lessons learned (one line each)
├── lessons/                # Detailed lessons
│   └── YYYY-MM-DD-slug.md
├── docs/                   # Long-lived project docs (engineering-standards.md)
└── mockups/                # Superseded product concept (D39), kept as history: docs/ + clickable HTML/TS mockup
    └── funtionality/       # (sic) open mockups/index.html; bookmark-portal-concept.zip is the same content
```

Each of `specs/`, `runs/` and `lessons/` has a `README.md` with its template. `docs/` and `mockups/` are not dated: update them in place.

Product source of truth: `.ai/specs/product-brief.md` (scope, business rules R*, non-goals N*, decisions D*), then the active specs in `.ai/specs/`, then `.ai/docs/engineering-standards.md` (naming, security, review checklist). The concept in `.ai/mockups/funtionality/` is superseded (D39); use it only for history or UI inspiration, never for scope or the API. A business rule, non-goal or decision changes only through a superseding row the founder approves. `.ai/cezar/` and `.ai/mcp/` belong to external tooling — do not edit them.

### Naming

Every file in `specs/`, `runs/` and `lessons/` is named `YYYY-MM-DD-slug.md`: ISO date, lowercase kebab-case slug. No other naming schemes.

### Rules

1. **Specs drive work (SDD).** If a task references a spec, read it first and implement exactly what it says. If the code and the spec disagree, stop and flag it; do not silently deviate. Do not edit a spec's requirements without the user's approval.
2. **Spec lifecycle.** When a spec is implemented, `git mv` it from `specs/` to `specs/archive/`. Abandoned or superseded specs go there too, with a one-line reason at the top. Never delete specs. Names stay `YYYY-MM-DD-slug.md`.
3. **Log every autonomous run.** Any run without step-by-step human supervision MUST create `.ai/runs/YYYY-MM-DD-slug.md` at the start and keep it updated: goal, linked spec, steps, decisions and assumptions, files changed, verification commands and results, open issues. Never overwrite an existing run log; pick a more specific slug.
4. **Read lessons first.** Before starting a task, read `.ai/lessons.md` and follow the relevant entries.
5. **Record lessons.** After fixing a bug, hitting an unexpected behavior, or finding an improvement worth keeping, add a one-line entry to the top of the list in `.ai/lessons.md`. If it needs more than a line, put the detail in `.ai/lessons/YYYY-MM-DD-slug.md` and link it. Every file in `lessons/` must be indexed in `lessons.md`.
6. **Keep the docs true.** If you change this structure, update this section in `AGENTS.md` (CLAUDE.md imports it).

## Working practices

Distilled from Boris Cherny's Claude Code tips.

1. **Plan first.** Start any non-trivial task in plan mode and agree on the approach before writing code. If the work goes sideways, stop and re-plan instead of pushing through.
2. **Self-correct this file.** After any correction from the user, add a rule to this file (project-wide) or to `.ai/lessons.md` (specific finding) so the mistake does not repeat. Rewrite rules that did not work; keep the file short.
3. **Debug from evidence.** For a bug, start from the error log, stack trace or a failing test. Reproduce it, fix the root cause, and confirm with the same test or command. Do not ask the user to micromanage the steps.
4. **Verify before claiming done.** Run the tests, type-check and lint, and check the behavior yourself. Review your own diff critically ("would this pass review?") before opening a PR. If a cleaner solution is obvious after the first attempt, redo it.
5. **Protect context with subagents; commit reusable tooling.** Delegate research and broad searches to subagents and keep the main context for the task. Repetitive workflows belong in committed skills or slash commands, not in ad-hoc prompts.
