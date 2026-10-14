# 1. System users and their needs

Benchmark: raindrop.io for function and UX (capture fast, organise lightly, find instantly). Visual identity, copy and code here are original.

## Product in one paragraph

A personal place to keep links to recipes, movies, music and other interesting things found online. Saving takes one step. AI reads the page, decides what it is, and proposes a title, summary, tags and a collection. The owner confirms or ignores; nothing the AI does is irreversible.

## Actors

| # | Actor | Type | Who they are |
|---|---|---|---|
| U1 | **Collector** | Human, primary | Owner of the account. Saves, organises, searches, shares. |
| U2 | **Visitor** | Human, anonymous | Opens a public collection link shared by a Collector. Read-only. |
| U3 | **Operator** | Human, internal | Runs the service: users, failed jobs, AI cost and abuse. Uses the admin area. |
| U4 | **AI Enrichment Service** | System | Background worker: fetches the page, classifies, summarises, suggests tags and collection. |
| U5 | **Capture Client** | System | Browser extension, mobile share sheet, bookmarklet, API script. Sends URLs with a token. |
| U6 | **Downstream tool** | System | Receives webhooks or exports (Notion, Zapier, RSS reader). Phase 2. |

## Needs per actor

### U1 Collector

| Need | Why | Satisfied by |
|---|---|---|
| Save a link in under 5 seconds, from anywhere | Friction kills the habit | Quick-add, extension, share sheet |
| Do not have to sort at save time | Sorting is the chore that makes people stop | Inbox + AI suggestions |
| Trust AI but stay in control | Wrong tags are worse than none | Suggestions marked as AI, accept/reject, undo |
| Content-aware cards (cook time, director, artist) | A recipe is not an article | AI type + structured metadata |
| Find a thing from a vague memory | "that pasta with lemon" | Full-text + semantic search, filters |
| Group links their own way | Different mental models | Collections (nested), tags, favourites |
| Keep links alive | Links rot | Saved snapshot, broken-link check |
| Bring existing bookmarks in, take them out | No lock-in | Import (browser HTML, CSV), export |
| Share a list | Send a recipe list to a friend | Public collection link |
| Fix mistakes | Accidental delete | Trash with 30-day restore |

### U2 Visitor

- See the shared collection without an account, fast, on mobile.
- See what each link is (title, thumbnail, summary) and open it.
- Not see private data (notes, other collections, tags unless the owner allows).

### U3 Operator

- See user count, queue depth, failure rate of fetch/AI jobs.
- Retry or discard failed jobs; see why they failed.
- Suspend an abusive account or a public collection.
- Control AI spend (per-user daily quota).

### U4 AI Enrichment Service

- Receive a job with URL and user's existing collections/tags (so suggestions reuse them).
- Return a structured result with a confidence score per field.
- Fail visibly: a timeout or blocked site marks the bookmark `failed`, never loses the link.

### U5 Capture Client

- Authenticate with a scoped, revocable token.
- Save with minimal payload (`url`, optional `title`, `collection`).
- Get an immediate `201` and let enrichment finish later.

### U6 Downstream tool (phase 2)

- Subscribe to `bookmark.created`, `bookmark.enriched`.
- Pull a full export in JSON/CSV/HTML.

## Priorities (MVP cut)

| In MVP | Later |
|---|---|
| U1 all needs except semantic search, link-rot | Semantic search, link-rot check, saved snapshot |
| U2 public collection | Per-tag public pages |
| U3 job list + user list | Cost dashboards |
| U4 classify + summarise + tags + collection | Image/OCR, transcript for videos |
| U5 extension token + API | Mobile share sheet app |
| U6 – | Webhooks, Notion sync |
