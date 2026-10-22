> Superseded 2026-10-23: `.ai/specs/product-brief.md` is the product source of truth (D39). Kept as history.

# 4. Screen specifications

Each screen lists purpose, features, UI components, states (loading / empty / error / success), validation and related API endpoints. Flow IDs (UC*) point to doc 2.

## API conventions

- Base path `/api/v1`, JSON, session cookie for the app, `Authorization: Bearer <token>` for capture clients.
- Errors: `{ "error": { "code": "validation_failed", "message": "...", "fields": { "url": "Not a valid URL" } } }` with HTTP 400/401/403/404/409/422/429/5xx.
- Lists: cursor pagination `?cursor=&limit=40` → `{ items, nextCursor }`.
- Bookmark `status`: `pending | fetching | analysing | ready | failed | pending_quota`.
- Bookmark `type`: `recipe | movie | music | article | video | other`.

## Shared UI components

`Sidebar`, `TopBar`, `SearchBox`, `Button`, `IconButton`, `Chip` (type/tag), `TagInput`, `BookmarkCard` (grid), `BookmarkRow` (list), `Skeleton`, `EmptyState`, `ErrorBanner`, `Toast` (with Undo), `Modal`, `Drawer`, `ConfirmDialog`, `Switch`, `Select`, `ProgressBar`, `SelectionBar`, `AiBadge` ("AI suggestion" marker, always visible so AI output is distinguishable from user input).

## Global states (apply to every app screen unless overridden)

| State | Behaviour |
|---|---|
| Session expired (401) | Redirect to S1 with `?next=`; drafts in modals are kept in memory |
| Offline | Top banner "You're offline"; read-only cached list; writes disabled |
| Server error (5xx) | `ErrorBanner` in the content area with `Retry`; sidebar still usable |
| Forbidden (403) | S11 style page |

---

## S1 Sign in / Sign up

**Purpose:** authenticate. **Flow:** UC1.

- **Features:** email + password sign-in; sign-up; magic link; "forgot password"; switch between sign-in and sign-up.
- **Components:** brand header, `Tabs` (Sign in / Create account), `TextField`×2, `Button`, text link, `ErrorBanner`.
- **Loading:** button shows spinner and is disabled; fields locked.
- **Empty:** n/a.
- **Error:** wrong credentials ("Email or password is incorrect", no hint which); email in use; rate limit with retry time; network error.
- **Success:** redirect to S2 (new) or S3 (returning / `next`). Magic link: "Check your inbox" panel.
- **Validation:** email RFC-like format, required; password ≥ 10 chars on sign-up (required only on sign-in); validated on blur and submit; errors under the field, `aria-live`.
- **API:** `POST /auth/signup`, `POST /auth/login`, `POST /auth/magic-link`, `POST /auth/password-reset`, `POST /auth/logout`, `GET /me`.

## S2 Onboarding

**Purpose:** first-run guidance to get the first links in. **Flow:** UC1 → UC11/UC13.

- **Features:** three cards: "Paste your first link", "Import bookmarks", "Install the extension"; skip.
- **Components:** `Stepper`-less checklist, `Card`×3, `Button`, `Skip` link.
- **Loading:** none (static).
- **Empty:** is the screen.
- **Error:** none specific.
- **Success:** each completed item gets a ✓; when ≥ 1 link exists, "Go to library" is primary.
- **Validation:** inline URL field uses S4 rules.
- **API:** `POST /bookmarks`, links to S12/S13 endpoints, `PATCH /me/preferences {onboarded:true}`.

## S3 Library

**Purpose:** the home. Browse, filter, act on bookmarks. **Flows:** UC5, UC7, UC8, UC14.

