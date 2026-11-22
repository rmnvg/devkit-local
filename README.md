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

## Deploying

The build is fully static (`dist/`). `npm run build` runs Vite, then `scripts/prerender.mjs`, which
writes per-route HTML (titles, meta, Open Graph), `sitemap.xml`, `robots.txt` and `404.html`.

Set **`SITE_URL`** (e.g. `https://tools.example.com`) in the build environment so canonical URLs and
the sitemap are correct.

- **Vercel:** import the repo; `vercel.json` sets the build, clean URLs and security headers.
- **Cloudflare Pages:** build command `npm run build`, output `dist`; headers come from
  `public/_headers`.

Security headers (including the CSP) are defined once in `config/security-headers.json`; a unit test
fails if the hosting configs drift from it.

## SEO

Titles, descriptions, JSON-LD and related-tool links all come from `src/lib/seo.ts`. The live app
(`useSeo`) and the build-time prerender both use it. `npm test` fails if a tool's title is over 60
characters, its description is outside 70–160 characters, or either one is duplicated. Give new
tools a clear one-line `description` and at least four `keywords`.

## Updating model prices

Edit `src/data/llm-models.json` from the official pricing pages, update `lastUpdated`, and run
`npm test` (a zod schema validates the file). Use `null` plus a `TODO` note for unknown values;
never guess.

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
