# CI pipeline and testing strategy

- Status: implemented (archived; first green run on GitHub still to be confirmed)
- Date: 2026-10-14

> Written alongside the implementation, not before it: the request and the work arrived in the same session, and the SDD rule that makes the spec come first was added to `AGENTS.md` afterwards. From the next change on, the spec precedes the code.

## Goal

Every pull request is checked automatically for build, lint, types, unit tests with full coverage, and integration tests against a real database and browser.

## Non-goals

- Deployment, release or preview environments.
- Visual regression testing.
- Testing product features that do not exist yet (bookmarks, collections, auth).
- A test database for unit tests (unit tests mock the edges).

## Requirements

1. GitHub Actions workflow on every `pull_request` (and manual dispatch) with separate jobs: **lint**, **typecheck**, **build**, **unit tests**, **integration tests**.
2. Build job succeeds with no database reachable (no `DATABASE_URL`).
3. Unit test framework for TypeScript; **100% statements, branches, functions and lines** of existing code, enforced by thresholds so CI fails below 100%.
4. Integration framework: PostgreSQL started ephemerally with Testcontainers, the app instantiated against it, tested through **agent-browser**.
5. Integration tests cover the basics: home page and admin panel.
6. `AGENTS.md` states that every new feature must be 100% covered by unit tests, and describes the CI and the integration setup.

## Decisions

| Decision | Why | Rejected |
|---|---|---|
| **Vitest 5** + `@vitest/coverage-v8`, one root config (`vitest.config.mts`), tests colocated as `*.test.ts(x)` | Native TypeScript/ESM, fast, same runner for unit and integration, built-in coverage thresholds. Standards doc already recommended it. | Jest (ESM/TS friction), node:test (no coverage thresholds per file, no module mocking ergonomics) |
| Coverage gate = thresholds at 100 in config; no coverage excludes except `packages/integration/**` | A gate that can be silently widened is not a gate. Untestable code gets refactored (admin `DatabaseStatus` split from the page). | `/* v8 ignore */` comments, excluding pages |
| React components tested with `renderToStaticMarkup` in Node; async server component awaited directly | No jsdom or testing-library dependency; the components are presentational | jsdom + Testing Library (more deps, no behavior to test yet) |
| Integration tests in a new package **`packages/integration`** (`@mml-bookmark/integration`) | `packages/` is the only place for code (AGENTS.md); it depends on no internal package, it only talks HTTP to the built app | A top-level `tests/` folder (breaks the rule), inside `packages/app` (mixes slow and fast tests, drags Docker into app lint/typecheck) |
| Harness: Vitest `globalSetup` builds the app, starts `postgres:17-alpine` via Testcontainers, runs `pnpm db:migration:up`, starts `next start` on a free port | One environment per run; exercises the real migration command; matches production build behavior | `next dev` (not production-like), docker-compose in CI (shared state, fixed ports) |
| Browser driven through the **agent-browser** CLI wrapped in `src/browser.ts` (one session per test file); assertions on title, accessibility snapshot and text | Requested tool; the snapshot asserts roles and names, which is what a user perceives | Playwright (not requested) |
| `pnpm-workspace.yaml` `allowBuilds` made explicit | pnpm 12 fails `pnpm install` with `ERR_PNPM_IGNORED_BUILDS` on unreviewed build scripts, which would break CI | Leaving it implicit |
| Lint job and typecheck job are separate | A type error and a lint error should be visible independently | One combined job |
| Node 24 in CI | Matches the version used locally; `engines` is `>=22.17` | Node 22 (supported, but untested here) |

## Acceptance criteria

- [x] `.github/workflows/ci.yml` defines the five jobs and triggers on pull requests.
- [x] `pnpm test:coverage` reports 100% in all four metrics and fails if any drops.
- [x] `pnpm test:integration` starts a PostgreSQL container, builds and starts the app, and passes tests for `/` and `/admin` (admin shows "Database: connected").
- [x] `pnpm typecheck && pnpm lint && pnpm build` pass.
- [x] `AGENTS.md` documents the coverage rule, the CI jobs, the integration package and the commands.
- [ ] The workflow has run green on GitHub (first run happens when the pull request is opened).

## Decision log

- 2026-10-14 — Created. Vitest and the `integration` package were chosen by the agent within the request ("unit tests framework for TypeScript", "integration testing framework"); the user asked for Testcontainers and agent-browser explicitly.

## Notes / open questions

- The first CI run on GitHub may need adjustments (Chrome system dependencies on the runner, Docker pull time). The workflow installs browser dependencies with `agent-browser install --with-deps` and caches `~/.agent-browser`.
- Integration tests assume Docker is available. They are not part of `pnpm test`.
- Branch protection (making the five jobs required) is a repository setting and must be configured by an admin.
