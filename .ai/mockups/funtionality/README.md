# Bookmark portal — initial concept ("Stash" is a placeholder name)

Benchmark: raindrop.io for function and UX only. Visual identity, copy and code are original.

## Contents

| File | What |
|---|---|
| `docs/01-users-and-needs.md` | Actors and their needs |
| `docs/02-use-cases-and-flows.md` | 16 use cases with step-by-step flows and error paths |
| `docs/03-screen-and-navigation-map.md` | 18 screens, navigation diagram, layout, open questions |
| `docs/04-screen-specifications.md` | Per screen: purpose, features, components, loading/empty/error/success, validation, API; endpoint catalogue |
| `mockups/index.html` | Open this. Clickable mockup, no server or install needed |
| `mockups/app.ts` | Mockup source (TypeScript). `app.js` is its compiled output |
| `mockups/styles.css` | Mockup styling |

## Run the mockup

Open `mockups/index.html` in a browser. Data lives in memory and resets on reload.

The bar at the bottom shows the current screen id and use cases, lets you jump to any screen, and forces the **loading / empty / error** state of the current screen.

## Key paths to click

1. **Sign in** (any email + password) → Library.
2. **Save a link:** `+ Add` or press `N` → paste `kitchen.example/new-cake-recipe` → Save. The card shimmers, then lands in the Inbox as "Needs review".
3. **Validation:** in Add, try `ftp://x.y`, `localhost`, or `kitchen.example/lemon-pasta` (duplicate banner).
4. **Inbox:** accept, edit, dismiss; low-confidence row says "Not sure"; failed row has Retry.
5. **Detail drawer:** click a card; edit title/tags/note (autosave); empty the title to see the error.
6. **Organise:** select cards → Move/Favourite/Delete (with Undo); drag a card onto a collection in the sidebar; view toggle grid/list/headlines.
7. **Search:** type in the top bar for suggestions, Enter for results; try “xyz” for the empty state.
8. **Collections:** create (duplicate name error), rename, delete, **Share** → public page preview.
9. **Import / Export:** sample file → preview → progress → summary; wrong file shows the error.
10. **Integrations:** create a token (shown once), revoke.
11. **Trash:** restore, delete forever, empty trash.
12. **Settings:** AI toggles and threshold; delete-account confirmation.
13. **Admin:** dashboard, jobs (retry/discard), users (suspend needs a reason).

## Rebuild `app.js` after editing `app.ts`

```sh
npx -y -p typescript@6.0 tsc --target ES2020 --lib ES2020,DOM --strict mockups/app.ts
```

## Not covered (by design)

Responsive polish below tablet width is basic. Phase-2 items (semantic search, saved searches, link-rot check, webhooks) are marked "soon" or listed only in the docs.
