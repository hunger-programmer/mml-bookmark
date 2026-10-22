# D19 — YouTube extraction order: written sources first, spoken content as fallback
- Date, owner: 2026-10-22, Paweł Wójcik (founder)
- Context and the options weighed: Agent listed six acquisition routes: (1) description, (2) comments, (3) linked recipe page — official API; (4) unofficial caption retrieval, (5) audio download + speech-to-text, (6) multimodal model taking a YouTube URL — unverified, 4 and 5 likely conflict with YouTube's terms. The agent recommended 1–3 first, falling back for spoken-only recipes.
- Decision and why: Founder accepted the recommendation: "always try 1–3 first, fall back to 4,5 or 6 for spoken-only recipes."
- Consequences, and what would make us revisit it: Which of 4–6 is used, and its terms-of-service position, remains open (Q06) for a technical spike.
- Status: active

## Update 2026-10-23 (founder)
- Spoken-content candidates narrowed: "yt-dlp + Whisper or transcript api". Choice between them, and the terms-of-service position, still open (Q06).