- **Features:** collection/tag/type/favourite filtering; sort; grid/list/headline views; infinite scroll; hover quick actions (open, favourite, menu); bulk select; drag to collection; per-card status badge (`Enriching`, `Needs review`, `Couldn't read`).
- **Components:** `Sidebar`, `TopBar`, `FilterBar` (type chips, sort `Select`, view toggle), `BookmarkCard`/`BookmarkRow`, `SelectionBar`, `Toast`.
- **Loading:** 8 skeleton cards; sidebar counts show placeholder dashes. Newly saved card: shimmer until `ready`.
- **Empty:** *no bookmarks at all*: illustration-free text "Nothing saved yet" + `Add a link` + `Import`. *Filter without results*: "No bookmarks match" + `Clear filters`. *Empty collection*: "This collection is empty. Drag links here or add one."
- **Error:** list failure → `ErrorBanner` + `Retry`; single card with `failed` → inline message, `Retry` / `Edit`; quota banner when `pending_quota` items exist.
- **Success:** toasts: "Moved 3 to Recipes" (Undo), "Added to favourites".
- **Validation:** bulk actions need ≥ 1 selected (buttons disabled otherwise); delete bulk asks confirmation if > 10.
- **API:** `GET /bookmarks?collection=&tag=&type=&favorite=&sort=&cursor=`, `PATCH /bookmarks/:id`, `POST /bookmarks/bulk` (`{ids, action, payload}`), `DELETE /bookmarks/:id`, `GET /collections`, `GET /tags`, `GET /bookmarks/counts`.

## S4 Add bookmark (modal)

**Purpose:** save a link with the least friction. **Flow:** UC2.

- **Features:** URL field (autofocus, clipboard prefill); duplicate detection while typing; optional details (collection, tags, note); `Save` and `Save & add another`.
- **Components:** `Modal`, `TextField` (URL), `Select` (collection), `TagInput`, `Textarea`, `Button`, duplicate `Banner`.
- **Loading:** `Save` shows spinner for the create call only (typically < 300 ms); enrichment runs after the modal closes.
- **Empty:** initial state with hint "Paste a link. AI will fill in the rest."
- **Error:** invalid URL; duplicate (409); blocked scheme; server error keeps the modal open with the URL retained.
- **Success:** modal closes, toast "Saved. Enriching…", card appears at top.
- **Validation:** URL required; `http`/`https` only; max 2,048 chars; auto-prepend `https://` when missing; reject `localhost`/private IPs (SSRF guard, also server-side); note ≤ 2,000 chars; ≤ 20 tags, each ≤ 40 chars.
- **API:** `POST /bookmarks` → `201` or `409 {existingId}`; `GET /bookmarks/check?url=` for live duplicate check; `GET /collections`, `GET /tags?q=`.

## S5 Inbox (AI review)

**Purpose:** confirm AI suggestions in one pass. **Flow:** UC4.

- **Features:** list of bookmarks with `ready` suggestions; per-row accept / edit / dismiss; bulk accept; confidence indicator; "Not sure" flag below 0.6; retry for failed rows.
- **Components:** `BookmarkRow` (expanded), `AiBadge`, `ConfidenceMeter`, `Button`, `SelectionBar`, `Toast`.
- **Loading:** row skeletons; rows being enriched show `Enriching…` spinner.
- **Empty:** "Inbox zero. New saves land here until you review them."
- **Error:** list error banner; failed enrichment rows show reason + `Retry`.
- **Success:** accepted rows animate out; toast "Accepted 5 · Undo".
- **Validation:** `Accept` requires a collection; if none suggested the button reads `Choose collection`.
- **API:** `GET /bookmarks?status=ready&reviewed=false`, `POST /bookmarks/:id/suggestions/accept` (`{fields?}`), `POST /bookmarks/:id/suggestions/dismiss`, `POST /bookmarks/:id/enrich` (retry), `POST /bookmarks/bulk`.

## S6 Search results

**Purpose:** find by memory. **Flow:** UC6.

