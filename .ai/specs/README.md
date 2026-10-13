# Specs

Specifications for spec-driven development (SDD). The spec is the source of truth for a change; code follows it.

## Naming

`YYYY-MM-DD-slug.md` — date the spec was created, lowercase kebab-case slug.
Example: `2026-10-13-bookmark-tagging.md`

## Lifecycle

| Location | Meaning |
|---|---|
| `specs/` | Active: approved or in progress |
| `specs/implemented/` | Done and shipped. Move here when the work is merged |
| `specs/archive/` | Abandoned, superseded, or obsolete. Add a one-line reason at the top |

Moving a spec = `git mv`, keep the filename unchanged.

## Suggested structure

```md
# <Title>

## Goal
## Non-goals
## Requirements
## Acceptance criteria
## Notes / open questions
```
