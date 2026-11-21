# devkit-local

**The dev toolbox for AI engineers.** Token counting, LLM cost comparison, context-window fit and
schema conversion, alongside everyday basics (JWT, JSON, regex, timestamps).

## Privacy promise

Everything runs in your browser. No input you type or paste is ever sent to a server. This is
enforced with a strict Content-Security-Policy (`connect-src 'self'`), not just claimed. There are
no analytics or third-party scripts. Fonts are self-hosted. Share links put state in the URL
**hash**, which browsers never send to servers.

## Running

```bash
npm install
npm run dev          # dev server
npm run build        # production build to dist/
npm run preview      # serve the build
npm test             # unit tests (Vitest)
npm run test:e2e     # Playwright smoke tests (builds first)
npm run lint && npm run typecheck
```

## Adding a tool

1. Create `src/tools/<slug>/` with:
   - `logic.ts` — pure functions, no React. Return errors as values (`{ ok: false, error }`).
   - `logic.test.ts` — normal input, edge cases, bad input.
   - `<Name>.tsx` — UI (default export) built with `ToolShell`; include a sample input.
   - `index.ts` — `ToolMeta` export (slug, name, description, category, keywords, lazy component).
2. Add it to the list in `src/lib/registry.ts`. Set `sensitive: true` if it handles secrets.
3. Add the slug and an expected-output pattern to `TOOLS` in `e2e/tools.spec.ts`.
4. Check: no network calls, lazy-loaded, works offline, copy buttons work, errors are friendly.

Every dependency must work fully offline and must not make network calls.

See `PLAN.md` for the full spec and `DECISIONS.md` for choices made during the build.
