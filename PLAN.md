# PLAN.md — Client-Side Developer Tools Hub

> Working name: **devkit-local**. Build phase by phase; finish each phase, run its "Done when"
> checks, and commit before moving on. Decisions not covered here go in `DECISIONS.md`.

## 1. Product summary

A fast, polished website that collects everyday developer tools in one place. **Everything runs in
the browser.** No input is ever sent to a server.

**Positioning:** "The dev toolbox for AI engineers." Alongside the usual basics (JWT, JSON, regex,
timestamps), it has strong LLM tools: token counting, cost comparison, context-window fit, and
schema conversion.

**Core promises (non-negotiable):**
1. **Private:** no network requests carrying user input. Enforced with a strict CSP.
2. **Fast:** each tool is lazy-loaded. Home page JS bundle under 150 KB gzipped.
3. **Offline:** installable PWA that works with no connection after the first visit.
4. **Keyboard-first:** Ctrl/Cmd+K command palette to reach any tool.

## 2. Tech stack

Vite · React 18 + TypeScript (strict) · Tailwind (dark mode via `class`) · React Router
(`/tools/:slug`) · `cmdk` · CodeMirror 6 (`@uiw/react-codemirror`, lazy) · `vite-plugin-pwa` ·
Vitest + Playwright · ESLint + Prettier · Vercel / Cloudflare Pages (static).

Per-tool libraries (install when the tool is built; browser-only): `jose`, `js-tiktoken`,
`js-yaml`, `papaparse`, `fast-xml-parser`, `cronstrue` + `cron-parser`, `quicktype-core` (or a
lighter custom generator), `sql-formatter`, Web Crypto + `spark-md5`, `crypto.randomUUID()` +
`ulid`, `qrcode`, `diff`.

Rule: **no library that makes network calls**. Check every new dependency.

## 3. Architecture

- Folder layout: `src/app` (App, routes, Layout), `src/components` (ToolShell, CopyButton,
  CodeInput, OutputPanel, Tabs, ErrorBox), `src/lib` (registry, storage, urlState, clipboard),
  `src/data/llm-models.json`, `src/tools/<slug>/{index.ts, <Name>.tsx, logic.ts, logic.test.ts}`.
- **Registry** (`src/lib/registry.ts`) is the single source of truth: `ToolMeta { slug, name,
  description, category, keywords, component (lazy), isNew?, sensitive? }`. Categories:
  `ai | auth | json | web | text | time | misc`.
- **Logic/UI separation:** pure functions in `logic.ts` with unit tests; components only manage
  state and render; errors returned as values (`{ ok: false, error }`).
- **ToolShell:** title, description, category badge, favorite star; input/output panels (side by
  side on desktop, stacked on mobile); Load sample, Clear, Copy output, Share link; privacy note.
- **Local storage:** theme, favorites, recents (last 8), per-tool settings. Never store tool inputs
  unless "Remember inputs" is on (off by default).
- **Share URLs:** state in the URL hash (`#s=<base64url(json)>`), `lz-string` compression, ~8 KB
  cap. Sensitive tools share settings only unless "Include input" is ticked.
- **Privacy:** CSP `default-src 'self'; connect-src 'self'; img-src 'self' data: blob:; style-src
  'self' 'unsafe-inline'; script-src 'self'; worker-src 'self' blob:`. No third-party analytics.
  `/privacy` page.
- **Performance:** each tool a lazy chunk with skeleton; heavy work in Web Workers (`comlink`);
  debounce input ~200 ms.

## 4. Pages

`/` home (search, Favorites, Recent, category cards, AI first) · `/tools/:slug` · `/privacy` ·
`/about` · 404. Collapsible sidebar; Ctrl/Cmd+K palette everywhere. Per-tool `<title>` and meta
description; prerender tool pages if feasible.

## 5. Tools

**Launch set:** Token Counter (OpenAI exact via tiktoken `o200k_base`/`cl100k_base`; Claude/Gemini
≈ estimate via `tokenEstimateFactor`; token visualization; worker) · LLM Cost Calculator (input /
output / cached tokens, requests per day/month, sortable table, cheapest highlighted, prices date +
source links) · Context Window Fit (bars per model, green/amber/red) · JWT Decoder (sensitive;
decode, dates, verify with `jose`, warnings for `alg: none` / expired / missing `exp`) · JSON
Formatter (indent, minify, sort keys, line/column errors, tree view with copy path, worker for 5 MB+)
· Data Converter (JSON ↔ YAML ↔ CSV ↔ XML; CSV delimiter/header; dot-notation flattening) · JSON →
Types (TypeScript, Pydantic v2, Go, Zod; root name; all-optional) · Regex Tester (flags g i m s u
y; highlighting; groups; replace preview; cheat sheet) · Timestamp Converter (s/ms auto-detect, ISO,
local/UTC/extra timezone via `Intl`, live now).

**More AI tools:** schema converter, chat format converter, prompt template tester, prompt diff,
text chunker, cosine similarity.

**Remaining basics:** Base64, hash, HMAC, password generator, UUID/ULID, URL encode; JSONPath, JSON
diff, SQL formatter, CSV viewer; cURL converter, HTTP status reference, query string parser, UA
parser; text diff, case converter, Markdown preview (DOMPurify), word counter, lorem ipsum,
HTML/CSS/JS beautify; cron explainer, color converter + WCAG contrast, QR code, image → Base64,
image compressor.

## 6. `llm-models.json`

`{ lastUpdated, sources: { openai, anthropic, google }, models: [{ id, provider, displayName,
contextWindow, maxOutput, inputPerMTok, outputPerMTok, cachedInputPerMTok, tokenizer,
tokenEstimateFactor }] }`. **Do not invent prices** — fill from official pricing pages, leave a
`TODO` when unknown. Validate the shape with a zod unit test.

## 7. UI/UX

Dense developer look; JetBrains Mono for I/O, Inter for UI, self-hosted. Dark by default, respects
`prefers-color-scheme` on first visit. Copy buttons with "Copied" toast. Load sample everywhere.
Inline plain-word errors. Mobile works; desktop primary. AA contrast, labels, focus states.
Shortcuts: Ctrl/Cmd+K palette, Ctrl/Cmd+Enter run, Ctrl/Cmd+Shift+C copy output, `?` shortcut list.

## 8. Phases

- **Phase 0 — Setup:** tooling, README, DECISIONS, CI. Done when dev/build/test/CI pass.
- **Phase 1 — App shell:** layout, registry + lazy routing + 404, home, shared components, palette,
  storage + urlState with tests, dummy Hello tool (removed end of Phase 2).
- **Phase 2 — Launch tools:** the launch set, each with logic tests + Playwright smoke test (load
  sample → output appears).
- **Phase 3 — v1 launch:** PWA + offline test, CSP + headers, privacy/about, SEO (meta, sitemap,
  robots, OG image), prerender if easy, Lighthouse (Perf ≥ 90, A11y ≥ 95, BP ≥ 95, SEO ≥ 95),
  deploy.
- **Phase 4 — More AI tools.** **Phase 5 — Remaining basics** (3–5 tools per release).

## 9. Out of scope for v1

Accounts/sync/backend, server-side APIs, browser extension / desktop app, i18n.

## 10. Later ideas

Tool chaining; optional bring-your-own-key exact Claude/Gemini counts; VS Code / Raycast extensions
reusing framework-free `logic.ts`; contribution guide.