- **Features:** full-text over title, URL, summary, note, tags; filters (type, collection, tag, date range, has note, broken); highlighted matches; sort by relevance/date.
- **Components:** `SearchBox` (large), filter `Chip`s, `BookmarkRow` with highlights, result count.
- **Loading:** skeleton rows; typing shows debounced inline suggestions.
- **Empty:** "No results for “…”" + tips + (if URL-like) `Add this link`.
- **Error:** `ErrorBanner` + `Retry`; search never blocks the rest of the UI.
- **Success:** result count and timing ("12 results").
- **Validation:** query ≥ 2 chars (shorter shows hint, no request); max 200 chars.
- **API:** `GET /search?q=&type=&collection=&tag=&from=&to=&cursor=`, `GET /search/suggest?q=`.

## S7 Bookmark detail (drawer)

**Purpose:** see everything about a bookmark and edit it. **Flow:** UC7.

- **Features:** inline edit of title, summary, collection, tags, note; type-specific metadata block; `Open link`; `Re-run AI` with field picker; favourite; delete; status; created/opened dates; "AI wrote this" marks on AI-filled fields with `Revert to original`.
- **Components:** `Drawer`, thumbnail, `EditableText`, `Select`, `TagInput`, `MetaGrid`, `AiBadge`, `Button`, `ConfirmDialog`.
- **Loading:** skeleton blocks; fields editable once loaded.
- **Empty:** optional fields show muted placeholders ("Add a note").
- **Error:** autosave failure "Couldn't save · Retry" with local value kept; 404 → drawer closes + toast "This bookmark no longer exists".
- **Success:** "Saved" tick near the title for 2 s.
- **Validation:** title 1–300 chars; note ≤ 2,000; tags ≤ 20, ≤ 40 chars each, lowercase-normalised; summary ≤ 1,000.
- **API:** `GET /bookmarks/:id`, `PATCH /bookmarks/:id`, `POST /bookmarks/:id/enrich` (`{fields}`), `POST /bookmarks/:id/open` (records last-opened), `DELETE /bookmarks/:id`.

## S8 Collections

**Purpose:** manage the collection tree. **Flow:** UC8, UC9.

- **Features:** tree with counts; create, rename, nest by drag, change icon, delete with bookmark handling; share status badge; open → S3 filtered.
- **Components:** `Tree`, `IconPicker`, `Modal` (create/rename), `ConfirmDialog`, `Badge` (Shared).
- **Loading:** tree skeleton.
- **Empty:** "No collections yet. Create one or let AI suggest them from your Inbox."
- **Error:** name conflict inline; delete failure toast; depth > 3 rejected.
- **Success:** toast "Collection created"; new node highlighted.
- **Validation:** name 1–60 chars, unique among siblings (case-insensitive); max depth 3; cannot move into own descendant.
- **API:** `GET /collections`, `POST /collections`, `PATCH /collections/:id` (name, icon, parentId, position), `DELETE /collections/:id?bookmarks=move|delete`.

## S9 Share dialog

**Purpose:** publish a collection read-only. **Flow:** UC9.

- **Features:** public link toggle; copy link; show-notes and show-tags switches; regenerate link.
- **Components:** `Modal`, `Switch`×3, read-only `TextField`, `Button` (Copy), `Banner`.
- **Loading:** switch shows spinner while the request runs.
- **Empty:** off state: "Only you can see this collection."
- **Error:** toggle failure reverts the switch + toast.
- **Success:** "Link copied" toast; status badge in S8.
- **Validation:** cannot share an empty collection (switch disabled with tooltip); regenerate asks confirmation (old link dies).
- **API:** `PUT /collections/:id/share` (`{enabled, showNotes, showTags}`), `POST /collections/:id/share/regenerate`.

## S10 Public collection

**Purpose:** let anyone view a shared list. **Flow:** UC10.

- **Features:** header (title, owner display name, count, description); type filter chips; in-page search; open links in new tab; "Make your own" CTA.
- **Components:** page header, `Chip`s, `SearchBox`, `BookmarkCard` (read-only), footer.
- **Loading:** server-rendered; skeletons only on filter change.
- **Empty:** collection has no items: "Nothing here yet."
- **Error:** disabled/unknown slug → S11. Fetch error → retry banner.
- **Success:** n/a (read-only).
- **Validation:** slug format `[a-z0-9-]{8,}`; search ≤ 200 chars.
- **API:** `GET /public/collections/:slug`, `GET /public/collections/:slug/bookmarks?type=&q=&cursor=` (no auth; rate-limited, cacheable).

