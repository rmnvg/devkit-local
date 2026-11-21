# Decisions log

Choices not covered by `PLAN.md`, newest last. Format: **date — decision** — reason.

- **2026-11-21 — Current toolchain majors (Vite 8, Vitest 5, ESLint 10, TS 6)** — older pins
  (Vite 6) conflict with current plugin peer deps. React stays on 18 per the plan.
- **2026-11-21 — `overrides.rollup = 4.68.7`** — the 4.68.8 tarball returns 404 on the npm
  registry. Remove the override once a newer rollup is published.
- **2026-11-21 — Playwright runs against `vite preview` of the production build** — the smoke
  tests then also cover lazy chunks and (later) the service worker.
- **2026-11-21 — Share-link format is always `#s=<lz-string compressToEncodedURIComponent>`**
  — one format is simpler than switching between raw base64url and compressed; lz output is
  URL-safe and never larger in practice for JSON state.
- **2026-11-21 — `useToolState(slug, defaults, inputKeys)`** — each tool declares which state
  keys are user input. Settings always persist; inputs only with "Remember inputs"; sensitive
  tools drop inputs from share links unless opted in. Values from links/storage are type-checked
  against defaults.
- **2026-11-21 — CodeInput uses CodeMirror only for structured languages (json/yaml/xml)** — plain
  text tools use a textarea, which is faster for very large prose (token counting) and keeps
  CodeMirror out of those chunks.
- **2026-11-21 — Theme bootstrap lives in `public/theme-init.js`** — avoids a flash of the wrong
  theme without an inline script (CSP `script-src 'self'`).
- **2026-11-21 — Fonts via `@fontsource` packages** — bundled by Vite, so they are self-hosted.
- **2026-11-21 — Context Window Fit is a standalone tool** (not a Token Counter tab) — own URL
  for search/SEO and simpler smoke tests; it reuses the same tokenizer worker. Token Counter
  links to it with the text pre-filled.
- **2026-11-21 — `llm-models.json` adds `exactTokenCount` and `notes`** — js-tiktoken only maps
  models up to `gpt-5`; newer OpenAI models use `o200k_base` but are labelled "≈ estimate".
  Unknown values are `null` with a `TODO` in `notes` (a unit test enforces this).
- **2026-11-21 — `tokenEstimateFactor`: 1.2 for Claude models on the newer tokenizer, 1.1 for
  Sonnet 4.6 / Haiku 4.5, 1.0 for Gemini** — heuristics relative to `o200k_base`, not published
  numbers. Anthropic notes its Opus 4.7+ tokenizer uses ~1.0–1.35× the tokens of the older one.
  Tune these against real API counts.
- **2026-11-21 — Monthly cost = daily × 30.**
- **2026-11-21 — Model data sources** — prices from developers.openai.com/api/docs/pricing,
  platform.claude.com/docs/en/about-claude/pricing and Google's Gemini pricing page (now served
  from aistudio.google.com/docs/pricing); context windows from each provider's per-model pages.
  Only Claude Haiku 4.5's max output remains `null`. Gemini 4 Carbon/Argon and 3.8 Flash have
  promotional prices that end 2026-11-30 / 2026-12-31 — **update the JSON after those dates**.
- **2026-11-21 — "Prerender" = build-time static HTML per route (`scripts/prerender.mjs`)** — each
  route gets its own file with title, description, canonical, Open Graph tags and a short static
  body; React replaces the body on load. No headless browser at build time. Tool metadata is
  loaded from the real registry with Vite's `runnerImport`, so nothing is duplicated.
- **2026-11-21 — Routes are written as `tools/<slug>.html`** — Vercel (`cleanUrls`) and Cloudflare
  Pages both serve them at `/tools/<slug>`; unknown URLs get `404.html` (the app shell, which shows
  the in-app 404). No SPA rewrite needed.
- **2026-11-21 — `SITE_URL` env var sets canonical/sitemap URLs** — defaults to the placeholder
  `https://devkit-local.example`; set it in the hosting project before the first deploy.
- **2026-11-21 — Security headers live in `config/security-headers.json`** — `vite preview` serves
  them so every e2e test runs under the production CSP; a unit test checks `vercel.json` and
  `public/_headers` match it.
- **2026-11-21 — `build.assetsInlineLimit: 0`** — Vite inlined small font subsets as `data:` URIs,
  which the CSP (`font-src 'self'`) blocks. Not inlining keeps the CSP strict.
- **2026-11-21 — Service worker precaches everything (≈4.8 MB, mostly tokenizer ranks)** — needed
  for the offline promise; `autoUpdate` + `clientsClaim` so new deploys take over on next load.
