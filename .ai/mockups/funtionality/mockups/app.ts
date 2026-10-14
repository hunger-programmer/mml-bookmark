/* Stash mockup — plain TypeScript, no framework, no network. All data is in memory and resets on reload.
   Compile: tsc --target ES2020 --lib ES2020,DOM --strict app.ts   (emits app.js; see ../README.md) */

type BType = "recipe" | "movie" | "music" | "article" | "video" | "other";
type BStatus = "pending" | "ready" | "failed" | "pending_quota";
type Forced = "normal" | "loading" | "empty" | "error";

interface Suggestion { type: BType; title: string; collectionId: string | null; tags: string[]; confidence: number; }
interface Bookmark {
  id: string; url: string; title: string; summary: string; type: BType; status: BStatus;
  collectionId: string | null; tags: string[]; note: string; favorite: boolean;
  meta: Record<string, string>; suggestion: Suggestion | null; added: string; trashedAt: number | null; reviewed: boolean;
}
interface Collection { id: string; name: string; icon: string; parentId: string | null; share: { notes: boolean; tags: boolean } | null; }
interface Token { id: string; name: string; scope: string; created: string; lastUsed: string; }
interface Job { id: string; url: string; user: string; status: "failed" | "running" | "queued"; error: string; attempts: number; }
interface AdminUser { id: string; email: string; bookmarks: number; quota: number; active: string; suspended: boolean; }

const ICON: Record<BType, string> = { recipe: "🍋", movie: "🎬", music: "♪", article: "§", video: "▶", other: "◆" };
const TYPES: BType[] = ["recipe", "movie", "music", "article", "video", "other"];
const SCREEN_INFO: Record<string, string> = {
  login: "S1 Sign in · UC1", welcome: "S2 Onboarding · UC1", library: "S3 Library · UC5 UC7 UC8", inbox: "S5 Inbox · UC4",
  search: "S6 Search · UC6", collections: "S8 Collections · UC8 UC9", data: "S12 Import/Export · UC11 UC12",
  integrations: "S13 Integrations · UC13", trash: "S14 Trash · UC14", settings: "S15 Settings · UC15",
  public: "S10 Public collection · UC10", notfound: "S11 Not found", admin: "S16 Admin dashboard · UC16",
  "admin/jobs": "S17 Admin jobs · UC16", "admin/users": "S18 Admin users · UC16",
};

function seed() {
  const collections: Collection[] = [
    { id: "c-rec", name: "Recipes", icon: "🍋", parentId: null, share: { notes: false, tags: true } },
    { id: "c-dinner", name: "Weeknight dinners", icon: "🍝", parentId: "c-rec", share: null },
    { id: "c-mov", name: "Movies to watch", icon: "🎬", parentId: null, share: null },
    { id: "c-mus", name: "Music", icon: "♪", parentId: null, share: null },
    { id: "c-read", name: "Read later", icon: "§", parentId: null, share: null },
  ];
  const mk = (p: Partial<Bookmark> & { id: string; url: string; title: string; type: BType }): Bookmark => ({
    summary: "", status: "ready", collectionId: null, tags: [], note: "", favorite: false, meta: {}, suggestion: null,
    added: "3 Oct", trashedAt: null, reviewed: true, ...p });
  const bookmarks: Bookmark[] = [
    mk({ id: "b1", url: "https://kitchen.example/lemon-pasta", title: "Lemon & ricotta pasta", type: "recipe", collectionId: "c-dinner", tags: ["pasta", "vegetarian", "quick"], favorite: true,
      summary: "Creamy no-cream pasta with lemon zest and ricotta. Ready in 20 minutes with six ingredients.", meta: { "Total time": "20 min", Servings: "2", Difficulty: "Easy" } }),
    mk({ id: "b2", url: "https://kitchen.example/shakshuka", title: "Shakshuka with feta", type: "recipe", collectionId: "c-rec", tags: ["eggs", "brunch"], added: "29 Sep",
      summary: "Eggs poached in spiced tomato and pepper sauce, finished with feta and parsley.", meta: { "Total time": "35 min", Servings: "4", Difficulty: "Easy" } }),
    mk({ id: "b3", url: "https://films.example/title/perfect-days", title: "Perfect Days (2023)", type: "movie", collectionId: "c-mov", tags: ["drama", "tokyo"], added: "1 Oct",
      summary: "A Tokyo toilet cleaner finds quiet meaning in a repeating routine of music, trees and photographs.", meta: { Year: "2023", Director: "Wim Wenders", Runtime: "124 min" } }),
    mk({ id: "b4", url: "https://films.example/title/past-lives", title: "Past Lives", type: "movie", collectionId: "c-mov", tags: ["drama", "romance"], favorite: true, added: "22 Sep",
      summary: "Two childhood friends reconnect across two decades and two continents.", meta: { Year: "2023", Director: "Celine Song", Runtime: "105 min" } }),
    mk({ id: "b5", url: "https://music.example/album/promises", title: "Promises — Floating Points & Pharoah Sanders", type: "music", collectionId: "c-mus", tags: ["ambient", "jazz"], added: "18 Sep",
      summary: "A single 46-minute composition for strings, harpsichord and saxophone.", meta: { Artist: "Floating Points", Album: "Promises", Year: "2021" } }),
    mk({ id: "b6", url: "https://essays.example/the-art-of-noticing", title: "The art of noticing", type: "article", collectionId: "c-read", tags: ["attention", "essay"], note: "Send to Marta.", added: "15 Sep",
      summary: "An essay on how deliberate attention changes what you remember from a day." }),
    mk({ id: "b7", url: "https://video.example/watch/sourdough-basics", title: "Sourdough basics in 12 minutes", type: "video", collectionId: null, tags: ["bread"], added: "12 Sep",
      summary: "Starter, folding and shaping, shown at the counter." }),
    // Inbox: ready with suggestions
    mk({ id: "b8", url: "https://kitchen.example/miso-aubergine", title: "miso-aubergine", type: "other", reviewed: false, added: "Today",
      summary: "Aubergine halves glazed with miso and mirin, roasted until collapsing. Serves 2 as a main.",
      suggestion: { type: "recipe", title: "Miso-glazed aubergine", collectionId: "c-dinner", tags: ["aubergine", "japanese", "vegan"], confidence: 0.93 } }),
    mk({ id: "b9", url: "https://films.example/title/anatomy-of-a-fall", title: "anatomy-of-a-fall", type: "other", reviewed: false, added: "Today",
      summary: "A woman is suspected of her husband's death; their blind son becomes the key witness.",
      suggestion: { type: "movie", title: "Anatomy of a Fall (2023)", collectionId: "c-mov", tags: ["thriller", "courtroom"], confidence: 0.88 } }),
    mk({ id: "b10", url: "https://blog.example/2024/misc-notes", title: "misc-notes", type: "other", reviewed: false, added: "Yesterday",
      summary: "A collection of loosely related notes about workshop layout and tool storage.",
      suggestion: { type: "article", title: "Misc notes on workshop layout", collectionId: null, tags: ["workshop"], confidence: 0.42 } }),
    mk({ id: "b11", url: "https://private.example/forbidden", title: "private.example", type: "other", status: "failed", reviewed: false, added: "Yesterday", summary: "" }),
  ];
  const tokens: Token[] = [{ id: "t1", name: "Laptop extension", scope: "save", created: "2 Oct", lastUsed: "Today" }];
  const jobs: Job[] = [
    { id: "j1", url: "https://private.example/forbidden", user: "ola@example.com", status: "failed", error: "403 Forbidden from origin", attempts: 3 },
    { id: "j2", url: "https://slow.example/huge-page", user: "pawel@example.com", status: "failed", error: "Timeout after 15 s", attempts: 2 },
    { id: "j3", url: "https://films.example/title/dune-2", user: "ola@example.com", status: "running", error: "", attempts: 1 },
    { id: "j4", url: "https://music.example/album/blue", user: "kuba@example.com", status: "queued", error: "", attempts: 0 },
  ];
  const users: AdminUser[] = [
    { id: "u1", email: "pawel@example.com", bookmarks: 412, quota: 200, active: "Today", suspended: false },
    { id: "u2", email: "ola@example.com", bookmarks: 1290, quota: 200, active: "Yesterday", suspended: false },
    { id: "u3", email: "kuba@example.com", bookmarks: 37, quota: 50, active: "9 Oct", suspended: false },
  ];
  return { collections, bookmarks, tokens, jobs, users };
}

const S = {
  ...seed(),
  forced: "normal" as Forced, sel: new Set<string>(), drawer: null as string | null, drawerState: "" as "" | "saving" | "saved" | "error",
  view: "grid" as "grid" | "list" | "headlines", sort: "newest", tab: "profile", authMode: "signin" as "signin" | "signup" | "sent",
  authErr: "", importStage: "idle" as "idle" | "preview" | "running" | "done" | "error", importPct: 0, importErr: "",
  aiAuto: true, aiAccept: false, aiNewCols: true, aiThreshold: 0.85, quotaUsed: 143, seq: 100, pubType: "all", adminQ: "", lastTrashed: [] as string[],
};

/* ---------- helpers ---------- */
const $ = <T extends HTMLElement = HTMLElement>(sel: string) => document.querySelector<T>(sel);
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
const host = (u: string) => { try { return new URL(u).host; } catch { return u; } };
const colOf = (id: string | null) => S.collections.find((c) => c.id === id);
const bm = (id: string) => S.bookmarks.find((b) => b.id === id);
const live = () => S.bookmarks.filter((b) => !b.trashedAt);
const inboxItems = () => live().filter((b) => !b.reviewed && (b.suggestion || b.status === "failed" || b.status === "pending"));
const depth = (c: Collection): number => (c.parentId ? 1 + depth(colOf(c.parentId) as Collection) : 0);
const uid = () => "x" + ++S.seq;
const hl = (text: string, q: string) => (q ? esc(text).replace(new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "ig"), "<mark>$1</mark>") : esc(text));