## S11 Not found / disabled link

**Purpose:** neutral dead end. **Flow:** UC10 ⚠.

- **Features:** message, link to home.
- **Components:** heading, text, `Button`.
- **States:** single static state; same copy for "never existed" and "disabled".
- **Validation:** –. **API:** none (HTTP 404).

## S12 Import / Export

**Purpose:** move bookmarks in and out. **Flows:** UC11, UC12.

- **Features:** drag-drop file; format detection; preview counts; options (folders→collections, run AI); progress; result summary; export by format and scope.
- **Components:** `Dropzone`, `Select`, `Switch`, `ProgressBar`, `Summary` card, `Button`.
- **Loading:** parsing spinner; import progress `412 / 812`; export "Preparing file…".
- **Empty:** dropzone idle state.
- **Error:** unsupported/malformed file; over 5,000 links; partial failure lists skipped rows with reason; export failure retry.
- **Success:** summary card with counts and `View imported`; export download starts.
- **Validation:** file ≤ 20 MB; extensions `.html .csv .json`; at least one scope chosen for export.
- **API:** `POST /imports` (multipart) → `{id}`, `GET /imports/:id` (progress/result), `POST /exports` (`{format, collectionId?}`) → `{id}`, `GET /exports/:id` (status/download URL).

## S13 Integrations

**Purpose:** connect capture clients. **Flow:** UC13.

- **Features:** list tokens (name, scope, created, last used); create; revoke; extension install links; bookmarklet.
- **Components:** `Table`, `Modal` (create), `CopyField`, `Badge`, `ConfirmDialog`.
- **Loading:** table skeleton.
- **Empty:** "No tokens yet. Create one to connect the browser extension."
- **Error:** limit reached (10); revoke failure toast.
- **Success:** token revealed once with warning "You won't see this again"; row appears.
- **Validation:** name 1–60 chars; scope required.
- **API:** `GET /tokens`, `POST /tokens` (`{name, scope}` → secret once), `DELETE /tokens/:id`.

## S14 Trash

**Purpose:** safety net. **Flow:** UC14.

- **Features:** list with days left; restore; delete forever; empty trash.
- **Components:** `BookmarkRow` (muted), `Button`s, `ConfirmDialog`, info banner (30-day rule).
- **Loading:** row skeletons. **Empty:** "Trash is empty."
- **Error:** restore failure toast. **Success:** "Restored to Recipes" (Undo).
- **Validation:** destructive actions require confirmation.
- **API:** `GET /bookmarks?trashed=true`, `POST /bookmarks/:id/restore`, `DELETE /bookmarks/:id?permanent=true`, `DELETE /trash`.

## S15 Settings

**Purpose:** profile and AI behaviour. **Flow:** UC15.

- **Features:** tabs *Profile* (name, email, password, delete account) and *AI* (auto-enrich, auto-accept threshold, allow new collections, summary language, daily quota meter).
- **Components:** `Tabs`, `TextField`, `Switch`, `Slider`, `Select`, `ProgressBar`, `Button`, danger zone.
- **Loading:** form skeleton. **Empty:** n/a.
- **Error:** save failure inline; password mismatch; quota meter at 100% shows warning.
- **Success:** "Settings saved" toast.
- **Validation:** display name 1–60; email format; new password ≥ 10 and ≠ current; threshold 0.5–1.0; account deletion requires typing the email.
- **API:** `GET /me`, `PATCH /me`, `PUT /me/password`, `GET /me/ai-settings`, `PUT /me/ai-settings`, `GET /me/usage`, `DELETE /me`.

## S16 Admin dashboard

**Purpose:** service health at a glance. **Flow:** UC16.

