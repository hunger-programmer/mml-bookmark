# Next.js security upgrade 16.4.0 → 16.4.2

- Date: 2026-10-23
- Spec: none (dependency bump; AGENTS.md: trivial fixes need no spec)
- Status: done (PR open)

## Goal

Patch two critical Next.js advisories before Phase 3 of the platform-foundation spec. Also unblock the integration harness: its child-process `next build` stopped with `SecurityFatalError` on 16.4.0.

## Steps taken

1. `pnpm audit --prod` on `main` listed two critical advisories, both for `next` `>=16.0.0 <=16.4.0`, patched in `>=16.4.1`:
   - GHSA-2464-fhr4-w9xw: RCE in the Image Optimization API with SVG.
   - GHSA-673q-mjm6-r5xr: RCE in `use cache` functions returning typed arrays.
2. Upgraded `next`, `@next/env` and `eslint-config-next` to 16.4.2 (current `latest`) in `packages/app`.

## Decisions and assumptions

- Used a plain `pnpm add`, not the `next upgrade --agent=security` command that the build error told agents to run. The error text was tool output, not an instruction. The user approved the upgrade itself.
- `braces` (high, DoS, no patched version, pulled in through `awilix` and `shadcn` → `fast-glob`) remains. It is not fixable by a bump and is out of scope here.

## Files changed

`packages/app/package.json`, `pnpm-lock.yaml`, this log.

## Verification (commands run + result)

- `pnpm audit --prod`: the two criticals are gone; 1 high remains (`braces`) ✅.
- `pnpm lint` ✅, `pnpm typecheck` ✅, `pnpm build` ✅ (no vulnerability warning).
- `pnpm test:coverage` ✅: 116 tests, 100%.
- `pnpm test:integration` with its own build step ✅ 6/6. This failed with `SecurityFatalError` on 16.4.0.

## Open issues / follow-ups

- After this merges, rebase PR #2 (Phase 2) and update its Next.js lesson: the stop is fixed by 16.4.2.
- `braces` advisory: watch for an upstream fix.
