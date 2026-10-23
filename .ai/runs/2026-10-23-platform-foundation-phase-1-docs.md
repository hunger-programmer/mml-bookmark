# Platform foundation, Phase 1: docs and standards

- Date: 2026-10-23
- Spec: `.ai/specs/2026-10-23-platform-foundation.md` (Phase 1)
- Status: done

## Goal

Make `AGENTS.md` and `.ai/docs/engineering-standards.md` describe the product in the brief (D39, D46–D61) and the approved foundation spec. Decision-level text only. Commands and rules for tooling that does not exist yet are added by the phase that adds the tooling (Phase 2: Supabase CLI; Phase 3: RLS and migration-connection rules; Phase 6: deploy).

## Steps taken

1. Approved the spec, updated the brief's D53 row, pushed to `main` (a831f58, docs-only direct push per D59).
2. Branch `docs/platform-foundation-phase-1`.
3. `AGENTS.md`: product line, stack table (Supabase, Zod, Resend, OpenAI, hosting; unbuilt rows marked *(planned)*), `extension` package row and `extension → core` rule, concept list, worker/job-table sentence, `(app)` styling group, English-only UI, product source of truth → brief.
4. `engineering-standards.md` rewritten: concept table, naming examples, Supabase auth and CSRF rules, admin/audit rules, model-output rules (R01, R05, R12, R21), daily limit (R19), hard delete (D37), worker (D48), target package structure, historical migration plan, formerly-open decisions closed.
5. `README.md` product description and concept list; `.ai/lessons.md` 2026-10-23 entry rewritten.

## Decisions and assumptions

- No spec needed beyond the foundation spec; this run implements its Phase 1.
- The mockup docs already carry the superseded banner (added with the brief), so spec step 1.3's banner is already done.
- Testcontainers, docker compose and the Commands table are left as they are; Phase 2 changes them together with the tooling.
- The README was not in the spec's Phase 1 list but described the old product (tags, collections, import); updated because AGENTS.md says the README tracks the package layout and it would otherwise contradict the brief.
- "AI output is a proposal" became "model output is data, never a command": R04/R14 let the model set the category and write recipe cards directly, so the old suggestion-only rule no longer matches the product.

## Files changed

- `AGENTS.md`, `.ai/docs/engineering-standards.md`, `README.md`, `.ai/lessons.md`, this log.

## Verification (commands run + result)

- `rg -n "argon2|magic link|bcrypt|after\(\)|collections\`, \`tags" AGENTS.md .ai/docs/engineering-standards.md` → 2 matches, both on lines marked removed (N12) or in "Decisions formerly open". Pass.
- Docs-only change; no code, so lint/typecheck/build/tests are unaffected (CI runs them on the PR).

## Open issues / follow-ups

- Phase 2: Supabase CLI stack, integration harness, CI; update the AGENTS.md integration row, Database and Commands sections.
