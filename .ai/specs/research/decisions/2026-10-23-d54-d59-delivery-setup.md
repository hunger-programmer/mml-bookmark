# D54–D59 — Delivery setup

- Date, owner: 2026-10-23, Paweł Wójcik (founder)
- Context: questions before the platform-foundation spec. Status of every decision below: active.

## D54 — No iOS app in the MVP; no Apple sign-in
- Fact supplied by the founder: no Apple Developer Program membership, and none planned ("i do not have and do not plan! Skip it for now").
- Consequence: without the membership there is no TestFlight, no App Group for a share extension, and no Sign in with Apple. The iOS app (Expo), its share extension and Apple sign-in are deferred. The founder also answered "test flight" for iOS distribution; TestFlight needs the membership, so that answer cannot apply.
- Supersedes D04 (capture now: Chrome extension and manual URL), D33 (sign-in now: email + password and Google; extensions sign in through Supabase; capture tokens removed) and D34 (web library fully usable on a phone stays; Expo app deferred). `packages/mobile` (D49) is not created. Onboarding (D43) links only the Chrome extension.
- Revisit: when an Apple Developer membership exists.

## D55 — Production domain: hunger-programmers.com
- Founder: "I do have hunger-programmers.com domain, we can use it." Used for the production web app and API origin, and the OAuth redirect URLs. Exact host (apex or subdomain) is set in the foundation spec.

## D56 — Worker host: Fly.io
- Accepted agent recommendation (plain Docker image with yt-dlp, scales to zero). Narrows D41.

## D57 — Chrome extension loaded unpacked in the MVP
- Founder's choice over an unlisted Chrome Web Store listing (the recommendation). Users install it manually in developer mode.

## D58 — Environments: production and local only
- Accepted agent recommendation. No staging.

## D59 — Code changes go through PRs; direct pushes to main sometimes allowed
- Founder: "PRs, but sometimes direct pushes". PRs are the default so CI (lint, typecheck, build, coverage gate, integration tests) runs; direct pushes to main remain possible for small changes at the founder's discretion.

## D60 — Save from the iPhone through an iOS Shortcut with personal tokens
- Context: with no iOS app (D54), the phone could only save by pasting a link into the web app. Agent proposed an iOS Shortcut in the share sheet that posts the link to the API; it cannot do a Supabase sign-in, so it needs a long-lived personal token. Options: add Shortcut + personal tokens (recommended) / pasting into the web is enough.
- Decision: founder chose the Shortcut with personal tokens (recommended).
- Consequence: capture tokens are kept rather than removed (partly supersedes D46 and N08). The engineering standards' token rules apply: 32+ random bytes, shown once, stored hashed, scoped, revocable, `last_used` tracked, at most 10 per user. Users create and revoke tokens in the web library.

## D61 — Production host: mml-bookmarks.hunger-programmers.com
- Founder chose a subdomain (recommended) named mml-bookmarks. Narrows D55.
