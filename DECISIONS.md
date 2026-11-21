# Decisions log

Choices not covered by `PLAN.md`, newest last. Format: **date — decision** — reason.

- **2026-11-21 — Current toolchain majors (Vite 8, Vitest 5, ESLint 10, TS 6)** — older pins
  (Vite 6) conflict with current plugin peer deps. React stays on 18 per the plan.
- **2026-11-21 — `overrides.rollup = 4.68.7`** — the 4.68.8 tarball returns 404 on the npm
  registry. Remove the override once a newer rollup is published.
- **2026-11-21 — Playwright runs against `vite preview` of the production build** — the smoke
  tests then also cover lazy chunks and (later) the service worker.
