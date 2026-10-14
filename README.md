# mml-bookmark

A link storage. Save links, group them, and connect them to other tools.

## Features

- **Save links**: store URLs with a title, description and tags.
- **Group links**: organize links into collections (folders, categories) so they are easy to find later.
- **Integrations**: connect with external services to import, export or sync links.

## Planned integrations

- Browser extension for one-click saving
- Import/export (browser bookmarks, JSON, CSV)
- Read-it-later and note-taking apps
- Webhooks / API for automation

## Status

Early stage. The monorepo, database layer, DI container and UI kit are scaffolded; no bookmark features are implemented yet.

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

Code is grouped by concept (`auth`, `bookmarks`, `collections`, `tags`, `enrichment`, `search`, `transfer`) with the same folder name in `db`, `core` and `app`. Services in `core` depend on repository ports; `db` implements them. Naming, security rules and the review checklist are in `.ai/docs/engineering-standards.md`; the product concept and clickable mockup are in `.ai/mockups/funtionality/`.

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
docker compose up -d            # PostgreSQL on localhost:5432
pnpm db:migration:up
pnpm dev                        # http://localhost:3000, admin at /admin
```

## Commands

| Command | What it does |
|---|---|
| `pnpm dev` | Next.js dev server |
| `pnpm build` / `pnpm start` | Production build / server |
| `pnpm typecheck` | Type-check every package |
| `pnpm lint` | Lint every package |
| `pnpm db:migration:create` | Generate a migration from entity changes |
| `pnpm db:migration:up` / `pnpm db:migration:down` | Apply / revert migrations |
| `pnpm db:migration:list` | List applied migrations |
| `pnpm --filter @mml-bookmark/ui dlx shadcn@latest add <component>` | Add a shadcn/ui component to the ui package |

## Working with AI agents

Rules for coding agents are in [`AGENTS.md`](AGENTS.md). Specs, run logs and lessons live in [`.ai/`](.ai/).
