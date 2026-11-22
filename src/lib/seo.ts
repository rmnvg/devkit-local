/**
 * SEO helpers shared by the live app (useSeo) and the build-time prerender
 * (scripts/prerender.mjs). Pure functions only, so both environments can use them.
 */
import { CATEGORIES, categoryLabel, type ToolCategory, type ToolMeta } from './types';

export const SITE_NAME = 'devkit-local';
export const MAX_TITLE = 60;
export const MAX_DESCRIPTION = 160;

/** Just the fields SEO needs, so callers don't need the lazy component. */
export type SeoTool = Pick<ToolMeta, 'slug' | 'name' | 'description' | 'category' | 'keywords'>;

export interface PageSeo {
  path: string;
  title: string;
  description: string;
  noindex?: boolean;
}

export const HOME_SEO: PageSeo = {
  path: '/',
  title: 'Private Developer Tools for AI Engineers | devkit-local',
  description:
    'Free token counter, LLM cost calculator, JWT decoder, JSON formatter, regex tester and 40+ developer tools. Runs 100% in your browser — nothing is uploaded.',
};

export const STATIC_PAGES: Record<'privacy' | 'about' | 'notFound', PageSeo> = {
  privacy: {
    path: '/privacy',
    title: 'Privacy — Nothing Leaves Your Browser | devkit-local',
    description:
      'Every devkit-local tool runs in your browser, enforced by a strict Content-Security-Policy. No accounts, no analytics, no uploads.',
  },
  about: {
    path: '/about',
    title: 'About devkit-local — Offline Dev Toolbox for AI Engineers',
    description:
      'A fast, installable, offline toolbox for developers who build with LLMs: token counting, cost comparison, schema conversion and everyday dev tools.',
  },
  notFound: { path: '/404', title: 'Page not found | devkit-local', description: 'This page does not exist.', noindex: true },
};

/** Pick the most descriptive candidate that fits in `max` characters. */
function firstThatFits(candidates: string[], max: number): string {
  return candidates.find((c) => c.length <= max) ?? candidates[candidates.length - 1]!;
}

export function toolTitle(t: SeoTool): string {
  return firstThatFits(
    [
      `${t.name} Online — Free & Private | ${SITE_NAME}`,
      `${t.name} — Free & Private | ${SITE_NAME}`,
      `${t.name} — Free Online Tool | ${SITE_NAME}`,
      `${t.name} | ${SITE_NAME}`,
      t.name,
    ],
    MAX_TITLE,
  );
}

export function toolDescription(t: SeoTool): string {
  const d = t.description.trim().replace(/\.?$/, '.');
  return firstThatFits(
    [
      `${d} Free, no sign-up, and 100% private — runs in your browser.`,
      `${d} Free and private — runs in your browser.`,
      `${d} Runs in your browser.`,
      d.length <= MAX_DESCRIPTION ? d : d.slice(0, MAX_DESCRIPTION - 1).replace(/\s+\S*$/, '') + '…',
    ],
    MAX_DESCRIPTION,
  );
}

export function toolPath(t: Pick<SeoTool, 'slug'>): string {
  return `/tools/${t.slug}`;
}

/** Related tools for internal linking: same category first, then by shared keywords. */
export function relatedTools<T extends SeoTool>(t: SeoTool, all: T[], n = 4): T[] {
  const words = new Set(t.keywords.map((k) => k.toLowerCase()));
  const score = (o: SeoTool) => (o.category === t.category ? 10 : 0) + o.keywords.filter((k) => words.has(k.toLowerCase())).length;
  return all
    .filter((o) => o.slug !== t.slug)
    .map((o, i) => ({ o, s: score(o), i }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s || a.i - b.i)
    .slice(0, n)
    .map((x) => x.o);
}

export function categoryName(c: ToolCategory): string {
  return categoryLabel(c);
}

// ---------------- structured data (schema.org JSON-LD) ----------------
type Json = Record<string, unknown>;

export function websiteJsonLd(siteUrl: string, tools: SeoTool[]): Json {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${siteUrl}/#website`,
        name: SITE_NAME,
        url: `${siteUrl}/`,
        description: HOME_SEO.description,
        inLanguage: 'en',
        potentialAction: {
          '@type': 'SearchAction',
          target: { '@type': 'EntryPoint', urlTemplate: `${siteUrl}/?q={search_term_string}` },
          'query-input': 'required name=search_term_string',
        },
      },
      {
        '@type': 'ItemList',
        name: 'Developer tools',
        itemListElement: tools.map((t, i) => ({ '@type': 'ListItem', position: i + 1, name: t.name, url: `${siteUrl}${toolPath(t)}` })),
      },
    ],
  };
}

export function toolJsonLd(siteUrl: string, t: SeoTool): Json {
  const url = `${siteUrl}${toolPath(t)}`;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebApplication',
        '@id': `${url}#app`,
        name: t.name,
        description: t.description,
        url,
        applicationCategory: 'DeveloperApplication',
        applicationSubCategory: categoryLabel(t.category),
        operatingSystem: 'Any (runs in a web browser)',
        browserRequirements: 'Requires JavaScript. Works offline after the first visit.',
        isAccessibleForFree: true,
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        keywords: t.keywords.join(', '),
        isPartOf: { '@id': `${siteUrl}/#website` },
      },
      breadcrumbJsonLd(siteUrl, [
        { name: SITE_NAME, path: '/' },
        { name: categoryLabel(t.category), path: `/#${t.category}` },
        { name: t.name, path: toolPath(t) },
      ]),
    ],
  };
}

export function breadcrumbJsonLd(siteUrl: string, items: { name: string; path: string }[]): Json {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: `${siteUrl}${it.path}` })),
  };
}

/** Serialize JSON-LD safely for embedding in a <script> tag. */
export function jsonLdScript(data: Json): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

export { CATEGORIES };
