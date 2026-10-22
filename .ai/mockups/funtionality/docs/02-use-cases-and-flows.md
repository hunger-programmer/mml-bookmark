> Superseded 2026-10-23: `.ai/specs/product-brief.md` is the product source of truth (D39). Kept as history.

# 2. Main use cases and complete user flows

IDs are referenced from the screen specs (doc 4) and the mockup (`data-flow` hints in the dev bar).

## Use case list

| ID | Use case | Actor | Priority |
|---|---|---|---|
| UC1 | Sign up / sign in | U1 | MVP |
| UC2 | Save a link (quick-add) | U1 | MVP |
| UC3 | Save a link from the browser extension | U1, U5 | MVP |
| UC4 | Review AI suggestions (Inbox) | U1, U4 | MVP |
| UC5 | Browse and filter the library | U1 | MVP |
| UC6 | Search | U1 | MVP |
| UC7 | View and edit a bookmark | U1 | MVP |
| UC8 | Organise: collections, tags, move, bulk actions | U1 | MVP |
| UC9 | Share a collection publicly | U1, U2 | MVP |
| UC10 | View a shared collection | U2 | MVP |
| UC11 | Import bookmarks | U1 | MVP |
| UC12 | Export bookmarks | U1 | MVP |
| UC13 | Connect a tool (token, extension) | U1, U5 | MVP |
| UC14 | Delete and restore | U1 | MVP |
| UC15 | Configure AI behaviour | U1 | MVP |
| UC16 | Operate: monitor jobs, users | U3 | MVP |

## Flow notation

`[Screen]` = screen id from doc 3. `→` = user action. `⚠` = alternative / error path.

## UC1 Sign up / sign in

1. [S1 Auth] → enter email + password (or magic link) → submit.
2. System creates session; new user lands on [S2 Onboarding], returning user on [S3 Library].
3. ⚠ Wrong credentials: inline error, field kept, focus on password.
4. ⚠ Email already registered (sign-up): offer "Sign in instead".
5. ⚠ Rate-limited after 5 failures: message with retry time.

## UC2 Save a link (quick-add) — the core flow

1. From any screen, user presses `+ Add` or `N` → [S4 Add bookmark] opens as a modal.
2. User pastes a URL (clipboard is pre-filled if it holds a URL).
3. System validates the URL format immediately; checks for a duplicate.
4. User presses `Save` (or Enter). **Bookmark is created at once** with status `pending` and the modal closes with a toast "Saved. Enriching…". The user is not made to wait.
5. Library shows the new card with a skeleton shimmer; AI worker fetches the page and fills title, thumbnail, type, summary.
6. When done, the card updates in place; a "Review" dot appears if suggestions need approval ([UC4]).
7. ⚠ Invalid URL: inline error, Save disabled.
8. ⚠ Duplicate: banner "Already saved on 3 Oct in *Recipes*" with `Open existing` / `Save anyway`.
9. ⚠ Fetch fails (404, blocked, timeout): card shows `Couldn't read this page` with `Retry` and `Edit manually`; the link is kept.
10. Optional in step 2: user expands "Details" to pick collection, tags, note before saving (skips AI for chosen fields).

## UC3 Save from the browser extension

1. User clicks the extension on a page → popup shows title, URL, collection picker (last used preselected).
2. → `Save`. Extension calls `POST /bookmarks` with token.
3. Popup shows ✓ "Saved to Inbox" and closes after 1.5 s.
4. ⚠ Token missing/revoked: popup shows "Reconnect" linking to [S10 Integrations].
5. ⚠ Offline: extension queues the item locally and retries.

## UC4 Review AI suggestions (Inbox)

1. [S3 Library] sidebar shows `Inbox (n)`; user opens [S5 Inbox].
2. Each row shows: page preview, AI-proposed type, title, tags, collection, confidence.
3. User actions per row: `Accept all`, `Edit`, `Dismiss suggestions` (keeps the link, unsorted).
4. Bulk: select rows → `Accept selected`.
5. Accepted bookmarks leave the Inbox and appear in their collection.
6. ⚠ Low confidence (< 0.6): row is flagged "Not sure" and has no pre-selected collection.
7. ⚠ AI failed: row shows failure reason and `Retry`.
8. Undo: a toast after accept offers `Undo` for 10 s.

## UC5 Browse and filter the library

1. [S3 Library] opens on "All bookmarks", newest first.
2. User picks a collection / tag / type chip in the sidebar or filter bar.
3. User toggles view: grid (cards), list, headlines.
4. User sorts: newest, oldest, title, recently opened.
5. Infinite scroll loads 40 more.
6. ⚠ Empty filter result: "No bookmarks match" + `Clear filters`.

## UC6 Search

