# Lessons

Long-term memory for LLM agents working in this repo. Read it before starting a task. Add to it after fixing a bug, hitting a surprise, or finding an improvement.

Keep this file an **index of one-liners**. Detail goes in `.ai/lessons/YYYY-MM-DD-slug.md`; link it from here. Newest entries first.

## Entry format

```
- YYYY-MM-DD — <one-line lesson> → [details](lessons/YYYY-MM-DD-slug.md)
```

Omit the link when the lesson fits in the one line.

## Lessons

<!-- Add new entries below this line, newest first. -->
- 2026-10-14 — `.ai/docs/engineering-standards.md` was a template for another product (mentor booking, `app → core → db`). When a doc disagrees with `AGENTS.md`, `AGENTS.md` wins: here `db → core`, so services use repository ports declared in `core`.
- 2026-10-14 — `ui` must not fetch, so `api-client` lives in `app`; `CrudForm`/`DataTable` take callbacks and props, not schemas, to keep `ui` independent of `core`.
- 2026-10-14 — Augmenting an interface re-exported from a package subpath (`declare module "@mml-bookmark/core/events" { interface EventMap … }`) does type-check and narrows `EventBus.emit`; verified with a negative test.
- 2026-10-14 — `/api/v1/health` calls `await connection()` so it is built as dynamic (`ƒ`) under `cacheComponents`; I did not test the handler without it.
- 2026-10-13 — MikroORM 7 `MikroORM.init()` does not connect; `checkConnection()` says "Connection not established" until the first query. `getOrm()` calls `orm.connect()` explicitly.
- 2026-10-13 — typescript-eslint (and so eslint-config-next) refuses TypeScript 7 (peer `<6.1.0`). Keep `typescript@~6.0` at the root until it supports 7.
- 2026-10-13 — Next.js loads `.env` only from `packages/app`, and the MikroORM CLI loads none. The root `.env` is loaded explicitly: `@next/env` in `next.config.ts`, `process.loadEnvFile` in `packages/db/src/env.ts`.
- 2026-10-13 — `next dev` writes its managed AGENTS.md blocks into the Next project dir (`packages/app/`), not the repo root.
- 2026-10-13 — `LayoutProps`/`PageProps` are generated globals; standalone `tsc` needs `next typegen` first (the app's `typecheck` script does it).
- 2026-10-13 — shadcn 4 defaults to Base UI primitives (`base-nova` style), not Radix, and uses the `cn` package instead of clsx + tailwind-merge.
