## Next.js version

The app runs on Next.js 16 with breaking changes compared to older versions — APIs, conventions and file structure may differ from your training data. Before writing Next.js code, read the relevant guide in `packages/app/node_modules/next/dist/docs/` and heed deprecation notices. `next dev` maintains its own managed block in `packages/app/AGENTS.md`; commit it when it changes.

## Project: mml-bookmark

A link/bookmark storage app: save links, group them, connect them to other tools.

## Stack

These are fixed decisions. Do not swap a library or add an alternative to one of them without the user's approval.

| Concern | Choice |
|---|---|
| Language | TypeScript (strict), pinned to 6.0.x — typescript-eslint does not support TS 7 yet |
| Framework | Next.js 16 (App Router), React 19 |
| Database | PostgreSQL 17 |
| ORM | MikroORM 7 (`@mikro-orm/postgresql`), migrations via `@mikro-orm/migrations`, connection pool configured from env |
| Dependency injection | Awilix |
| Styling, public pages | Tailwind CSS 4 |
| Styling, admin ("backend") pages | shadcn/ui (Base UI primitives, `base-nova` style) on Tailwind 4 |
| Package manager | pnpm workspaces (version pinned in root `packageManager`) |
| Runtime | Node.js >= 22.17 |

## Monorepo layout

```
packages/
├── app/   @mml-bookmark/app   Next.js application: routes, pages, server actions, composition root
├── core/  @mml-bookmark/core  Reusable, framework-agnostic code: DI container helpers, shared types, domain services
├── db/    @mml-bookmark/db    Data layer: MikroORM config, entities, repositories, migrations, ORM bootstrap
└── ui/    @mml-bookmark/ui    Reusable UI components (shadcn/ui), `cn` helper, admin theme CSS
```

`packages/` is the only place for code. New sub-packages go there, named `@mml-bookmark/<name>`, and are added to this table and to the README.

### Package rules

1. **Dependency direction:** `app → ui, db, core`; `db → core`; `core` and `ui` depend on no internal package. Never import "upwards" (e.g. `core` importing `db`, anything importing `app`).
2. **Source-only packages.** Internal packages have no build step; their `exports` point at `src/*.ts(x)`. Turbopack transpiles workspace packages itself, so no `transpilePackages` entry is needed. Server-only third-party packages that must not be bundled go in `serverExternalPackages` in `packages/app/next.config.ts`.
3. **Import through `exports` only** (`@mml-bookmark/db`, `@mml-bookmark/ui/components/button`). No relative imports across package boundaries, no deep imports into another package's `src/`.
4. **`core` stays framework-agnostic:** no React, no Next.js, no database driver imports.
5. **`ui` is presentational:** no data fetching, no DI container, no `db` imports.
6. **Shared dependencies keep one version.** `react`/`react-dom` are peer dependencies of library packages. Dev tooling (TypeScript, ESLint) lives in the root `package.json`.

### Domain concept convention

Code is organised by concept, not by a module runtime. A concept (`auth`, `bookmarks`, `collections`, `tags`, `enrichment`, `search`, `transfer`) is a same-named sub-folder repeated in the layers that need it:

- `packages/db/src/entities/<concept>/<name>.entity.ts` and `repositories/<concept>/`
- `packages/core/src/services/<concept>/` (services, repository and external ports, adapters) and `validators/<concept>/`
- `packages/app/src/app/api/v1/<concept>/.../route.ts` and the pages that use it

Create a concept folder only when its first file is added. `core` cannot import `db`, so a service depends on a repository **port** declared in `core`; `db` implements it and the composition root binds the two. Event IDs are `concept.entity.action` (e.g. `bookmarks.bookmark.created`), emitted through the in-process `EventBus` from `@mml-bookmark/core/events`; there is no queue. Full naming table, security rules and review checklist: `.ai/docs/engineering-standards.md`.

### Shared API and UI layers

- `@mml-bookmark/core/http` — `AppError` hierarchy, `apiHandler`, `json`/`readJson`, `requireSession`/`requireToken`/`requireAdmin`/`assertOwns`. Every route handler is wrapped in `apiHandler`; none writes its own try/catch. Errors are `{ "error": { code, message, fields? } }`; success bodies are the resource itself.
- `packages/app/src/lib/api-client.ts` (`apiCall`, `apiCallOrThrow`) — the only browser `fetch('/api/…')` call site. It always sends the CSRF header.
- `packages/ui/src/components/feedback/` — `LoadingState`, `ErrorState`, `EmptyState`: the only loading/error/empty renderers.
- Server code that fetches a user-supplied URL goes through a `PageFetcher` port with an SSRF guard, never a bare `fetch`.

## Styling

- **Public pages** live in `packages/app/src/app/(site)/` and use plain Tailwind utility classes. Their CSS entry is `(site)/globals.css`. Do not import `@mml-bookmark/ui` components there.
- **Admin ("backend") pages** live in `packages/app/src/app/(admin)/admin/` and are built from shadcn/ui components in `@mml-bookmark/ui`. Their CSS entry is `@mml-bookmark/ui/globals.css`.
- `(site)` and `(admin)` are separate root layouts, so the two themes never mix. Moving between them is a full page load; that is intended.
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
| `pnpm db:migration:create` | Generate a migration from entity changes |
| `pnpm db:migration:up` / `db:migration:down` | Apply / revert migrations |
| `pnpm db:migration:list` | List applied migrations |

Before calling a task done: `pnpm typecheck && pnpm lint && pnpm build` must pass.

## `.ai/` — mandatory metadata structure

All AI-related project metadata lives in `.ai/`. Agents MUST follow this structure.

```
.ai/
├── specs/                  # Specifications for spec-driven development (SDD)
│   ├── YYYY-MM-DD-slug.md  # Active specs
│   ├── implemented/        # Specs whose work is merged
│   └── archive/            # Abandoned / superseded specs
├── runs/                   # Logs of autonomous AI runs
│   └── YYYY-MM-DD-slug.md
├── lessons.md              # Index of lessons learned (one line each)
└── lessons/                # Detailed lessons
    └── YYYY-MM-DD-slug.md
```

Each folder has a `README.md` with its template. `.ai/cezar/` and `.ai/mcp/` belong to external tooling — do not edit them.

### Naming

Every file in `specs/`, `runs/` and `lessons/` is named `YYYY-MM-DD-slug.md`: ISO date, lowercase kebab-case slug. No other naming schemes.

### Rules

1. **Specs drive work (SDD).** If a task references a spec, read it first and implement exactly what it says. If the code and the spec disagree, stop and flag it; do not silently deviate. Do not edit a spec's requirements without the user's approval.
2. **Spec lifecycle.** When a spec's work is merged, `git mv` it from `specs/` to `specs/implemented/`. Abandoned or superseded specs go to `specs/archive/` with a one-line reason at the top. Never delete specs.
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
