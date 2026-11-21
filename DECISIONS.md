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
