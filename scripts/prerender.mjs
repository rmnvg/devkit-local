// Post-build SEO: writes per-route HTML (title, description, canonical, Open Graph, Twitter,
// JSON-LD structured data, crawlable static content and internal links), plus sitemap.xml,
// robots.txt and 404.html. React replaces the static body content when the app loads.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { runnerImport } from 'vite';

const DIST = 'dist';
const SITE_URL = (process.env.SITE_URL || 'https://devkit-local.example').replace(/\/$/, '');
if (!process.env.SITE_URL) console.warn('[prerender] SITE_URL not set; using placeholder', SITE_URL);

const opts = { configFile: false, resolve: { alias: { '@': path.resolve('src') } }, logLevel: 'error' };
const { module: registry } = await runnerImport('/src/lib/registry.ts', opts);
const { module: seo } = await runnerImport('/src/lib/seo.ts', opts);

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const template = readFileSync(path.join(DIST, 'index.html'), 'utf8');
const tools = registry.tools;

function page({ path: route, title, description, noindex, jsonLd, body }) {
  const url = SITE_URL + route;
  const head = [
    `<title>${esc(title)}</title>`,
    `<meta name="description" content="${esc(description)}" />`,
    `<meta name="robots" content="${noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large'}" />`,
    noindex ? '' : `<link rel="canonical" href="${url}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="${seo.SITE_NAME}" />`,
    `<meta property="og:locale" content="en_US" />`,
    `<meta property="og:title" content="${esc(title)}" />`,
    `<meta property="og:description" content="${esc(description)}" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:image" content="${SITE_URL}/og.png" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta property="og:image:alt" content="devkit-local — the dev toolbox for AI engineers" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(title)}" />`,
    `<meta name="twitter:description" content="${esc(description)}" />`,
    `<meta name="twitter:image" content="${SITE_URL}/og.png" />`,
    // JSON-LD is a data block, not executable script, so the CSP does not block it.
    jsonLd ? `<script type="application/ld+json">${seo.jsonLdScript(jsonLd)}</script>` : '',
  ].filter(Boolean).join('\n    ');
  return template
    .replace(/<title>[\s\S]*?<\/title>/, '')
    .replace(/<meta name="description"[^>]*>/, '')
    .replace('</head>', `    ${head}\n  </head>`)
    .replace('<div id="root"></div>', `<div id="root"><main style="max-width:60rem;margin:0 auto;padding:2rem 1rem;font-family:system-ui,sans-serif;line-height:1.6">${body}</main></div>`);
}

function write(file, html) {
  const out = path.join(DIST, file);
  mkdirSync(path.dirname(out), { recursive: true });
  writeFileSync(out, html);
}

const toolLink = (t) => `<a href="${seo.toolPath(t)}">${esc(t.name)}</a>`;
const routes = [];

// ---- home ----
const sections = seo.CATEGORIES.map((c) => {
  const items = tools.filter((t) => t.category === c.id);
  if (!items.length) return '';
  return `<section id="${c.id}"><h2>${esc(c.label)}</h2><ul>${items.map((t) => `<li>${toolLink(t)} — ${esc(t.description)}</li>`).join('')}</ul></section>`;
}).join('');
write('index.html', page({
  ...seo.HOME_SEO,
  jsonLd: seo.websiteJsonLd(SITE_URL, tools),
  body: `<h1>The dev toolbox for AI engineers</h1><p>${esc(seo.HOME_SEO.description)}</p><p>Every tool runs locally in your browser and works offline after the first visit. No accounts, no uploads, no tracking.</p>${sections}`,
}));
routes.push({ path: '/', priority: '1.0' });

// ---- tools ----
for (const t of tools) {
  const related = seo.relatedTools(t, tools);
  const body = [
    `<nav aria-label="Breadcrumb"><a href="/">All tools</a> › <a href="/#${t.category}">${esc(seo.categoryName(t.category))}</a> › ${esc(t.name)}</nav>`,
    `<h1>${esc(t.name)}</h1>`,
    `<p>${esc(t.description)}</p>`,
    `<h2>Free, private and offline</h2>`,
    `<p>${esc(t.name)} runs entirely in your browser. Nothing you paste or upload is sent to a server, it needs no account, and it keeps working without an internet connection once the page has loaded.</p>`,
    `<p>Useful for: ${t.keywords.map(esc).join(', ')}.</p>`,
    related.length ? `<h2>Related tools</h2><ul>${related.map((r) => `<li>${toolLink(r)} — ${esc(r.description)}</li>`).join('')}</ul>` : '',
    `<p><a href="/">Browse all ${tools.length} developer tools</a></p>`,
  ].join('');
  write(`tools/${t.slug}.html`, page({
    path: seo.toolPath(t),
    title: seo.toolTitle(t),
    description: seo.toolDescription(t),
    jsonLd: seo.toolJsonLd(SITE_URL, t),
    body,
  }));
  routes.push({ path: seo.toolPath(t), priority: t.category === 'ai' ? '0.9' : '0.8' });
}

// ---- static pages ----
for (const key of ['privacy', 'about']) {
  const p = seo.STATIC_PAGES[key];
  write(`${key}.html`, page({ ...p, body: `<h1>${esc(p.title.split(' | ')[0].split(' — ')[0])}</h1><p>${esc(p.description)}</p><p><a href="/">All tools</a></p>` }));
  routes.push({ path: p.path, priority: '0.3' });
}
write('404.html', page({ ...seo.STATIC_PAGES.notFound, body: '<h1>Page not found</h1><p><a href="/">All tools</a></p>' }));

// ---- sitemap & robots ----
const today = new Date().toISOString().slice(0, 10);
writeFileSync(path.join(DIST, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes.map((r) => `  <url><loc>${SITE_URL}${r.path}</loc><lastmod>${today}</lastmod><priority>${r.priority}</priority></url>`).join('\n')}
</urlset>
`);
writeFileSync(path.join(DIST, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`);
console.log(`[prerender] ${routes.length} routes with JSON-LD, sitemap.xml, robots.txt, 404.html`);
