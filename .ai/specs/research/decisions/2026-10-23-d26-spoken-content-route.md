# D26 — Spoken content: transcript API first, yt-dlp + Whisper as fallback
- Date, owner: 2026-10-23, Paweł Wójcik (founder)
- Context and the options weighed: Q06 narrowed to yt-dlp + Whisper or a transcript API. Agent recommended both in order: existing captions through a transcript API (cheap, fast, only when captions exist), then yt-dlp + Whisper (works on any video with speech, downloads audio, clearer conflict with YouTube's terms). Both routes are unofficial and were not verified in the session.
- Decision and why: Accepted agent recommendation. Founder: "Fetch YouTube's existing captions through a transcript API first, fall back to yt-dlp + Whisper when it doesn't".
- Consequences, and what would make us revisit it: Applies after D19's written sources (description, comments, linked page). The terms-of-service exposure is accepted by building; which transcript API, and whether the routes work, is for the implementation spec to verify. Revisit if a route stops working or the terms position becomes unacceptable.
- Status: active
