# Specs

Specifications for spec-driven development (SDD). The spec is the source of truth for a change; code follows it.

## Naming

`YYYY-MM-DD-slug.md` — date the spec was created, lowercase kebab-case slug.
Example: `2026-10-13-bookmark-tagging.md`

## Lifecycle

| Location | Meaning |
|---|---|
| `specs/` | Active: approved or in progress |
| `specs/archive/` | Implemented (set status to `implemented`), or abandoned / superseded (add a one-line reason at the top). History, never deleted |

Moving a spec = `git mv`, keep the filename unchanged.

## Suggested structure

```md
# <Title>

- Status: draft | approved | in-progress | implemented
- Date: YYYY-MM-DD

## Goal
## Non-goals
## Requirements
## Decisions
What was chosen, why, and which alternatives were rejected.
## Acceptance criteria
## Decision log
One line per change after approval: date, what changed, why, who approved.
## Notes / open questions
```

The spec is written **before** the implementation, and updated first whenever a requirement or decision changes. See `AGENTS.md` "Specification-driven development".
