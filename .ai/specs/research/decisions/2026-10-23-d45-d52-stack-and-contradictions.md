# D45–D52 — Stack and standards (brief Q12) and contradictory instructions (brief Q08)

- Date, owner: 2026-10-23, Paweł Wójcik (founder)
- Context: second grilling round on the product brief (session questions Q33–Q46). Each question carried an agent recommendation; "recommended" means the founder accepted it. The founder confirmed the full summary ("yes") before the brief was updated.
- Status of every decision below: active.

## D45 — One spec for the whole MVP (Q33)
- Options: a platform-foundation spec plus later feature specs (recommended) / one spec for the whole MVP / one spec per stack item. Chosen: one spec for the whole MVP (founder's choice). The agent's concern on record: a single spec this size is hard to review.

## D46 — Authentication architecture (Q34, Q35)
- Web: sign-in, OAuth callbacks and sign-out go through the Next.js server, which sets httpOnly session cookies; the browser never calls Supabase directly. Keeps the engineering standard (httpOnly cookie, no token in localStorage). Recommended. Agent's note: from memory, `@supabase/ssr` defaults use JavaScript-readable cookies; the spec must verify.
- Chrome extension and iOS app: sign in with Supabase and send the Supabase access token as a Bearer header; the server verifies it; Bearer requests are exempt from CSRF. One `/api/v1` for all clients. The `SessionReader` port gets a cookie and a Bearer implementation; `requireToken` and capture tokens are removed. Recommended.

## D47 — Users table and suspension (Q36, Q37)
- Own `users` table in the public schema keyed by the Supabase user id, holding `isAdmin`, `suspended` and the daily counter; the Supabase `auth` schema is never written. Recommended.
- Suspension sets a Supabase ban (blocks sign-in) and our `suspended` flag (rejects API calls, stops processing); lifting it reverses both. Recommended.

## D48 — All processing in the worker (Q38)
- Categorisation, extraction, captions, Whisper and translation run in the worker container. Next.js only writes the job row. The worker polls the job table and owns retries, the daily quota and next-day scheduling. Replaces the standards' "DB table + `after()`". Recommended.

## D49 — Monorepo packages and validation (Q39, Q40)
- `packages/extension` (Chrome) and `packages/mobile` (Expo), depending only on `core`, calling the API over HTTP; added to the AGENTS.md package rules. Recommended.
- Zod as the validation library (open decision #2 in the standards). Recommended.

## D50 — Supabase local stack for dev and integration tests (Q41)
- Recommended. Rejected: a test-only session reader behind an environment variable (a backdoor risk).

## D51 — Admin audit table; terms page later; impersonation without disclosure (Q42, Q43, Q46)
- Audit table: who, whose account, action, when; visible in the admin area; kept indefinitely; not deletable by admins. Recommended.
- Terms and privacy page: later (founder's choice over writing it in the MVP).
- Impersonation needs no disclosure (founder's choice over disabling impersonation until the terms exist, the recommendation). R13 is superseded by R20. Accepted risk on record: with open sign-up in the EU, viewing users' saved content without telling them likely conflicts with GDPR transparency duties.

## D52 — Contradictory and viewer-sourced instructions (Q44, Q45)
- When creator sources disagree, a fixed priority decides silently: the creator's latest correction (pinned or creator comment), then the description, then the transcript (founder chose silent resolution over a visible note, the recommendation). Replaces the earlier brief's proposal to resolve conflicts visibly.
- Only creator content is used; viewer comments are ignored, including when they hold the only recipe (founder's choice over labelled viewer recipes, the recommendation). R06 is superseded by R21. Consequence: if the comment in the founder's 7-rewatch video was written by a viewer, that video's card comes only from the transcript.
