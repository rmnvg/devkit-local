// Post-build: writes per-route HTML (title, meta, Open Graph, canonical, static content),
// sitemap.xml, robots.txt and 404.html. React replaces the static content on load.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { runnerImport } from 'vite';

const DIST = 'dist';
const SITE_URL = (process.env.SITE_URL || 'https://devkit-local.example').replace(/\/$/, '');
if (!process.env.SITE_URL) console.warn('[prerender] SITE_URL not set; using placeholder', SITE_URL);

const alias = { '@': path.resolve('src') };
const { module: registry } = await runnerImport('/src/lib/registry.ts', { configFile: false, resolve: { alias }, logLevel: 'error' });
const { module: types } = await runnerImport('/src/lib/types.ts', { configFile: false, resolve: { alias }, logLevel: 'error' });

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const template = readFileSync(path.join(DIST, 'index.html'), 'utf8');
const SITE = 'devkit-local';
const HOME_DESC = 'The dev toolbox for AI engineers: token counter, LLM cost calculator, context window fit, JWT, JSON, regex and more. Everything runs locally in your browser.';

function page({ route, title, description, body }) {
  const url = SITE_URL + (route === '/' ? '/' : route);
  const head = [
    `<title>${esc(title)}</title>`,
    `<meta name="description" content="${esc(description)}" />`,
    `<link rel="canonical" href="${url}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="${SITE}" />`,
    `<meta property="og:title" content="${esc(title)}" />`,
    `<meta property="og:description" content="${esc(description)}" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:image" content="${SITE_URL}/og.png" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
  ].join('\n    ');
  return template
    .replace(/<title>[\s\S]*?<\/title>/, '')
    .replace(/<meta name="description"[^>]*>/, '')
    .replace('</head>', `    ${head}\n  </head>`)
    .replace('<div id="root"></div>', `<div id="root"><main style="max-width:60rem;margin:0 auto;padding:2rem 1rem;font-family:system-ui,sans-serif">${body}</main></div>`);
}

function write(file, html) {
  const out = path.join(DIST, file);
  mkdirSync(path.dirname(out), { recursive: true });
  writeFileSync(out, html);
}

const tools = registry.tools;
const routes = [];

const list = types.CATEGORIES.map((c) => {
  const items = tools.filter((t) => t.category === c.id);
  if (!items.length) return '';
  return `<h2>${esc(c.label)}</h2><ul>${items.map((t) => `<li><a href="/tools/${t.slug}">${esc(t.name)}</a> — ${esc(t.description)}</li>`).join('')}</ul>`;
}).join('');

write('index.html', page({ route: '/', title: `${SITE} — the dev toolbox for AI engineers`, description: HOME_DESC, body: `<h1>The dev toolbox for AI engineers</h1><p>${esc(HOME_DESC)}</p>${list}` }));
routes.push('/');

for (const t of tools) {
  write(`tools/${t.slug}.html`, page({
    route: `/tools/${t.slug}`,
    title: `${t.name} — ${SITE}`,
    description: t.description,
    body: `<h1>${esc(t.name)}</h1><p>${esc(t.description)}</p><p>Runs locally in your browser. Nothing you paste is sent to a server.</p><p><a href="/">All tools</a></p>`,
  }));
  routes.push(`/tools/${t.slug}`);
}

const PAGES = [
  ['/privacy', 'Privacy', 'How devkit-local keeps your data private: everything runs in your browser, enforced by a strict Content-Security-Policy.'],
  ['/about', 'About', 'About devkit-local, an offline-capable developer toolbox for AI engineers.'],
];
for (const [route, name, description] of PAGES) {
  write(`${route.slice(1)}.html`, page({ route, title: `${name} — ${SITE}`, description, body: `<h1>${name}</h1><p>${esc(description)}</p>` }));
  routes.push(route);
}

write('404.html', page({ route: '/404', title: `Not found — ${SITE}`, description: 'Page not found.', body: '<h1>Page not found</h1><p><a href="/">All tools</a></p>' }).replace(/<link rel="canonical"[^>]*>\n\s*/, ''));

const today = new Date().toISOString().slice(0, 10);
writeFileSync(path.join(DIST, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes.map((r) => `  <url><loc>${SITE_URL}${r}</loc><lastmod>${today}</lastmod></url>`).join('\n')}
</urlset>
`);
writeFileSync(path.join(DIST, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`);
console.log(`[prerender] ${routes.length} routes, sitemap, robots.txt, 404.html`);
