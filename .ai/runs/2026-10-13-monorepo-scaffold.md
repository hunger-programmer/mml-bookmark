# Monorepo scaffold + architecture docs

- Date: 2026-10-13
- Spec: none (plan approved in session)
- Status: done

## Goal
Turn the single create-next-app into a pnpm monorepo (`packages/{app,core,db,ui}`) with PostgreSQL + MikroORM (migrations, pooling), Awilix DI, Tailwind for public pages and shadcn/ui for admin pages. Document the rules in AGENTS.md and the architecture in README.md.

## Steps taken
1. Created this run log.
2. `git mv` of the Next app (app/, public/, next.config.ts, eslint.config.mjs, tsconfig.json, package.json) into `packages/app`; removed package-lock.json; pnpm 12.11.2 via corepack; `pnpm-workspace.yaml` with `allowBuilds: unrs-resolver`.
3. Root: package.json (script proxies), tsconfig.base.json, docker-compose.yml (postgres:17), .env.example, shared eslint.config.mjs for library packages; .gitignore unanchored for nested packages, `!.env.example`.
4. ui: scaffolded a throwaway `shadcn init --monorepo` in /tmp and copied its ui package shape (components.json, globals.css, button, `cn`). shadcn 4 defaults to Base UI (`base-nova`), not Radix.
5. app: split into route groups `(site)` (Tailwind, own root layout) and `(admin)/admin` (shadcn theme, own root layout).
6. core: `createAppContainer()` (Awilix, PROXY, strict) + augmentable `Cradle` interface.
7. TypeScript 7.0.2 installed first; typescript-eslint refuses TS 7 (`>=4.8.4 <6.1.0`). Pinned `typescript@~6.0.3` at the root.
8. db: `createOrmConfig` (clientUrl + pool from env), `getOrm()` cached on globalThis, `registerDb` (orm singleton, `em` scoped fork), CLI config with Migrator + tsx loader, root `.env` loader.
9. Probed `defineEntity` + `migration:create` with a throwaway entity (correct `create table` SQL), then removed it.
10. app: next.config loads root `.env` via `@next/env`, adds `serverExternalPackages`; composition root `src/server/container.ts` (`getRequestScope` via React `cache`); `/admin` page checks DB through a request-scoped `em` inside Suspense + `connection()`.
11. Runtime check found "Connection not established": MikroORM 7 `init()` does not connect. `getOrm()` now calls `orm.connect()`.
12. Wrote AGENTS.md (stack, layout, package/styling/DB/DI rules, commands), README architecture, `packages/app/AGENTS.md` pointer (next dev manages blocks there), lessons.

## Decisions and assumptions
- pnpm workspaces, scope `@mml-bookmark/*` (user choice).
- Internal packages are source-only (exports point at `src/*.ts`), compiled by Turbopack as part of the app.
- MikroORM entities via `defineEntity` (no decorators, no reflect-metadata).
- No domain entities yet; Bookmark/Collection model is a separate spec.
- No `transpilePackages`: Turbopack transpiles workspace packages itself.
- Root AGENTS.md: replaced the Next-managed block with a plain note, since `next dev` now manages `packages/app/AGENTS.md`.
- Separate root layouts for `(site)` and `(admin)` so the shadcn theme cannot leak into public pages.

## Files changed
- Root: package.json, pnpm-workspace.yaml, pnpm-lock.yaml, tsconfig.base.json, eslint.config.mjs, docker-compose.yml, .env.example, .gitignore, AGENTS.md, README.md, .ai/lessons.md; removed package-lock.json
- packages/app: moved Next app; next.config.ts, tsconfig.json, package.json, AGENTS.md, CLAUDE.md, src/app/(site)/*, src/app/(admin)/admin/{layout,page}.tsx, src/server/container.ts
- packages/core: src/{container,index}.ts
- packages/db: src/{config,env,orm,di,index,mikro-orm.config}.ts, src/entities/index.ts, src/migrations/
- packages/ui: components.json, src/components/button.tsx, src/lib/utils.ts, src/styles/globals.css

## Verification (commands run + result)
- `pnpm install --frozen-lockfile` ok
- `pnpm typecheck` ok (4 packages), `pnpm lint` ok (4 packages), `pnpm build` ok (`/` static, `/admin` partial prerender)
- `docker compose up -d --wait` + `pnpm db:migration:list|create|up` ok; `mikro-orm debug`: config found, tsx loader, connection successful
- `next start` and `next dev`: `/` 200, `/admin` renders "Database: connected" and the shadcn Button; separate CSS bundles per route group

## Open issues / follow-ups
- Root `.env` loading not exercised end-to-end: a safety hook blocks agents from creating `.env`; tests passed `DATABASE_URL` inline. User should `cp .env.example .env` and run `pnpm dev` once.
- Spec + implementation for the domain model (Bookmark, Collection, tags) and first real migration.
- Auth for `/admin`.
- Test framework (unit + DB integration) not chosen yet.
- Move to TypeScript 7 once typescript-eslint supports it.
