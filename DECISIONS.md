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