function toast(msg: string, undo?: () => void) {
  const el = document.createElement("div");
  el.className = "toast";
  el.innerHTML = `<span>${esc(msg)}</span>${undo ? `<button>Undo</button>` : ""}`;
  el.querySelector("button")?.addEventListener("click", () => { undo?.(); el.remove(); render(); });
  $("#toasts")!.appendChild(el);
  setTimeout(() => el.remove(), undo ? 8000 : 3200);
}

function route(): { name: string; arg: string; arg2: string } {
  const [name = "login", arg = "", arg2 = ""] = (location.hash.replace(/^#\/?/, "") || "login").split("/");
  if (name === "admin" && arg) return { name: `admin/${arg}`, arg: "", arg2: "" };
  return { name, arg, arg2 };
}

/* ---------- fake AI ---------- */
function guess(url: string): Suggestion {
  const u = url.toLowerCase();
  const rules: [RegExp, BType][] = [[/recipe|cook|pasta|kitchen|bake|food/, "recipe"], [/film|movie|imdb|trailer|cinema/, "movie"],
    [/music|album|spotify|bandcamp|song/, "music"], [/youtube|vimeo|video|watch/, "video"]];
  const hit = rules.find(([re]) => re.test(u));
  const type: BType = hit ? hit[1] : "article";
  const slug = (new URL(url).pathname.split("/").filter(Boolean).pop() || host(url)).replace(/[-_]+/g, " ");
  const col = { recipe: "c-rec", movie: "c-mov", music: "c-mus", article: "c-read", video: null, other: null }[type];
  return { type, title: slug.charAt(0).toUpperCase() + slug.slice(1), collectionId: hit ? col : null, tags: [type, slug.split(" ")[0]], confidence: hit ? 0.9 : 0.45 };
}

function normalizeUrl(raw: string): string { const t = raw.trim(); return /^[a-z]+:\/\//i.test(t) ? t : t ? "https://" + t : t; }
function validateUrl(raw: string): string {
  if (!raw.trim()) return "Paste a link to save.";
  const v = normalizeUrl(raw);
  if (v.length > 2048) return "That link is too long (max 2,048 characters).";
  try {
    const u = new URL(v);
    if (!/^https?:$/.test(u.protocol)) return "Only http and https links can be saved.";
    if (/^(localhost|127\.|10\.|192\.168\.)/.test(u.hostname)) return "Private and local addresses can't be saved.";
    if (!u.hostname.includes(".")) return "That doesn't look like a valid link.";
  } catch { return "That doesn't look like a valid link."; }
  return "";
}

function enrichLater(id: string) {
  setTimeout(() => {
    const b = bm(id); if (!b || b.status !== "pending") return;
    if (/fail|forbidden/.test(b.url)) { b.status = "failed"; }
    else {
      const g = guess(b.url);
      b.status = "ready"; b.title = g.title; b.suggestion = g;
      b.summary = "Summary written by AI from the page text. Edit it any time; your edits are never overwritten without asking.";
      S.quotaUsed++; if (S.aiAccept && g.confidence >= S.aiThreshold) acceptSuggestion(b);
    }
    render(); toast(b.status === "ready" ? "Enriched — review in Inbox" : "Couldn't read that page");
  }, 2400);
}
function acceptSuggestion(b: Bookmark) {
  const s = b.suggestion; if (!s) return;
  b.type = s.type; b.title = s.title; b.collectionId = s.collectionId; b.tags = Array.from(new Set([...b.tags, ...s.tags])); b.suggestion = null; b.reviewed = true;
  if (b.type === "recipe") b.meta = { "Total time": "30 min", Servings: "2", Difficulty: "Easy" };
  if (b.type === "movie") b.meta = { Year: "2023", Director: "Unknown", Runtime: "—" };
}

/* ---------- shared UI ---------- */
function thumb(b: { type: BType }) { return `<div class="thumb ${b.type}">${ICON[b.type]}</div>`; }
function skeletonGrid(n = 8) { return `<div class="grid">${Array.from({ length: n }, () => `<div class="skel skelcard"></div>`).join("")}</div>`; }
function skeletonRows(n = 5) { return Array.from({ length: n }, () => `<div class="skel" style="height:62px;margin-bottom:8px"></div>`).join(""); }
function errBanner(msg = "Couldn't load this. Check your connection and try again.") {
  return `<div class="banner err" role="alert"><span class="grow">${esc(msg)}</span><button class="btn small" data-act="retry">Retry</button></div>`;
}
function emptyBox(title: string, text: string, actions = "") { return `<div class="empty"><h3>${esc(title)}</h3><div class="muted">${esc(text)}</div>${actions}</div>`; }
function statusBadge(b: Bookmark) {
  if (b.status === "pending") return `<span class="badge ai"><span class="spinner"></span> Enriching</span>`;
  if (b.status === "failed") return `<span class="badge bad">Couldn't read</span>`;
  if (b.status === "pending_quota") return `<span class="badge warn">Waiting for quota</span>`;
  if (b.suggestion && !b.reviewed) return `<span class="badge ai"><span class="dot"></span> Needs review</span>`;
  return "";
}

function card(b: Bookmark, q = ""): string {
  const sel = S.sel.has(b.id);
  const tags = b.tags.slice(0, 3).map((t) => `<a class="chip tag" href="#/library/t/${esc(t)}">${esc(t)}</a>`).join("");
  const body = b.status === "pending"
    ? `<div class="skel" style="height:14px;width:80%"></div><div class="skel" style="height:12px"></div><div class="skel" style="height:12px;width:60%"></div>`
    : `<div class="title" data-act="open" data-id="${b.id}">${hl(b.title, q)}</div><div class="host">${esc(host(b.url))}</div>${b.summary ? `<div class="sum">${hl(b.summary, q)}</div>` : ""}`;
  const common = `<div class="acts"><button class="iconbtn ${b.favorite ? "on" : ""}" title="Favourite" data-act="fav" data-id="${b.id}">${b.favorite ? "★" : "☆"}</button>
    <button class="iconbtn" title="Delete" data-act="trash" data-id="${b.id}">🗑</button></div>
    <input class="pick" type="checkbox" aria-label="Select" ${sel ? "checked" : ""} data-act="pick" data-id="${b.id}">`;
  if (S.view === "list") return `<div class="rowitem ${sel ? "sel" : ""}" draggable="true" data-drag="${b.id}">${thumb(b)}<div><div class="title" style="font:600 15px var(--serif);cursor:pointer" data-act="open" data-id="${b.id}">${hl(b.title, q)}</div>
    <div class="host muted small">${esc(host(b.url))} · ${esc(b.added)}</div><div class="row" style="margin-top:4px">${statusBadge(b)}${tags}</div></div>
    <div class="row"><input type="checkbox" aria-label="Select" ${sel ? "checked" : ""} data-act="pick" data-id="${b.id}"><button class="iconbtn ${b.favorite ? "on" : ""}" data-act="fav" data-id="${b.id}">${b.favorite ? "★" : "☆"}</button><button class="iconbtn" data-act="trash" data-id="${b.id}">🗑</button></div></div>`;
  if (S.view === "headlines") return `<div class="headline" draggable="true" data-drag="${b.id}"><span class="tdot" style="background:var(--t-${b.type})"></span><a href="javascript:void 0" data-act="open" data-id="${b.id}" class="grow">${hl(b.title, q)}</a><span class="muted small">${esc(host(b.url))}</span>${statusBadge(b)}<span class="muted small">${esc(b.added)}</span></div>`;
  return `<article class="card ${sel ? "sel" : ""}" draggable="true" data-drag="${b.id}">${thumb(b)}${common}<div class="body"><div class="row small"><span class="tdot" style="background:var(--t-${b.type})"></span><span class="muted">${b.type}</span><span class="grow"></span>${statusBadge(b)}</div>${body}<div class="row" style="flex-wrap:wrap">${tags}</div></div></article>`;
}
function bookmarkList(items: Bookmark[], q = ""): string {
  if (S.view === "grid") return `<div class="grid">${items.map((b) => card(b, q)).join("")}</div>`;
  return `<div>${items.map((b) => card(b, q)).join("")}</div>`;
}

/* ---------- layout ---------- */
function topbar(q = ""): string {
  return `<div class="topbar"><div class="search"><input type="search" id="q" placeholder="Search bookmarks  ( / )" value="${esc(q)}" autocomplete="off" data-input="suggest"><div class="suggest hidden" id="suggest"></div></div>
    <span class="grow"></span><button class="btn primary" data-act="add">+ Add <span class="small" style="opacity:.7">N</span></button>
    <a class="btn ghost" href="#/settings" title="Account">☺ Paweł</a></div>`;
}
function treeNav(parent: string | null, active: string): string {
  return S.collections.filter((c) => c.parentId === parent).map((c) => {
    const n = live().filter((b) => b.collectionId === c.id).length;
    return `<a href="#/library/c/${c.id}" data-drop="${c.id}" class="${active === c.id ? "active" : ""}" style="padding-left:${10 + depth(c) * 14}px">${c.icon} ${esc(c.name)}${c.share ? ` <span class="badge">shared</span>` : ""}<span class="n">${n}</span></a>${treeNav(c.id, active)}`;
  }).join("");
}
function sidebar(): string {
  const r = route(); const on = (name: string, arg = "") => (r.name === name && r.arg === arg ? "active" : "");
  const all = live(); const tags = Array.from(new Set(all.flatMap((b) => b.tags))).slice(0, 8);
  const activeCol = r.name === "library" && r.arg === "c" ? r.arg2 : "";
  return `<aside class="side nav"><div class="brand"><i></i>Stash</div>
    <a href="#/library" class="${on("library") && !r.arg ? "active" : ""}">▤ All bookmarks<span class="n">${all.length}</span></a>
    <a href="#/inbox" class="${on("inbox")}">✦ Inbox${inboxItems().length ? `<span class="n"><span class="dot"></span> ${inboxItems().length}</span>` : ""}</a>
    <a href="#/library/fav" class="${on("library", "fav")}">★ Favourites<span class="n">${all.filter((b) => b.favorite).length}</span></a>
    <h4>Collections <button class="iconbtn" title="New collection" data-act="newcol">+</button></h4>
    <a href="#/library/c/none" data-drop="none" class="${activeCol === "none" ? "active" : ""}">▫ Unsorted<span class="n">${all.filter((b) => !b.collectionId).length}</span></a>
    ${treeNav(null, activeCol)}
    <a href="#/collections">⚙ Manage collections</a>
    <h4>Types</h4>${TYPES.slice(0, 5).map((t) => `<a href="#/library/type/${t}" class="${on("library", "type") && r.arg2 === t ? "active" : ""}"><span class="tdot" style="background:var(--t-${t})"></span>${t}<span class="n">${all.filter((b) => b.type === t).length}</span></a>`).join("")}
    <h4>Tags</h4>${tags.map((t) => `<a href="#/library/t/${esc(t)}" class="${r.arg === "t" && r.arg2 === t ? "active" : ""}"># ${esc(t)}</a>`).join("")}
    <h4>Account</h4>
    <a href="#/data" class="${on("data")}">⇅ Import / Export</a><a href="#/integrations" class="${on("integrations")}">⚡ Integrations</a>
    <a href="#/trash" class="${on("trash")}">🗑 Trash<span class="n">${S.bookmarks.filter((b) => b.trashedAt).length}</span></a><a href="#/settings" class="${on("settings")}">⚙ Settings</a></aside>`;
}
function appShell(content: string, q = ""): string {
  const d = S.drawer ? bm(S.drawer) : null;
  return `<div class="shell ${d ? "with-drawer" : ""}">${sidebar()}<main class="main">${topbar(q)}${content}</main>${d ? drawerHtml(d) : ""}</div>`;
}

/* forced state renderer for list-like screens */
function withForced(normal: () => string, opts: { skeleton?: string; empty: string }): string {
  if (S.forced === "loading") return opts.skeleton ?? skeletonGrid();
  if (S.forced === "error") return errBanner();
  if (S.forced === "empty") return opts.empty;
  return normal();
}

/* ---------- views ---------- */
function viewLogin(): string {
  const up = S.authMode === "signup";
  if (S.authMode === "sent") return `<div class="authwrap"><div class="authcard"><h2>Check your inbox</h2><p class="muted">We sent a sign-in link to your email. It expires in 15 minutes.</p><button class="btn" data-act="authmode" data-mode="signin">Back</button></div></div>`;
  return `<div class="authwrap"><form class="authcard" data-form="auth" novalidate><div class="brand" style="padding-left:0"><i></i>Stash</div>
    <h2>${up ? "Create your account" : "Welcome back"}</h2><p class="muted">${up ? "Save links. Let AI do the sorting." : "Sign in to your library."}</p>
    ${S.authErr ? `<div class="banner err" role="alert">${esc(S.authErr)}</div>` : ""}
    <div class="field"><label for="em">Email</label><input id="em" type="email" autocomplete="email" placeholder="you@example.com"><div class="err" data-err="em"></div></div>
    <div class="field"><label for="pw">Password</label><input id="pw" type="password" autocomplete="${up ? "new-password" : "current-password"}"><div class="err" data-err="pw"></div>${up ? `<div class="hint">At least 10 characters.</div>` : ""}</div>
    <button class="btn primary" style="width:100%;justify-content:center" type="submit">${up ? "Create account" : "Sign in"}</button>
    <div class="row" style="margin-top:12px;justify-content:space-between"><a href="javascript:void 0" data-act="authmode" data-mode="${up ? "signin" : "signup"}">${up ? "Have an account? Sign in" : "New here? Create account"}</a>
    <a href="javascript:void 0" data-act="authmode" data-mode="sent">Email me a link</a></div>
    <p class="hint" style="margin-top:14px">Try: any email + password; use <code>wrong@example.com</code> to see the error; <code>taken@example.com</code> on sign-up.</p></form></div>`;
}
function viewWelcome(): string {
  const has = live().length > 0;
  return `<div class="authwrap"><div class="authcard" style="width:min(640px,100%)"><h2>Let's fill your library</h2><p class="muted">Pick any — you can do the rest later.</p>
    <div class="col">
    <div class="rowitem" style="grid-template-columns:1fr auto"><div><b>1 · Paste your first link</b><div class="muted small">AI will name it, summarise it and file it.</div></div><button class="btn primary" data-act="add">Add a link</button></div>
    <div class="rowitem" style="grid-template-columns:1fr auto"><div><b>2 · Import your browser bookmarks</b><div class="muted small">HTML, CSV or JSON export.</div></div><a class="btn" href="#/data">Import</a></div>
    <div class="rowitem" style="grid-template-columns:1fr auto"><div><b>3 · Install the browser extension</b><div class="muted small">Save a page in one click.</div></div><a class="btn" href="#/integrations">Connect</a></div></div>
    <div class="row" style="margin-top:16px;justify-content:space-between"><a href="#/library">Skip for now</a><a class="btn primary ${has ? "" : "hidden"}" href="#/library">Go to library →</a></div></div></div>`;
}

function viewLibrary(): string {
  const r = route(); let items = live(); let title = "All bookmarks";
  if (r.arg === "c") { const c = colOf(r.arg2); title = r.arg2 === "none" ? "Unsorted" : c ? c.name : "Collection"; items = items.filter((b) => (r.arg2 === "none" ? !b.collectionId : b.collectionId === r.arg2)); }
  if (r.arg === "t") { title = "#" + r.arg2; items = items.filter((b) => b.tags.includes(r.arg2)); }
  if (r.arg === "fav") { title = "Favourites"; items = items.filter((b) => b.favorite); }
  if (r.arg === "type") { title = r.arg2; items = items.filter((b) => b.type === r.arg2); }
  items = [...items].sort((a, b) => (S.sort === "title" ? a.title.localeCompare(b.title) : S.sort === "oldest" ? a.id.localeCompare(b.id, undefined, { numeric: true }) : b.id.localeCompare(a.id, undefined, { numeric: true })));
  const quota = live().some((b) => b.status === "pending_quota") ? `<div class="banner warn">Daily AI quota used. New links are saved and will be enriched tomorrow.</div>` : "";
  const filterEmpty = items.length === 0 && live().length > 0 && !!r.arg;
  const emptyAll = emptyBox("Nothing saved yet", "Paste a link and AI will name, summarise and file it.", `<button class="btn primary" data-act="add">Add a link</button><a class="btn" href="#/data">Import</a>`);
  const emptyFilter = emptyBox("No bookmarks match", r.arg === "c" ? "This collection is empty. Drag links here or add one." : "Nothing matches this filter.", `<a class="btn" href="#/library">Clear filters</a>`);
  const sel = S.sel.size ? `<div class="selbar"><b>${S.sel.size} selected</b><span class="grow"></span><button class="btn" data-act="bulk" data-op="move">Move to…</button><button class="btn" data-act="bulk" data-op="fav">Favourite</button><button class="btn" data-act="bulk" data-op="trash">Delete</button><button class="btn ghost" data-act="bulk" data-op="clear">✕</button></div>` : "";
  const body = withForced(() => (items.length ? bookmarkList(items) : filterEmpty || live().length ? emptyFilter : emptyAll), { empty: emptyAll });
  return appShell(`${quota}<div class="pagehead"><h1>${esc(title)}</h1><span class="muted">${S.forced === "empty" ? 0 : items.length} items</span><span class="grow"></span>
    ${r.arg === "c" && r.arg2 !== "none" ? `<button class="btn" data-act="share" data-id="${r.arg2}">Share</button>` : ""}
    <select data-change="sort" style="width:auto"><option value="newest" ${S.sort === "newest" ? "selected" : ""}>Newest</option><option value="oldest" ${S.sort === "oldest" ? "selected" : ""}>Oldest</option><option value="title" ${S.sort === "title" ? "selected" : ""}>Title</option></select>
    <div class="seg">${(["grid", "list", "headlines"] as const).map((v) => `<button class="${S.view === v ? "on" : ""}" data-act="view" data-v="${v}">${v}</button>`).join("")}</div></div>
    <div class="filters">${TYPES.map((t) => `<a class="chip" href="#/library/type/${t}"><span class="tdot" style="background:var(--t-${t})"></span>${t}</a>`).join("")}</div>${body}${sel}`);
}

function viewInbox(): string {
  const items = inboxItems();
  const empty = emptyBox("Inbox zero", "New saves land here until you review them.", `<a class="btn primary" href="#/library">Back to library</a>`);
  const row = (b: Bookmark) => {
    const s = b.suggestion; const sel = S.sel.has(b.id);
    if (b.status === "pending") return `<div class="rowitem" style="grid-template-columns:1fr"><div class="row"><span class="spinner"></span> Enriching <b>${esc(host(b.url))}</b>…</div></div>`;
    if (b.status === "failed") return `<div class="rowitem" style="grid-template-columns:56px 1fr auto">${thumb(b)}<div><b>${esc(host(b.url))}</b><div class="banner err" style="margin:6px 0 0">Couldn't read this page (403). The link is saved.</div></div><div class="col"><button class="btn small" data-act="retryone" data-id="${b.id}">Retry</button><button class="btn small" data-act="open" data-id="${b.id}">Edit manually</button></div></div>`;
    const low = (s?.confidence ?? 0) < 0.6; const col = colOf(s?.collectionId ?? null);
    return `<div class="rowitem ${sel ? "sel" : ""}" style="grid-template-columns:24px 56px 1fr auto"><input type="checkbox" ${sel ? "checked" : ""} data-act="pick" data-id="${b.id}" aria-label="Select">${thumb(s as Suggestion)}
      <div><div class="row small"><span class="badge ai">AI suggestion</span> ${low ? `<span class="badge warn">Not sure</span>` : ""}<span class="confbar" title="confidence"><i style="width:${Math.round((s?.confidence ?? 0) * 100)}%"></i></span><span class="muted">${Math.round((s?.confidence ?? 0) * 100)}%</span></div>
      <div style="font:600 15px var(--serif);margin:3px 0">${esc(s?.title ?? b.title)}</div><div class="muted small">${esc(host(b.url))} · was “${esc(b.title)}”</div>
      <div class="row" style="margin-top:6px;flex-wrap:wrap"><span class="chip"><span class="tdot" style="background:var(--t-${s?.type})"></span>${s?.type}</span><span class="chip">${col ? col.icon + " " + esc(col.name) : "No collection"}</span>${(s?.tags ?? []).map((t) => `<span class="chip tag">${esc(t)}</span>`).join("")}</div></div>
      <div class="col"><button class="btn primary small" data-act="accept" data-id="${b.id}">${col ? "Accept all" : "Choose collection"}</button><button class="btn small" data-act="open" data-id="${b.id}">Edit</button><button class="btn ghost small" data-act="dismiss" data-id="${b.id}">Dismiss</button></div></div>`;
  };
  const sel = [...S.sel].filter((id) => items.some((b) => b.id === id)).length;
  return appShell(`<div class="pagehead"><h1>Inbox</h1><span class="muted">${S.forced === "empty" ? 0 : items.length} to review</span><span class="grow"></span>
    <button class="btn primary" data-act="acceptsel" ${sel ? "" : "disabled"}>Accept selected (${sel})</button></div>
    <div class="banner ai">AI never moves anything without you. Accept, edit, or dismiss — dismissing keeps the link, unsorted.</div>
    ${withForced(() => (items.length ? items.map(row).join("") : empty), { skeleton: skeletonRows(), empty })}`);
}

function viewSearch(): string {
  const q = decodeURIComponent(route().arg);
  const type = new URLSearchParams(location.hash.split("?")[1] || "").get("type") || "";
  const empty = (qq: string) => emptyBox(`No results for “${qq}”`, "Try fewer words, or search by tag or site.", /\.\w{2,}/.test(qq) ? `<button class="btn primary" data-act="add" data-url="${esc(qq)}">Add this as a link</button>` : "");
  const res = q.length < 2 ? [] : live().filter((b) => (!type || b.type === type) && [b.title, b.url, b.summary, b.note, b.tags.join(" ")].join(" ").toLowerCase().includes(q.toLowerCase()));
  const body = q.length < 2 ? `<div class="hint">Type at least 2 characters to search.</div>` : res.length ? bookmarkList(res, q) : empty(q);
  return appShell(`<div class="pagehead"><h1>Search</h1><span class="muted">${q.length >= 2 ? res.length + " results" : ""}</span></div>
    <div class="filters"><span class="small muted">Type:</span><a class="chip ${type ? "" : "on"}" href="#/search/${encodeURIComponent(q)}">any</a>${TYPES.map((t) => `<a class="chip" href="#/search/${encodeURIComponent(q)}?type=${t}" style="${type === t ? "background:var(--accent);color:#fff" : ""}">${t}</a>`).join("")}
    <button class="btn small" disabled title="Phase 2">Save search · soon</button></div>
    ${withForced(() => body, { empty: empty(q || "query") })}`, q);
}

function viewCollections(): string {
  const node = (c: Collection): string => `<div class="node" style="margin-left:${depth(c) * 22}px"><span style="font-size:18px">${c.icon}</span><a href="#/library/c/${c.id}" class="grow"><b>${esc(c.name)}</b></a>
    <span class="muted small">${live().filter((b) => b.collectionId === c.id).length} items</span>${c.share ? `<span class="badge ok">Shared</span>` : ""}
    <button class="btn small" data-act="share" data-id="${c.id}">Share</button><button class="btn small" data-act="renamecol" data-id="${c.id}">Rename</button><button class="btn small danger" data-act="delcol" data-id="${c.id}">Delete</button></div>${S.collections.filter((x) => x.parentId === c.id).map(node).join("")}`;
  const empty = emptyBox("No collections yet", "Create one, or let AI suggest them from your Inbox.", `<button class="btn primary" data-act="newcol">New collection</button>`);
  return appShell(`<div class="pagehead"><h1>Collections</h1><span class="grow"></span><button class="btn primary" data-act="newcol">+ New collection</button></div>
    ${withForced(() => (S.collections.length ? `<div class="tree">${S.collections.filter((c) => !c.parentId).map(node).join("")}</div>` : empty), { skeleton: skeletonRows(), empty })}`);
}

function viewData(): string {
  let imp = "";
  if (S.importStage === "idle") imp = `<div class="dropzone"><p><b>Drop a file here</b> or choose a sample</p><p class="muted small">.html .csv .json · up to 20 MB · 5,000 links per import</p>
    <button class="btn" data-act="pickfile" data-f="ok">Choose bookmarks.html (sample)</button> <button class="btn" data-act="pickfile" data-f="bad">Choose notes.pdf (wrong type)</button></div>`;
  if (S.importStage === "error") imp = `<div class="banner err" role="alert">${esc(S.importErr)}</div><button class="btn" data-act="importreset">Try another file</button>`;
  if (S.importStage === "preview") imp = `<div class="banner info"><div><b>bookmarks.html</b> — 812 links in 19 folders · 14 duplicates · 3 invalid</div></div>
    <div class="switch"><input type="checkbox" checked><div class="grow">Keep folders as collections<div class="hint">Otherwise everything goes to Unsorted.</div></div></div>
    <div class="switch"><input type="checkbox" checked><div class="grow">Run AI on imported links<div class="hint">Uses about 798 of your daily AI quota across several days.</div></div></div>
    <div class="row" style="margin-top:12px"><button class="btn primary" data-act="runimport">Import 798 links</button><button class="btn" data-act="importreset">Cancel</button></div>`;
  if (S.importStage === "running") imp = `<div class="col"><b>Importing… ${Math.round(S.importPct)}%</b><div class="progress"><div style="width:${S.importPct}%"></div></div><div class="muted small">${Math.round(S.importPct * 7.98)} / 798</div></div>`;
  if (S.importStage === "done") imp = `<div class="banner info"><div><b>Import finished.</b> 795 imported · 14 skipped (duplicates) · 3 invalid</div></div><div class="row"><a class="btn primary" href="#/inbox">Review in Inbox</a><button class="btn" data-act="importreset">Import another</button></div>`;
  return appShell(`<div class="pagehead"><h1>Import / Export</h1></div>
    ${withForced(() => `<h2>Import</h2><p class="muted">Browser bookmarks (HTML), CSV, or a JSON export from another tool.</p>${imp}
    <h2 style="margin-top:28px">Export</h2><p class="muted">Take your data with you. No lock-in.</p>
    <div class="row"><select id="exscope" style="width:auto"><option>Everything</option>${S.collections.map((c) => `<option>${esc(c.name)}</option>`).join("")}</select>
    ${["HTML", "CSV", "JSON"].map((f) => `<button class="btn" data-act="export" data-f="${f}">Export ${f}</button>`).join("")}</div>`, { skeleton: skeletonRows(3), empty: `<div class="hint">Nothing to show.</div>` })}`);
}

function viewIntegrations(): string {
  const empty = emptyBox("No tokens yet", "Create one to connect the browser extension.", `<button class="btn primary" data-act="newtoken">Create token</button>`);
  const table = `<table><tr><th>Name</th><th>Scope</th><th>Created</th><th>Last used</th><th></th></tr>${S.tokens.map((t) => `<tr><td>${esc(t.name)}</td><td><span class="badge">${t.scope}</span></td><td>${t.created}</td><td>${t.lastUsed}</td><td><button class="btn small danger" data-act="revoke" data-id="${t.id}">Revoke</button></td></tr>`).join("")}</table>`;
  return appShell(`<div class="pagehead"><h1>Integrations</h1><span class="grow"></span><button class="btn primary" data-act="newtoken">+ Create token</button></div>
    <div class="row" style="margin-bottom:16px"><span class="btn">Install Chrome extension</span><span class="btn">Install Firefox add-on</span><span class="btn">Bookmarklet</span></div>
    ${withForced(() => (S.tokens.length ? table : empty), { skeleton: skeletonRows(3), empty })}`);
}

function viewTrash(): string {
  const items = S.bookmarks.filter((b) => b.trashedAt);
  const empty = emptyBox("Trash is empty", "Deleted bookmarks stay here for 30 days.");
  const row = (b: Bookmark) => `<div class="rowitem" style="opacity:.85">${thumb(b)}<div><b>${esc(b.title)}</b><div class="muted small">${esc(host(b.url))} · 28 days left</div></div>
    <div class="row"><button class="btn small" data-act="restore" data-id="${b.id}">Restore</button><button class="btn small danger" data-act="purge" data-id="${b.id}">Delete forever</button></div></div>`;
  return appShell(`<div class="pagehead"><h1>Trash</h1><span class="grow"></span><button class="btn danger" data-act="emptytrash" ${items.length ? "" : "disabled"}>Empty trash</button></div>
    <div class="banner info">Items are removed permanently after 30 days.</div>${withForced(() => (items.length ? items.map(row).join("") : empty), { skeleton: skeletonRows(), empty })}`);
}

function viewSettings(): string {
  const prof = `<form data-form="profile" novalidate><div class="field"><label>Display name</label><input type="text" id="dn" value="Paweł"><div class="err" data-err="dn"></div></div>
    <div class="field"><label>Email</label><input type="email" id="pem" value="pawel@example.com"><div class="err" data-err="pem"></div></div>
    <button class="btn primary" type="submit">Save profile</button>
    <div class="banner err" style="margin-top:24px;display:block"><b>Danger zone</b><div class="small">Deleting your account removes every bookmark. Type your email to confirm.</div>
    <div class="row" style="margin-top:8px"><input type="text" id="delem" placeholder="pawel@example.com" style="max-width:260px"><button class="btn danger solid" type="button" data-act="delacct">Delete account</button></div><div class="err" data-err="delem"></div></div></form>`;
  const pct = Math.round((S.quotaUsed / 200) * 100);
  const sw = (id: string, label: string, hint: string, v: boolean) => `<label class="switch"><input type="checkbox" data-change="ai" data-k="${id}" ${v ? "checked" : ""}><div class="grow">${label}<div class="hint">${hint}</div></div></label>`;
  const ai = `${pct >= 100 ? `<div class="banner warn">Daily quota reached. New links are enriched tomorrow.</div>` : ""}
    <div class="col" style="margin-bottom:14px"><b>Today's AI usage: ${S.quotaUsed} / 200</b><div class="progress"><div style="width:${Math.min(100, pct)}%"></div></div></div>
    ${sw("aiAuto", "Enrich new links automatically", "Fetch, summarise and suggest on save.", S.aiAuto)}
    ${sw("aiAccept", "Auto-accept confident suggestions", `Skip the Inbox when confidence ≥ ${S.aiThreshold.toFixed(2)}.`, S.aiAccept)}
    ${sw("aiNewCols", "Allow AI to propose new collections", "Proposed only; never created without your OK.", S.aiNewCols)}
    <div class="field" style="margin-top:12px"><label>Confidence threshold: ${S.aiThreshold.toFixed(2)}</label><input type="range" min="0.5" max="1" step="0.05" value="${S.aiThreshold}" data-change="thr"></div>
    <div class="field"><label>Summary language</label><select><option>Same as page</option><option>English</option><option>Polski</option></select></div>
    <button class="btn primary" data-act="saveai">Save AI settings</button>`;
  return appShell(`<div class="pagehead"><h1>Settings</h1></div><div class="tabs"><button class="${S.tab === "profile" ? "on" : ""}" data-act="tab" data-t="profile">Profile</button><button class="${S.tab === "ai" ? "on" : ""}" data-act="tab" data-t="ai">AI</button></div>
    <div style="max-width:560px">${withForced(() => (S.tab === "profile" ? prof : ai), { skeleton: skeletonRows(3), empty: `<div class="hint">n/a</div>` })}</div>`);
}

function viewPublic(): string {
  const c = S.collections.find((x) => x.id === "c-rec") as Collection;
  if (!c.share) return viewNotFound();
  const all = live().filter((b) => b.collectionId === "c-rec" || b.collectionId === "c-dinner");
  const items = all.filter((b) => S.pubType === "all" || b.type === S.pubType);
  const saved = S.view; S.view = "grid";
  const html = `<div class="pub"><header><div class="brand" style="padding:0 0 14px"><i></i>Stash</div><h1>${esc(c.name)}</h1><p class="muted">Shared by Paweł · ${all.length} links</p>
    <div class="filters"><button class="chip ${S.pubType === "all" ? "on" : ""}" data-act="pubtype" data-t="all">all</button>${Array.from(new Set(all.map((b) => b.type))).map((t) => `<button class="chip ${S.pubType === t ? "on" : ""}" data-act="pubtype" data-t="${t}">${t}</button>`).join("")}</div></header>
    ${withForced(() => (items.length ? `<div class="grid">${items.map((b) => `<article class="card">${thumb(b)}<div class="body"><div class="title"><a href="${esc(b.url)}" target="_blank" rel="noopener noreferrer" style="color:inherit">${esc(b.title)}</a></div><div class="host">${esc(host(b.url))}</div><div class="sum">${esc(b.summary)}</div>${c.share?.tags ? `<div>${b.tags.map((t) => `<span class="chip tag">${esc(t)}</span>`).join(" ")}</div>` : ""}</div></article>`).join("")}</div>` : emptyBox("Nothing here yet", "")), { empty: emptyBox("Nothing here yet", "") })}
    <p class="muted small" style="margin-top:30px">Notes stay private. <a href="#/login">Make your own collection →</a></p></div>`;
  S.view = saved; return html;
}
function viewNotFound(): string {
  return `<div class="authwrap"><div class="authcard" style="text-align:center"><h1>404</h1><p class="muted">This page doesn't exist or isn't shared anymore.</p><a class="btn primary" href="#/login">Go to home</a></div></div>`;
}

function adminShell(content: string): string {
  const r = route().name;
  const a = (h: string, label: string) => `<a href="#/${h}" class="${r === h ? "active" : ""}">${label}</a>`;
  return `<div class="admin"><aside class="side nav"><div class="brand"><i></i>Admin</div>${a("admin", "Dashboard")}${a("admin/jobs", "Jobs")}${a("admin/users", "Users")}<h4>Back</h4><a href="#/library">← Library</a></aside><main class="main">${content}</main></div>`;
}
function viewAdmin(): string {
  const tiles = `<div class="tiles"><div class="tile"><span class="muted">Users</span><b>${S.users.length}</b></div><div class="tile"><span class="muted">Bookmarks</span><b>1,739</b></div><div class="tile"><span class="muted">Queue depth</span><b>${S.jobs.filter((j) => j.status !== "failed").length}</b></div><div class="tile"><span class="muted">Failure rate 24 h</span><b>3.1%</b></div></div>`;
  const fails = S.jobs.filter((j) => j.status === "failed");
  return adminShell(`<h1>Dashboard</h1><p class="muted">Service health.</p>${withForced(() => `${tiles}<h2>Recent failures</h2>${fails.length ? `<table><tr><th>URL</th><th>Error</th><th>Attempts</th></tr>${fails.map((j) => `<tr><td>${esc(j.url)}</td><td>${esc(j.error)}</td><td>${j.attempts}</td></tr>`).join("")}</table>` : `<div class="hint">No failures in the last 24 h.</div>`}`, { skeleton: `<div class="tiles">${Array.from({ length: 4 }, () => `<div class="skel" style="height:80px"></div>`).join("")}</div>`, empty: `<div class="hint">No failures in the last 24 h.</div>` })}`);
}
function viewJobs(): string {
  const badge = (s: string) => `<span class="badge ${s === "failed" ? "bad" : s === "running" ? "ai" : ""}">${s}</span>`;
  return adminShell(`<h1>Jobs</h1>${withForced(() => (S.jobs.length ? `<table><tr><th>URL</th><th>User</th><th>Status</th><th>Error</th><th></th></tr>${S.jobs.map((j) => `<tr><td>${esc(j.url)}</td><td>${esc(j.user)}</td><td>${badge(j.status)}</td><td>${esc(j.error) || "—"}</td><td>${j.status === "failed" ? `<button class="btn small" data-act="jobretry" data-id="${j.id}">Retry</button> <button class="btn small danger" data-act="jobdiscard" data-id="${j.id}">Discard</button>` : ""}</td></tr>`).join("")}</table>` : `<div class="hint">No jobs match.</div>`), { skeleton: skeletonRows(), empty: `<div class="hint">No jobs match.</div>` })}`);
}
function viewUsers(): string {
  const list = S.users.filter((u) => u.email.includes(S.adminQ));
  return adminShell(`<h1>Users</h1><div class="field" style="max-width:320px"><input type="search" placeholder="Search email" value="${esc(S.adminQ)}" data-input="adminq"></div>
    ${withForced(() => (list.length ? `<table><tr><th>Email</th><th>Bookmarks</th><th>Daily quota</th><th>Last active</th><th>Status</th><th></th></tr>${list.map((u) => `<tr><td>${esc(u.email)}</td><td>${u.bookmarks}</td><td>${u.quota}</td><td>${u.active}</td><td>${u.suspended ? `<span class="badge bad">suspended</span>` : `<span class="badge ok">active</span>`}</td>
    <td>${u.suspended ? `<button class="btn small" data-act="unsuspend" data-id="${u.id}">Unsuspend</button>` : `<button class="btn small danger" data-act="suspend" data-id="${u.id}">Suspend</button>`}</td></tr>`).join("")}</table>` : `<div class="hint">No users match.</div>`), { skeleton: skeletonRows(), empty: `<div class="hint">No users match.</div>` })}`);
}

/* ---------- drawer ---------- */
function drawerHtml(b: Bookmark): string {
  const st = S.drawerState === "saving" ? `<span class="muted small"><span class="spinner"></span> Saving…</span>` : S.drawerState === "saved" ? `<span class="saved">✓ Saved</span>` : S.drawerState === "error" ? `<span style="color:var(--danger)" class="small">Couldn't save · <a href="javascript:void 0" data-act="drawerretry">Retry</a></span>` : "";
  const meta = Object.entries(b.meta).map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join("");
  return `<aside class="drawer" aria-label="Bookmark detail"><div class="row"><button class="btn ghost small" data-act="closedrawer">✕ Close</button><span class="grow"></span>${st}
    <button class="iconbtn ${b.favorite ? "on" : ""}" data-act="fav" data-id="${b.id}">${b.favorite ? "★" : "☆"}</button><button class="iconbtn" data-act="trash" data-id="${b.id}" title="Delete">🗑</button></div>
    <div style="height:12px"></div>${thumb(b)}${statusBadge(b)}
    <input class="title" id="d-title" value="${esc(b.title)}" data-change="dtitle" aria-label="Title"><div class="err" data-err="d-title"></div>
    <div class="row small" style="margin:2px 0 10px"><a href="${esc(b.url)}" target="_blank" rel="noopener noreferrer" data-act="opened">${esc(host(b.url))} ↗</a><span class="muted">· saved ${esc(b.added)}</span></div>
    ${b.suggestion ? `<div class="banner ai"><div class="grow small"><b>AI suggests</b> ${esc(b.suggestion.type)} · ${esc(b.suggestion.tags.join(", "))}</div><button class="btn small" data-act="accept" data-id="${b.id}">Accept</button></div>` : ""}
    <div class="field"><label>Summary ${b.summary ? `<span class="badge ai">AI</span>` : ""}</label><textarea rows="3" data-change="dsum">${esc(b.summary)}</textarea>${b.summary ? `<a href="javascript:void 0" class="small" data-act="rerun" data-id="${b.id}">Re-run AI…</a>` : ""}</div>
    ${meta ? `<dl class="metagrid">${meta}</dl><div style="height:10px"></div>` : ""}
    <div class="field"><label>Collection</label><select data-change="dcol"><option value="">Unsorted</option>${S.collections.map((c) => `<option value="${c.id}" ${b.collectionId === c.id ? "selected" : ""}>${"– ".repeat(depth(c))}${esc(c.name)}</option>`).join("")}</select></div>
    <div class="field"><label>Tags</label><input type="text" id="d-tags" value="${esc(b.tags.join(", "))}" data-change="dtags" placeholder="comma, separated"><div class="err" data-err="d-tags"></div></div>
    <div class="field"><label>Note</label><textarea rows="3" data-change="dnote" placeholder="Add a note">${esc(b.note)}</textarea></div></aside>`;
}

/* ---------- modals ---------- */
function openModal(html: string) { $("#overlay")!.innerHTML = `<div class="scrim" data-act="scrim"><div class="modal" role="dialog" aria-modal="true">${html}</div></div>`; $<HTMLElement>("#overlay input, #overlay select")?.focus(); }
function closeModal() { $("#overlay")!.innerHTML = ""; }
const setErr = (name: string, msg: string) => { const e = document.querySelector<HTMLElement>(`[data-err="${name}"]`); if (e) e.textContent = msg; document.getElementById(name)?.classList.toggle("invalid", !!msg); };

function addModal(prefill = "") {
  openModal(`<h2>Add a bookmark</h2><div class="field"><label for="m-url">Link</label><input id="m-url" type="text" value="${esc(prefill)}" placeholder="https://…" data-input="url"><div class="err" data-err="m-url"></div>
    <div class="hint" id="m-hint">Paste a link. AI will fill in the rest. Try “kitchen.example/lemon-pasta” (duplicate) or “bad link”.</div></div>
    <div id="m-dupe"></div><details><summary class="muted">Details (optional)</summary><div class="field" style="margin-top:8px"><label>Collection</label><select id="m-col"><option value="">Let AI decide</option>${S.collections.map((c) => `<option value="${c.id}">${esc(c.name)}</option>`).join("")}</select></div>
    <div class="field"><label>Tags</label><input type="text" id="m-tags" placeholder="comma, separated"></div><div class="field"><label>Note</label><textarea id="m-note" rows="2" maxlength="2000"></textarea></div></details>
    <div class="foot"><button class="btn" data-act="closemodal">Cancel</button><button class="btn" data-act="savemore" id="m-more" disabled>Save & add another</button><button class="btn primary" data-act="saveurl" id="m-save" disabled>Save</button></div>`);
  if (prefill) checkUrl();
}
function checkUrl(): boolean {
  const inp = document.getElementById("m-url") as HTMLInputElement; const v = inp.value; const err = v ? validateUrl(v) : "";
  setErr("m-url", err);
  const norm = normalizeUrl(v); const dupe = !err && v ? live().find((b) => b.url.replace(/^https?:\/\//, "") === norm.replace(/^https?:\/\//, "")) : undefined;
  $("#m-dupe")!.innerHTML = dupe ? `<div class="banner warn"><div class="grow small">Already saved on ${esc(dupe.added)} in <b>${esc(colOf(dupe.collectionId)?.name ?? "Unsorted")}</b>.</div><button class="btn small" data-act="open" data-id="${dupe.id}" data-close="1">Open existing</button></div>` : "";
  const ok = !!v && !err;
  (document.getElementById("m-save") as HTMLButtonElement).disabled = !ok; (document.getElementById("m-more") as HTMLButtonElement).disabled = !ok;
  return ok;
}
function saveUrl(more: boolean) {
  if (!checkUrl()) return;
  const url = normalizeUrl((document.getElementById("m-url") as HTMLInputElement).value);
  const col = (document.getElementById("m-col") as HTMLSelectElement).value || null;
  const tags = (document.getElementById("m-tags") as HTMLInputElement).value.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean);
  const b: Bookmark = { id: "b" + ++S.seq, url, title: host(url), summary: "", type: "other", status: "pending", collectionId: col, tags, note: (document.getElementById("m-note") as HTMLTextAreaElement).value, favorite: false, meta: {}, suggestion: null, added: "Today", trashedAt: null, reviewed: false };
  S.bookmarks.unshift(b); enrichLater(b.id); toast("Saved. Enriching…");
  if (more) { addModal(); } else closeModal();
  if (route().name !== "library" && route().name !== "inbox") location.hash = "#/library"; render();
}

function colModal(id?: string) {
  const c = id ? colOf(id) : undefined;
  openModal(`<h2>${c ? "Rename collection" : "New collection"}</h2><div class="field"><label for="c-name">Name</label><input id="c-name" type="text" value="${esc(c?.name ?? "")}" maxlength="80"><div class="err" data-err="c-name"></div></div>
    ${c ? "" : `<div class="field"><label>Parent</label><select id="c-parent"><option value="">None (top level)</option>${S.collections.filter((x) => depth(x) < 2).map((x) => `<option value="${x.id}">${esc(x.name)}</option>`).join("")}</select><div class="hint">Collections nest up to 3 levels.</div></div>`}
    <div class="foot"><button class="btn" data-act="closemodal">Cancel</button><button class="btn primary" data-act="savecol" data-id="${id ?? ""}">${c ? "Rename" : "Create"}</button></div>`);
}
function shareModal(id: string) {
  const c = colOf(id); if (!c) return; const n = live().filter((b) => b.collectionId === id).length; const on = !!c.share;
  openModal(`<h2>Share “${esc(c.name)}”</h2>${n === 0 ? `<div class="banner warn">An empty collection can't be shared.</div>` : ""}
    <label class="switch"><input type="checkbox" data-change="shareon" data-id="${id}" ${on ? "checked" : ""} ${n === 0 ? "disabled" : ""}><div class="grow">Public link<div class="hint">${on ? "Anyone with the link can view." : "Only you can see this collection."}</div></div></label>
    ${on ? `<div class="row" style="margin:12px 0"><input type="text" readonly value="https://stash.example/s/lemon-pasta-7k2x"><button class="btn" data-act="copy">Copy link</button></div>
    <label class="switch"><input type="checkbox" data-change="sharenotes" data-id="${id}" ${c.share?.notes ? "checked" : ""}><div class="grow">Show my notes<div class="hint">${live().some((b) => b.collectionId === id && b.note) ? "Some items have private notes — they stay hidden unless on." : "Off by default."}</div></div></label>
    <label class="switch"><input type="checkbox" data-change="sharetags" data-id="${id}" ${c.share?.tags ? "checked" : ""}><div class="grow">Show tags</div></label>
    <div class="row" style="margin-top:12px"><a class="btn" href="#/public" data-act="closemodal">Preview as visitor</a><button class="btn danger" data-act="regen">Regenerate link</button></div>` : ""}
    <div class="foot"><button class="btn primary" data-act="closemodal">Done</button></div>`);
}
function confirmModal(title: string, text: string, act: string, id: string, label = "Delete") {
  openModal(`<h2>${esc(title)}</h2><p class="muted">${text}</p><div class="foot"><button class="btn" data-act="closemodal">Cancel</button><button class="btn danger solid" data-act="${act}" data-id="${id}">${esc(label)}</button></div>`);
}
function moveModal() {
  openModal(`<h2>Move ${S.sel.size} bookmark${S.sel.size > 1 ? "s" : ""}</h2><div class="field"><select id="mv"><option value="">Unsorted</option>${S.collections.map((c) => `<option value="${c.id}">${esc(c.name)}</option>`).join("")}</select></div><div class="foot"><button class="btn" data-act="closemodal">Cancel</button><button class="btn primary" data-act="domove">Move</button></div>`);
}

/* ---------- actions ---------- */
function trashIds(ids: string[]) {
  ids.forEach((id) => { const b = bm(id); if (b) b.trashedAt = Date.now(); });
  S.sel.clear(); if (S.drawer && ids.includes(S.drawer)) S.drawer = null;
  toast(`Moved ${ids.length} to Trash`, () => ids.forEach((id) => { const b = bm(id); if (b) b.trashedAt = null; }));
}
function flashSaved() { S.drawerState = "saving"; setTimeout(() => { S.drawerState = $("#d-title") && (document.getElementById("d-title") as HTMLInputElement).value.trim() ? "saved" : "error"; render(); setTimeout(() => { if (S.drawerState === "saved") { S.drawerState = ""; render(); } }, 2000); }, 450); }

const actions: Record<string, (el: HTMLElement, ev: Event) => void> = {
  retry: () => { S.forced = "normal"; render(); },
  add: (el) => { addModal(el.dataset.url || ""); },
  closemodal: () => closeModal(),
  scrim: (el, ev) => { if (ev.target === el) closeModal(); },
  saveurl: () => saveUrl(false), savemore: () => saveUrl(true),
  open: (el) => { if (el.dataset.close) closeModal(); S.drawer = el.dataset.id || null; S.drawerState = ""; render(); },
  closedrawer: () => { S.drawer = null; render(); },
  opened: () => { /* real link opens in new tab; would POST /bookmarks/:id/open */ },
  fav: (el) => { const b = bm(el.dataset.id!); if (b) { b.favorite = !b.favorite; toast(b.favorite ? "Added to favourites" : "Removed from favourites"); } render(); },
  trash: (el) => { trashIds([el.dataset.id!]); render(); },
  pick: (el) => { const id = el.dataset.id!; S.sel.has(id) ? S.sel.delete(id) : S.sel.add(id); render(); },
  view: (el) => { S.view = el.dataset.v as typeof S.view; render(); },
  bulk: (el) => {
    const op = el.dataset.op; const ids = [...S.sel];
    if (op === "clear") S.sel.clear();
    if (op === "fav") { ids.forEach((id) => { const b = bm(id); if (b) b.favorite = true; }); toast(`Favourited ${ids.length}`); S.sel.clear(); }
    if (op === "trash") { if (ids.length > 10) return confirmModal("Delete many?", `Delete ${ids.length} bookmarks?`, "bulkdel", "", "Delete"); trashIds(ids); }
    if (op === "move") return moveModal();
    render();
  },
  bulkdel: () => { closeModal(); trashIds([...S.sel]); render(); },
  domove: () => { const v = (document.getElementById("mv") as HTMLSelectElement).value || null; const ids = [...S.sel]; const prev = ids.map((id) => [id, bm(id)?.collectionId ?? null] as const);
    ids.forEach((id) => { const b = bm(id); if (b) b.collectionId = v; }); S.sel.clear(); closeModal(); toast(`Moved ${ids.length} to ${colOf(v)?.name ?? "Unsorted"}`, () => prev.forEach(([id, c]) => { const b = bm(id); if (b) b.collectionId = c; })); render(); },
  accept: (el) => { const b = bm(el.dataset.id!); if (!b) return; const had = JSON.stringify(b); acceptSuggestion(b); toast("Accepted · filed in " + (colOf(b.collectionId)?.name ?? "Unsorted"), () => Object.assign(b, JSON.parse(had))); render(); },
  acceptsel: () => { const ids = [...S.sel].filter((id) => bm(id)?.suggestion); ids.forEach((id) => acceptSuggestion(bm(id)!)); S.sel.clear(); toast(`Accepted ${ids.length}`); render(); },
  dismiss: (el) => { const b = bm(el.dataset.id!); if (b) { b.suggestion = null; b.reviewed = true; } toast("Suggestions dismissed. Link kept in Unsorted."); render(); },
  retryone: (el) => { const b = bm(el.dataset.id!); if (b) { b.status = "pending"; b.url = b.url.replace(/forbidden/, "recovered-article"); enrichLater(b.id); } render(); },
  rerun: (el) => { openModal(`<h2>Re-run AI</h2><p class="muted">Choose what AI may overwrite. Your own edits stay unless ticked.</p>${["Title", "Summary", "Tags", "Collection"].map((f) => `<label class="switch"><input type="checkbox" ${f === "Summary" ? "checked" : ""}>${f}</label>`).join("")}<div class="foot"><button class="btn" data-act="closemodal">Cancel</button><button class="btn primary" data-act="closemodal" data-id="${el.dataset.id}">Re-run</button></div>`); },
  newcol: () => colModal(), renamecol: (el) => colModal(el.dataset.id),
  savecol: (el) => {
    const name = (document.getElementById("c-name") as HTMLInputElement).value.trim(); const id = el.dataset.id; const parent = (document.getElementById("c-parent") as HTMLSelectElement | null)?.value || (id ? colOf(id)?.parentId ?? null : null) || null;
    if (!name) return setErr("c-name", "Give the collection a name.");
    if (name.length > 60) return setErr("c-name", "Max 60 characters.");
    if (S.collections.some((c) => c.id !== id && c.parentId === parent && c.name.toLowerCase() === name.toLowerCase())) return setErr("c-name", "A collection with this name already exists here.");
    if (id) { colOf(id)!.name = name; toast("Collection renamed"); } else { S.collections.push({ id: uid(), name, icon: "▫", parentId: parent, share: null }); toast("Collection created"); }
    closeModal(); render();
  },
  delcol: (el) => { const c = colOf(el.dataset.id!); if (c) confirmModal(`Delete “${c.name}”?`, `Its ${live().filter((b) => b.collectionId === c.id).length} bookmarks will move to Unsorted. Nothing is lost.`, "delcolgo", c.id, "Delete collection"); },
  delcolgo: (el) => { const id = el.dataset.id!; S.bookmarks.forEach((b) => { if (b.collectionId === id) b.collectionId = null; }); S.collections.forEach((c) => { if (c.parentId === id) c.parentId = null; }); S.collections = S.collections.filter((c) => c.id !== id); closeModal(); toast("Collection deleted"); render(); },
  share: (el) => shareModal(el.dataset.id!),
  copy: () => toast("Link copied"),
  regen: () => confirmModal("Regenerate link?", "The old link stops working immediately.", "closemodal", "", "Regenerate"),
  pickfile: (el) => { S.importStage = "idle"; if (el.dataset.f === "bad") { S.importStage = "error"; S.importErr = "notes.pdf isn't a supported file. Use .html, .csv or .json (max 20 MB)."; } else S.importStage = "preview"; render(); },
  importreset: () => { S.importStage = "idle"; render(); },
  runimport: () => { S.importStage = "running"; S.importPct = 0; render(); const t = setInterval(() => { S.importPct += 12; if (S.importPct >= 100) { clearInterval(t); S.importStage = "done"; toast("Import finished"); } if (route().name === "data") render(); }, 350); },
  export: (el) => toast(`Export ready: stash-export.${(el.dataset.f || "json").toLowerCase()}`),
  newtoken: () => openModal(`<h2>Create token</h2><div class="field"><label for="t-name">Name</label><input id="t-name" type="text" placeholder="e.g. Work laptop"><div class="err" data-err="t-name"></div></div><div class="field"><label>Scope</label><select id="t-scope"><option value="save">Save only</option><option value="read+save">Read + save</option></select></div><div class="foot"><button class="btn" data-act="closemodal">Cancel</button><button class="btn primary" data-act="mktoken">Create</button></div>`),
  mktoken: () => {
    const name = (document.getElementById("t-name") as HTMLInputElement).value.trim(); if (!name) return setErr("t-name", "Name the token so you can recognise it later.");
    if (S.tokens.length >= 10) return setErr("t-name", "You can have at most 10 tokens. Revoke one first.");
    S.tokens.push({ id: uid(), name, scope: (document.getElementById("t-scope") as HTMLSelectElement).value, created: "Today", lastUsed: "Never" });
    openModal(`<h2>Token created</h2><div class="banner warn">Copy it now. You won't see it again.</div><div class="row"><input type="text" readonly value="stash_pat_9f3kQ0x71LmZpA82vD"><button class="btn" data-act="copy">Copy</button></div><div class="foot"><button class="btn primary" data-act="closemodal">Done</button></div>`); render();
  },
  revoke: (el) => { S.tokens = S.tokens.filter((t) => t.id !== el.dataset.id); toast("Token revoked. Clients using it now get 401."); render(); },
  restore: (el) => { const b = bm(el.dataset.id!); if (b) { b.trashedAt = null; toast("Restored to " + (colOf(b.collectionId)?.name ?? "Unsorted")); } render(); },
  purge: (el) => confirmModal("Delete forever?", "This can't be undone.", "purgego", el.dataset.id!, "Delete forever"),
  purgego: (el) => { S.bookmarks = S.bookmarks.filter((b) => b.id !== el.dataset.id); closeModal(); toast("Deleted permanently"); render(); },
  emptytrash: () => confirmModal("Empty trash?", `${S.bookmarks.filter((b) => b.trashedAt).length} items will be deleted permanently.`, "emptygo", "", "Empty trash"),
  emptygo: () => { S.bookmarks = S.bookmarks.filter((b) => !b.trashedAt); closeModal(); toast("Trash emptied"); render(); },
  tab: (el) => { S.tab = el.dataset.t!; render(); },
  saveai: () => { toast("Settings saved"); },
  delacct: () => { const v = (document.getElementById("delem") as HTMLInputElement).value; setErr("delem", v === "pawel@example.com" ? "" : "Type your email exactly to confirm."); if (v === "pawel@example.com") { toast("Account deleted (mock)"); location.hash = "#/login"; } },
  authmode: (el) => { S.authMode = el.dataset.mode as typeof S.authMode; S.authErr = ""; render(); },
  pubtype: (el) => { S.pubType = el.dataset.t!; render(); },
  jobretry: (el) => { const j = S.jobs.find((x) => x.id === el.dataset.id); if (j) { j.status = "queued"; j.error = ""; } toast("Job re-queued"); render(); },
  jobdiscard: (el) => { S.jobs = S.jobs.filter((x) => x.id !== el.dataset.id); toast("Job discarded"); render(); },
  suspend: (el) => openModal(`<h2>Suspend user</h2><div class="field"><label for="s-reason">Reason (stored in audit log)</label><input id="s-reason" type="text"><div class="err" data-err="s-reason"></div></div><div class="foot"><button class="btn" data-act="closemodal">Cancel</button><button class="btn danger solid" data-act="dosuspend" data-id="${el.dataset.id}">Suspend</button></div>`),
  dosuspend: (el) => { const r = (document.getElementById("s-reason") as HTMLInputElement).value.trim(); if (r.length < 5) return setErr("s-reason", "Give a reason of at least 5 characters."); const u = S.users.find((x) => x.id === el.dataset.id); if (u) u.suspended = true; closeModal(); toast("User suspended · audit entry written"); render(); },
  unsuspend: (el) => { const u = S.users.find((x) => x.id === el.dataset.id); if (u) u.suspended = false; toast("User unsuspended"); render(); },
  drawerretry: () => flashSaved(),
};

const changes: Record<string, (el: HTMLInputElement & HTMLSelectElement & HTMLTextAreaElement) => void> = {
  sort: (el) => { S.sort = el.value; render(); },
  dtitle: (el) => { const b = bm(S.drawer!)!; const v = el.value.trim(); if (!v || v.length > 300) { S.drawerState = "error"; render(); setErr("d-title", v ? "Max 300 characters." : "Title can't be empty."); return; } b.title = v; flashSaved(); },
  dsum: (el) => { bm(S.drawer!)!.summary = el.value; flashSaved(); },
  dnote: (el) => { bm(S.drawer!)!.note = el.value; flashSaved(); },
  dcol: (el) => { bm(S.drawer!)!.collectionId = el.value || null; flashSaved(); },
  dtags: (el) => { const t = el.value.split(",").map((x) => x.trim().toLowerCase()).filter(Boolean); if (t.length > 20 || t.some((x) => x.length > 40)) return setErr("d-tags", "Max 20 tags, 40 characters each."); bm(S.drawer!)!.tags = t; flashSaved(); },
  shareon: (el) => { const c = colOf(el.dataset.id!)!; c.share = el.checked ? { notes: false, tags: true } : null; toast(el.checked ? "Public link on" : "Public link off — it stops working now"); shareModal(c.id); render(); },
  sharenotes: (el) => { colOf(el.dataset.id!)!.share!.notes = el.checked; },
  sharetags: (el) => { colOf(el.dataset.id!)!.share!.tags = el.checked; },
  ai: (el) => { (S as unknown as Record<string, boolean>)[el.dataset.k!] = el.checked; render(); },
  thr: (el) => { S.aiThreshold = Number(el.value); render(); },
};

/* ---------- render & wiring ---------- */
function render() {
  const r = route(); let html = "";
  switch (r.name) {
    case "login": html = viewLogin(); break; case "welcome": html = viewWelcome(); break; case "library": html = viewLibrary(); break;
    case "inbox": html = viewInbox(); break; case "search": html = viewSearch(); break; case "collections": html = viewCollections(); break;
    case "data": html = viewData(); break; case "integrations": html = viewIntegrations(); break; case "trash": html = viewTrash(); break;
    case "settings": html = viewSettings(); break; case "public": html = viewPublic(); break; case "admin": html = viewAdmin(); break;
    case "admin/jobs": html = viewJobs(); break; case "admin/users": html = viewUsers(); break; default: html = viewNotFound();
  }
  const focusId = (document.activeElement as HTMLElement | null)?.id; const selStart = (document.activeElement as HTMLInputElement | null)?.selectionStart ?? null;
  $("#app")!.innerHTML = html;
  if (focusId && focusId !== "d-title") { const f = document.getElementById(focusId) as HTMLInputElement | null; f?.focus(); if (f && selStart !== null && f.setSelectionRange) try { f.setSelectionRange(selStart, selStart); } catch { /* not a text input */ } }
  devbar();
}
function devbar() {
  const r = route(); const info = SCREEN_INFO[r.name] ?? "";
  const links = Object.keys(SCREEN_INFO).map((k) => `<a href="#/${k}">${k}</a>`).join(" · ");
  $("#devbar")!.innerHTML = `<b>MOCKUP</b><span>${esc(info)}</span><label>State: <select id="forced">${(["normal", "loading", "empty", "error"] as Forced[]).map((f) => `<option ${S.forced === f ? "selected" : ""}>${f}</option>`).join("")}</select></label>${links}`;
}

document.addEventListener("click", (e) => {
  const el = (e.target as HTMLElement).closest<HTMLElement>("[data-act]"); if (!el) return;
  const act = el.dataset.act!; if (el.tagName === "INPUT" && act === "pick") { actions.pick(el, e); return; }
  if (el.tagName === "A" && el.getAttribute("href") && !el.getAttribute("href")!.startsWith("javascript") && act !== "closemodal") return;
  actions[act]?.(el, e);
});
document.addEventListener("change", (e) => {
  const t = e.target as HTMLInputElement & HTMLSelectElement & HTMLTextAreaElement;
  if (t.id === "forced") { S.forced = t.value as Forced; render(); return; }
  const k = t.dataset.change; if (k) changes[k]?.(t);
});
document.addEventListener("input", (e) => {
  const t = e.target as HTMLInputElement; const k = t.dataset.input;
  if (k === "url") checkUrl();
  if (k === "adminq") { S.adminQ = t.value; render(); }
  if (k === "suggest") {
    const q = t.value.trim().toLowerCase(); const box = document.getElementById("suggest")!;
    if (q.length < 2) { box.classList.add("hidden"); return; }
    const hits = live().filter((b) => (b.title + b.tags.join(" ")).toLowerCase().includes(q)).slice(0, 5);
    box.innerHTML = hits.map((b) => `<a href="javascript:void 0" data-act="open" data-id="${b.id}">${ICON[b.type]} ${hl(b.title, q)}</a>`).join("") + `<a href="#/search/${encodeURIComponent(q)}"><b>Search for “${esc(q)}”</b></a>`;
    box.classList.remove("hidden");
  }
});
document.addEventListener("keydown", (e) => {
  const t = e.target as HTMLElement; const typing = /INPUT|TEXTAREA|SELECT/.test(t.tagName);
  if (e.key === "Enter" && t.id === "q") { location.hash = `#/search/${encodeURIComponent((t as HTMLInputElement).value.trim())}`; }
  if (e.key === "Enter" && t.id === "m-url") { e.preventDefault(); saveUrl(false); }
  if (e.key === "Escape") { if ($("#overlay")!.innerHTML) closeModal(); else if (S.drawer) { S.drawer = null; render(); } }
  if (typing || e.metaKey || e.ctrlKey) return;
  if (e.key === "n") { e.preventDefault(); addModal(); }
  if (e.key === "/") { e.preventDefault(); $<HTMLInputElement>("#q")?.focus(); }
});
document.addEventListener("submit", (e) => {
  e.preventDefault(); const f = e.target as HTMLElement; const kind = f.dataset.form;
  if (kind === "auth") {
    const em = (document.getElementById("em") as HTMLInputElement).value.trim(); const pw = (document.getElementById("pw") as HTMLInputElement).value; const up = S.authMode === "signup";
    const eErr = !em ? "Enter your email." : !/^\S+@\S+\.\S+$/.test(em) ? "That email doesn't look right." : ""; const pErr = !pw ? "Enter your password." : up && pw.length < 10 ? "Use at least 10 characters." : "";
    setErr("em", eErr); setErr("pw", pErr); if (eErr || pErr) return;
    if (!up && em.startsWith("wrong")) { S.authErr = "Email or password is incorrect."; render(); return; }
    if (up && em.startsWith("taken")) { S.authErr = "That email is already registered. Sign in instead?"; render(); return; }
    S.authErr = ""; location.hash = up ? "#/welcome" : "#/library";
  }
  if (kind === "profile") {
    const dn = (document.getElementById("dn") as HTMLInputElement).value.trim(); const em = (document.getElementById("pem") as HTMLInputElement).value;
    setErr("dn", dn && dn.length <= 60 ? "" : "Name must be 1–60 characters."); setErr("pem", /^\S+@\S+\.\S+$/.test(em) ? "" : "That email doesn't look right.");
    if (dn && dn.length <= 60 && /^\S+@\S+\.\S+$/.test(em)) toast("Profile saved");
  }
});
document.addEventListener("dragstart", (e) => { const d = (e.target as HTMLElement).closest<HTMLElement>("[data-drag]"); if (d) e.dataTransfer?.setData("text/plain", d.dataset.drag!); });
document.addEventListener("dragover", (e) => { const d = (e.target as HTMLElement).closest<HTMLElement>("[data-drop]"); if (d) { e.preventDefault(); d.classList.add("droptarget"); } });
document.addEventListener("dragleave", (e) => (e.target as HTMLElement).closest("[data-drop]")?.classList.remove("droptarget"));
document.addEventListener("drop", (e) => {
  const d = (e.target as HTMLElement).closest<HTMLElement>("[data-drop]"); if (!d) return; e.preventDefault();
  const id = e.dataTransfer?.getData("text/plain"); const b = id ? bm(id) : undefined; if (!b) return;
  const prev = b.collectionId; b.collectionId = d.dataset.drop === "none" ? null : d.dataset.drop!;
  toast(`Moved to ${colOf(b.collectionId)?.name ?? "Unsorted"}`, () => { b.collectionId = prev; }); render();
});
window.addEventListener("hashchange", () => { S.forced = "normal"; S.sel.clear(); if (route().name !== "library" && route().name !== "inbox" && route().name !== "search") S.drawer = null; closeModal(); render(); window.scrollTo(0, 0); });
if (!location.hash) location.hash = "#/login";
render();
