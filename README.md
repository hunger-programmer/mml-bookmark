# mml-bookmark

A personal link library. Save a link and the server sorts it into a category; recipe videos and pages become recipe cards you can cook from without rewatching the video.

## MVP scope

Product source of truth: `.ai/specs/product-brief.md`.

- **Capture**: Chrome extension (loaded unpacked), an iOS Shortcut in the share sheet, or a pasted URL.
- **Sorting**: at most one category per link (sport exercises, recipe, fun), assigned automatically; the rest is Uncategorised.
- **Recipes**: links in `recipe` get recipe cards (name, image, ingredients, steps) extracted from the creator's description, comments, linked page or speech, translated to English, editable.
- **Library**: browse by category, search titles, ingredients and notes; works fully on a phone.
- **Accounts**: open sign-up with email + password or Google (Supabase); private libraries; an admin area.

## Status

Early stage. The monorepo, database layer, DI container, HTTP layer and UI kit are scaffolded. Next: `.ai/specs/2026-10-23-platform-foundation.md` (auth, users, admin), then the extraction, clients and library specs.

## Architecture

### Stack

| Concern | Choice |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack, Cache Components), React 19, TypeScript 6 |
| Database | PostgreSQL 17 |
| ORM | MikroORM 7: entities via `defineEntity`, migrations, connection pool from env |
| Dependency injection | Awilix |
| Public pages | Tailwind CSS 4 |
| Admin pages | shadcn/ui (Base UI primitives) on Tailwind 4 |
| Monorepo | pnpm workspaces |

### Packages

```
packages/
├── app/   @mml-bookmark/app   Next.js app: routes, pages, server actions, DI composition root
├── core/  @mml-bookmark/core  Framework-agnostic reusable code: container factory, shared types, domain services
├── db/    @mml-bookmark/db    MikroORM config, entities, migrations, ORM bootstrap, DI registration
└── ui/    @mml-bookmark/ui    shadcn/ui components, `cn` helper, admin theme CSS
```

Dependencies point one way:

```
app ──► ui
 │
 ├────► db ──► core
 │              ▲
 └──────────────┘
```

`core` and `ui` depend on no internal package. Internal packages have no build step: they export TypeScript source, which Turbopack compiles as part of the app.

### Code organisation

Code is grouped by concept (`auth`, `admin`, `bookmarks`, `recipes`, `extraction`, `search`) with the same folder name in `db`, `core` and `app`. Services in `core` depend on repository ports; `db` implements them. Naming, security rules and the review checklist are in `.ai/docs/engineering-standards.md`. The earlier product concept and clickable mockup in `.ai/mockups/funtionality/` are superseded by the brief and kept as history.

### Testing and CI

- `pnpm test` / `pnpm test:coverage`: Vitest unit tests next to the code, 100% coverage gate.
- `pnpm test:integration`: builds the app, starts (or reuses) the local Supabase stack and wipes its data, runs and checks migrations, and drives the app with agent-browser (`packages/integration`). First run: `pnpm --filter @mml-bookmark/integration browser:install`.
- GitHub Actions (`.github/workflows/ci.yml`) runs lint, typecheck, build, unit and integration jobs on every pull request.

### Request flow

```
Route / Server Component / Server Action          (packages/app)
  └─ getRequestScope()                            one Awilix scope per request (React cache)
       └─ cradle.em / cradle.<service>            services resolved from the scope
            └─ EntityManager fork                 request-scoped, from the singleton ORM
                 └─ connection pool → PostgreSQL  (packages/db, min/max from env)
```

- **ORM:** `getOrm()` in `@mml-bookmark/db` creates one connected `MikroORM` per process. It is cached on `globalThis`, so dev hot reloads reuse the pool.
- **Container:** `packages/app/src/server/container.ts` is the composition root. It builds the root container once, calls `register*` helpers from the packages (e.g. `registerDb`), and hands out per-request scopes. The ORM is a singleton; `em` is scoped, so each request gets its own identity map.
- **Typing:** packages type their registrations by augmenting the `Cradle` interface from `@mml-bookmark/core`.
- **Rendering:** Cache Components is on. Server Components that hit the database call `await connection()` and render inside `<Suspense>`, so the static shell is prerendered and the data streams in.

### Pages and styling

| Route group | URL | Styling | CSS entry |
|---|---|---|---|
| `src/app/(site)/` | `/`, public pages | Tailwind utilities | `(site)/globals.css` |
| `src/app/(admin)/admin/` | `/admin/**` | shadcn/ui from `@mml-bookmark/ui` | `@mml-bookmark/ui/globals.css` |

The two groups are separate root layouts, so the admin theme never reaches the public site.

### Database and migrations

- Entities live in `packages/db/src/entities/` and are registered explicitly in `entities/index.ts`.
- Migrations live in `packages/db/src/migrations/`. They are generated from entity changes and committed. Schema changes go through migrations only.
- The MikroORM CLI runs from `packages/db` (config: `src/mikro-orm.config.ts`, TS loaded through `tsx`). Root scripts proxy to it.

## Getting started

Requirements: Node.js >= 22.17, Docker.

```bash
corepack enable                 # provides the pinned pnpm version
pnpm install
cp .env.example .env            # one .env at the repo root, used by the app and the CLI
pnpm supabase:start             # local Supabase (PostgreSQL 17 on 127.0.0.1:54322, Auth, Mailpit on :54324)
pnpm db:migration:up
pnpm dev                        # http://localhost:3000, admin at /admin
```

## Commands

| Command | What it does |
|---|---|
| `pnpm dev` | Next.js dev server |
| `pnpm supabase:start` / `pnpm supabase:stop` | Start / stop the local Supabase stack |
| `pnpm build` / `pnpm start` | Production build / server |
| `pnpm typecheck` | Type-check every package |
| `pnpm lint` | Lint every package |
| `pnpm db:migration:create` | Generate a migration from entity changes |
| `pnpm db:migration:up` / `pnpm db:migration:down` | Apply / revert migrations |
| `pnpm db:migration:list` | List applied migrations |
| `pnpm db:migration:check` | Fail if entities and migrations disagree |
| `pnpm --filter @mml-bookmark/ui dlx shadcn@latest add <component>` | Add a shadcn/ui component to the ui package |

## Working with AI agents

Rules for coding agents are in [`AGENTS.md`](AGENTS.md). Specs, run logs and lessons live in [`.ai/`](.ai/).
