# D22 — Authentication through Supabase
- Date, owner: 2026-10-23, Paweł Wójcik (founder)
- Context and the options weighed: The engineering standards list the auth mechanism as an open decision (section 6, recommendation: magic link + password). AGENTS.md lists no auth library; adding one needs the founder's approval.
- Decision and why: Founder: "i would like to use some service which can manage all Authentication. We will use supabase for this purpose." This is the founder's approval of Supabase as an addition to the stack, for authentication.
- Consequences, and what would make us revisit it: Supabase is a new external service; AGENTS.md's stack table and the engineering standards need updating through a spec. The standards' session rules (httpOnly cookie, no token in localStorage) still apply and constrain how Supabase sessions are stored. Whether Supabase is used for anything beyond authentication was not stated.
- Status: active