1. User focuses search (`/`), types ≥ 2 chars.
2. Live suggestions show top 5 bookmarks and matching tags/collections (debounced 200 ms).
3. Enter → [S6 Search results] with filters (type, collection, tag, date, has note, broken).
4. Match terms are highlighted in title/summary/note.
5. User can `Save search` as a smart collection (phase 2, shown as disabled "Soon" in mockup).
6. ⚠ No results: suggestion "Try fewer words", plus `Add this as a link` if the query looks like a URL.

## UC7 View and edit a bookmark

1. User clicks a card → [S7 Bookmark detail] opens as a right-hand drawer (list stays visible).
2. Shows: thumbnail, title, URL, AI summary, type metadata (recipe time; movie year; track artist), tags, collection, note, dates, status.
3. User edits any field inline; changes autosave (debounced) with "Saved" indicator.
4. `Open link` opens the original in a new tab and updates "last opened".
5. `Re-run AI` re-enriches; user chooses which fields to overwrite.
6. `Favourite`, `Move`, `Delete` in the header.
7. ⚠ Save conflict / network failure: inline "Couldn't save · Retry", local edits kept.

## UC8 Organise

1. **Create collection:** sidebar `+` → name, optional parent, icon → Create. Appears in the tree.
2. **Move:** drag a card onto a collection, or `Move to…` in the card menu.
3. **Tag:** add in the detail drawer; tag input autocompletes existing tags.
4. **Bulk:** hover card checkbox → selection bar appears with `Move`, `Tag`, `Favourite`, `Delete`.
5. **Rename / delete collection:** [S8 Collections]. Delete asks what to do with its bookmarks: move to *Unsorted* (default) or delete them.
6. ⚠ Duplicate collection name at the same level: inline error.

## UC9 Share a collection

1. [S8 Collections] or collection header → `Share`.
2. [S9 Share dialog]: toggle "Public link" on → URL generated.
3. Options: show notes (off), show tags (on). `Copy link`.
4. Toggle off → link stops working at once.
5. ⚠ Collection contains bookmarks with private notes: warning that notes stay hidden unless enabled.

## UC10 View a shared collection (Visitor)

1. Visitor opens `/s/{slug}` → [S10 Public collection].
2. Sees title, owner display name, count, cards. Can filter by type, search within.
3. Click a card → opens the original link in a new tab.
4. ⚠ Link disabled/unknown: [S11 Not found] page, no hint whether it ever existed.

## UC11 Import

1. [S12 Import/Export] → `Import` → choose source: browser bookmarks HTML, CSV, Pocket/Raindrop export.
2. Drop or select file → client-side preview: n links, m folders, k duplicates.
3. Choose: keep folders as collections (default) / flatten; run AI on imported links (default on, shows quota estimate).
4. → `Import` → progress bar (processed / total).
5. Success: summary "812 imported · 14 skipped (duplicates) · 3 invalid" with `Review skipped`.
6. ⚠ Wrong file type / malformed: error with accepted formats listed.
7. ⚠ Over limit (5,000 links per import): explains and offers splitting.

## UC12 Export

1. [S12] → `Export` → format (HTML / CSV / JSON) and scope (all / one collection).
2. → `Export` → file prepared; download starts; for > 5k items an email link is sent.

## UC13 Connect a tool

1. [S13 Integrations] → `Create token` → name, scope (`save` / `read+save`).
2. Token shown **once** with copy button.
3. User pastes it into the extension; extension shows "Connected".
4. `Revoke` kills the token at once; clients get `401`.
5. ⚠ Max 10 tokens: error naming the limit.

## UC14 Delete and restore

1. Delete from card/drawer/bulk → bookmarks move to [S14 Trash], toast with `Undo`.
2. In Trash: `Restore` (back to original collection, or Unsorted if it no longer exists), `Delete forever`, `Empty trash`.
3. Items auto-purge after 30 days (stated on the screen).
4. ⚠ `Delete forever` and `Empty trash` ask for confirmation.

## UC15 Configure AI

1. [S15 Settings → AI]: toggles — auto-enrich on save; auto-accept when confidence ≥ threshold; allowed to create new collections; language for summaries.
2. Daily enrichment count versus quota is shown.
3. ⚠ Quota exhausted: new saves stay `pending-quota` and are enriched next day; banner on Library.

## UC16 Operate

1. [S16 Admin dashboard] → counts, queue depth, failure rate.
2. [S17 Admin jobs] → filter failed → `Retry` / `Discard`; row shows error.
3. [S18 Admin users] → search → `Suspend` / `Set quota`.
4. ⚠ Suspend asks for a reason, which is stored in the audit log.

## State machine: bookmark enrichment

```
created ──► pending ──► fetching ──► analysing ──► ready (suggestions) ──► accepted
                │            │             │
                │            └─ failed ◄───┘            ready ──► dismissed
                └─ pending-quota (retried next day)
```

`failed` is recoverable by `Retry` or manual edit. A bookmark never disappears because enrichment failed.
