# Backward compatibility

Protected contract surfaces. Review skills check changes against this file; implementation skills warn when a change breaks it. The project is pre-1.0 and has no released consumers yet, so the paths below are the process to follow from the first release on. Until then, a breaking change still needs a spec update (`.ai/specs/`) and a note in the PR.

## Surfaces

| Surface | Where | Breaking change | Required path |
|---|---|---|---|
| HTTP API `/api/v1/**` | `packages/app/src/app/api/v1/<concept>/.../route.ts` | Removing or renaming a route, method, field or error `code`; narrowing accepted input; changing a status code or the `{ error: { code, message, fields? } }` shape | Add the new shape alongside the old one, mark the old one deprecated in the PR and spec, remove it in a later PR; a truly incompatible change goes to `/api/v2`. The capture-token endpoints used by the browser extension are the strictest case: extensions update slowly |
| Database schema | `packages/db/src/entities/**`, `migrations/` | Dropping or renaming a column or table, tightening a constraint on existing rows, editing a merged migration | New migration only; expand then contract (add, backfill, switch reads, drop in a later release); `risk-high` rules apply: migration tested up and down, rollback plan in the PR body |
| Internal package exports | `exports` of `@mml-bookmark/core` (`.`, `./http`, `./events`), `@mml-bookmark/db`, `@mml-bookmark/ui` (`./components/*`, `./lib/*`, `./hooks/*`, `./globals.css`) | Removing or renaming an export or entry point, changing a signature | Update every consumer in the same PR (the monorepo ships together); keep a re-export or alias only if a consumer lives outside the PR |
| Domain events | `concept.entity.action` IDs on the in-process `EventBus` | Renaming an ID, removing or retyping a payload field | Emit the old and new ID during the transition, or change all subscribers in the same PR |
| Environment variables | `.env.example` (`DATABASE_URL`, `DB_POOL_MIN`, `DB_POOL_MAX`, `DB_DEBUG`, …) | Renaming or removing a variable, changing its meaning, making an optional one required | Accept the old name as a fallback for one release, document it in the PR, update `.env.example` and the README |
| Stored secrets and tokens | Capture tokens, session cookies | Changing hashing, cookie name or flags so existing ones stop working | Support both formats until existing ones expire or are rotated; announce forced re-login |
| Import/export format | `transfer` concept | Changing the file format so older exports no longer import | Keep reading old formats; version the new one |
| Public share URLs | Public collection pages with random slugs | Changing the slug scheme so issued links die | Keep resolving existing slugs |
| Integration test harness | `packages/integration` scripts, CI job names in `.github/workflows/ci.yml` | Renaming a CI job that branch protection requires | Update branch protection in the same change |

## Rules

- Anything not listed here (component internals, private helpers, `app`-internal modules) may change freely.
- A change that violates a row without the required path is a **blocker** in review, unless a maintainer waives it on the PR.
- When a new surface appears (a new route family, event, export), add a row in the same PR.
