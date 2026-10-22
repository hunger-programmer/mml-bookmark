# D27–D44 — Grilling session on the product brief

- Date, owner: 2026-10-23, Paweł Wójcik (founder)
- Context: a question-by-question review of `.ai/specs/product-brief.md` (Q1–Q32 of the session). Each question came with the agent's recommendation; the founder answered by letter. "Recommended" below means the founder accepted the agent's recommendation; otherwise the founder chose a different option or added to it. The founder confirmed the full summary ("yes") before the brief was updated.
- Status of every decision below: active.

## D27 — At most one category; uncategorised items get their own group (Q2, Q29)
- Options: no category / force the closest / add a catch-all. Chosen: no category, recommended. Browsing shows an "Uncategorised" group next to the three categories, recommended.
- Supersedes D16 and R09 ("exactly one category").

## D28 — Extraction runs only on items categorised `recipe` (Q3, Q18)
- Options: extract on every link and mark `recipe` when a card results (recommended) / extract only on `recipe` / independent. Chosen: only on `recipe` (founder's choice, not the recommendation).
- Moving an item to `recipe` starts extraction; moving it away hides its recipe cards and keeps them stored (recommended).
- Consequence: a recipe the model miscategorises gets no card until the user moves it.

## D29 — Users can edit recipe cards; edits are never overwritten (Q4, Q19)
- Options: category and title only (recommended) / also recipe cards / no edits. Chosen: also recipe cards (founder's choice).
- Reprocessing only touches cards the user has not edited (recommended).

## D30 — Saving a duplicate opens the existing item (Q5)
- Recommended.

## D31 — One bookmark can hold several recipe cards (Q6, Q20)
- Options: main recipe only (recommended) / all as separate cards / none. Chosen: all as separate cards (founder's choice).
- Browse and search list bookmarks; the bookmark detail shows all its recipe cards; an ingredient search matches any of them (recommended).

## D32 — Text search over titles, ingredients and notes (Q7, Q26)
- Recommended.

## D33 — Sign-in: email + password, Google and Apple; extensions sign in through Supabase (Q8, Q23)
- Options: email + password (recommended) / Google / magic link. Chosen: email + password, Google and Sign in with Apple (founder's choice; Apple's App Store rules require Apple sign-in when the iOS app offers Google).
- The Chrome extension and the iOS app sign in with Supabase directly; the iOS share extension shares the app's session through an App Group. The capture tokens already in `packages/core/src/http/auth.ts` are dropped (recommended).

## D34 — iOS app built with Expo, capture only; web library fully usable on a phone (Q9, Q10, Q21)
- Expo / React Native in TypeScript with a native share-extension target (recommended).
- Options for the iOS app: full library (recommended) / capture only. Chosen: capture only (founder's choice).
- The web library must be fully usable on a phone screen (recommended).

## D35 — Failures retry automatically, then show "Try again" (Q11)
- Recommended.

## D36 — Evidence stored and transcript shown; images linked, not copied (Q12, Q22, Q30)
- Options: store and hide (recommended) / store and show transcript / do not store. Chosen: store and show the transcript (founder's choice).
- Evidence (description, comments used, transcript, page text) is deleted with the item. The transcript is shown collapsed under the recipe cards, in the original language (recommended).
- Recipe images link to the source image or YouTube thumbnail, with a placeholder if it disappears (recommended).

## D37 — Delete items and whole accounts; export deferred (Q13, Q14)
- Recommended.

## D38 — OpenAI as the model provider (Q15)
- Options: Anthropic (recommended) / OpenAI / decide in spec. Chosen: OpenAI (founder's choice). Whisper runs through OpenAI's API (Q24).

## D39 — The product brief replaces the concept in `.ai/mockups/` as the source of truth (Q16)
- Recommended. The concept documents stay in place, marked superseded. AGENTS.md and `.ai/docs/engineering-standards.md` are updated through a spec. Concept features not in the brief are out unless pulled in (see D42–D44).

## D40 — Daily processing limit: 5 saves per user, midnight UTC, overflow processed the next day, admins exempt (Q1, Q17, Q31)
- Options: per-user daily limit (recommended) / invite-only / unlimited. Chosen: per-user daily limit, founder set 5.
- Saves beyond the limit are stored as links and processed the next day; admin accounts are exempt; the day resets at midnight UTC (recommended).
- D17 (no cost limit per video) still holds for each processed item.

## D41 — Hosting: Vercel, Supabase Postgres, a worker container for yt-dlp (Q24)
- Recommended. Web app on Vercel; Postgres on Supabase, still through MikroORM; a separate worker container (e.g. Fly.io or Railway) runs yt-dlp; Whisper through OpenAI's API.

## D42 — Admin area with read-only, audited impersonation (Q25, Q28, Q32)
- Founder pulled the admin area back from the concept: user list, suspend user, failed jobs, and impersonation from the user list to see a user's saved links (founder's addition).
- Admins are set by a database flag. Suspension blocks sign-in and stops processing and keeps the data. Admins can retry a failed job (recommended).
- Impersonation is read-only, every impersonation is audit-logged (who, whose account, when), and the sign-up terms disclose that admins can view saved content for support and abuse handling (recommended).
- Supersedes R11 with R13 (private links with an explicit admin exception).

## D43 — One onboarding screen after sign-up (Q25, Q27)
- Founder pulled onboarding back from the concept. Content: install links for the Chrome extension and the iOS app, how to save (share, click, paste), and the 5-per-day limit (recommended).

## D44 — Notes on bookmarks (Q25, Q26)
- Founder pulled notes back from the concept. Plain text per bookmark, private, included in search (recommended).
