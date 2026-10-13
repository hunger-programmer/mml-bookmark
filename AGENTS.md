<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Project: mml-bookmark

A link/bookmark storage app built on Next.js.

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