- **Features:** KPI tiles (users, bookmarks, queue depth, failure rate 24 h), recent failures.
- **Components:** `StatTile`×4, `Table`, `Badge`.
- **Loading:** tile skeletons. **Empty:** "No failures in the last 24 h."
- **Error:** tile-level error with retry. **Success:** n/a.
- **Validation:** –. **API:** `GET /admin/stats`, `GET /admin/jobs?status=failed&limit=5`.

## S17 Admin jobs

**Purpose:** inspect and fix enrichment jobs.

- **Features:** filter by status, search by URL; retry, discard; see error text and attempt count.
- **Components:** `Table`, status `Badge`, `Button`s, `Select`.
- **Loading:** table skeleton. **Empty:** "No jobs match."
- **Error:** retry failure toast. **Success:** "Job re-queued".
- **Validation:** discard asks confirmation. **API:** `GET /admin/jobs`, `POST /admin/jobs/:id/retry`, `DELETE /admin/jobs/:id`.

## S18 Admin users

**Purpose:** manage accounts and quotas.

- **Features:** search; see bookmarks count, last active, quota; suspend/unsuspend; set quota.
- **Components:** `Table`, `Modal` (suspend reason), `Input`, `Badge`.
- **Loading:** table skeleton. **Empty:** "No users match."
- **Error:** action failure toast. **Success:** "User suspended" toast and audit-log entry.
- **Validation:** suspend reason required (≥ 5 chars); quota integer 0–10,000.
- **API:** `GET /admin/users?q=`, `PATCH /admin/users/:id` (`{suspended, reason, dailyQuota}`), `GET /admin/audit?userId=`.

---

## Endpoint catalogue (summary)

| Area | Endpoints |
|---|---|
| Auth/profile | `POST /auth/signup` `login` `logout` `magic-link` `password-reset`; `GET/PATCH /me`; `PUT /me/password`; `GET/PUT /me/ai-settings`; `GET /me/usage`; `DELETE /me` |
| Bookmarks | `GET/POST /bookmarks`; `GET/PATCH/DELETE /bookmarks/:id`; `GET /bookmarks/check`; `GET /bookmarks/counts`; `POST /bookmarks/bulk`; `POST /bookmarks/:id/enrich` `open` `restore`; `POST /bookmarks/:id/suggestions/accept` `dismiss`; `DELETE /trash` |
| Collections | `GET/POST /collections`; `PATCH/DELETE /collections/:id`; `PUT /collections/:id/share`; `POST /collections/:id/share/regenerate` |
| Tags | `GET /tags?q=` |
| Search | `GET /search`; `GET /search/suggest` |
| Data | `POST /imports`; `GET /imports/:id`; `POST /exports`; `GET /exports/:id` |
| Tokens | `GET/POST /tokens`; `DELETE /tokens/:id` |
| Public | `GET /public/collections/:slug`; `GET /public/collections/:slug/bookmarks` |
| Admin | `GET /admin/stats` `jobs` `users` `audit`; `POST /admin/jobs/:id/retry`; `DELETE /admin/jobs/:id`; `PATCH /admin/users/:id` |

## Data shapes (reference)

```ts
type BookmarkType = "recipe" | "movie" | "music" | "article" | "video" | "other";
type BookmarkStatus = "pending" | "fetching" | "analysing" | "ready" | "failed" | "pending_quota";

interface Bookmark {
  id: string; url: string; title: string; summary?: string; thumbnailUrl?: string;
  type: BookmarkType; status: BookmarkStatus;
  collectionId: string | null; tags: string[]; note?: string; favorite: boolean;
  meta?: Record<string, string>;            // recipe: time, servings · movie: year, director · music: artist, album
  suggestion?: {                              // present until accepted/dismissed
    title?: string; type: BookmarkType; collectionId?: string; newCollectionName?: string;
    tags: string[]; confidence: number;       // 0..1
  };
  createdAt: string; lastOpenedAt?: string; deletedAt?: string;
}
```
