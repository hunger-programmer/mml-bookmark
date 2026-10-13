# Runs

Logs of autonomous AI runs. One file per run.

## Naming

`YYYY-MM-DD-slug.md` — date the run started, slug describes the task.
Example: `2026-10-13-add-bookmark-tagging.md`

If a slug already exists for that date, make the slug more specific (do not overwrite).

## Required content

```md
# <Run title>

- Date: YYYY-MM-DD
- Spec: <path to spec in .ai/specs/**, or "none">
- Status: in-progress | done | blocked | failed

## Goal
## Steps taken
## Decisions and assumptions
## Files changed
## Verification (commands run + result)
## Open issues / follow-ups
```

Create the file at the start of the run and update it as you go. Lessons worth keeping long-term also go to `.ai/lessons.md`.
