import { tools } from './registry';
import { HOME_SEO, MAX_DESCRIPTION, MAX_TITLE, STATIC_PAGES, jsonLdScript, relatedTools, toolDescription, toolJsonLd, toolTitle, websiteJsonLd } from './seo';

const SITE = 'https://tools.example.com';

describe('SEO metadata for every tool', () => {
  const titles = tools.map(toolTitle);
  const descriptions = tools.map(toolDescription);

  it.each(tools.map((t) => [t.slug, t] as const))('%s has a good title and description', (_, t) => {
    const title = toolTitle(t);
    const desc = toolDescription(t);
    expect(title.length).toBeLessThanOrEqual(MAX_TITLE);
    expect(title).toContain(t.name);
    expect(title).toContain('devkit-local');
    expect(desc.length).toBeGreaterThanOrEqual(70);
    expect(desc.length).toBeLessThanOrEqual(MAX_DESCRIPTION);
    expect(t.keywords.length).toBeGreaterThanOrEqual(4);
  });

  it('titles and descriptions are unique', () => {
    expect(new Set(titles).size).toBe(titles.length);
    expect(new Set(descriptions).size).toBe(descriptions.length);
  });

  it('every tool links to related tools, never itself', () => {
    for (const t of tools) {
      const r = relatedTools(t, tools);
      expect(r.length, t.slug).toBeGreaterThan(0);
      expect(r.map((x) => x.slug)).not.toContain(t.slug);
    }
  });

  it('static pages fit length limits', () => {
    for (const p of [HOME_SEO, STATIC_PAGES.privacy, STATIC_PAGES.about]) {
      expect(p.title.length).toBeLessThanOrEqual(MAX_TITLE);
      expect(p.description.length).toBeLessThanOrEqual(MAX_DESCRIPTION);
    }
    expect(STATIC_PAGES.notFound.noindex).toBe(true);
  });
});

describe('title and description fallbacks', () => {
  const base = { slug: 'x', category: 'misc' as const, keywords: [] };
  it('drops suffixes to fit long names', () => {
    const t = toolTitle({ ...base, name: 'A Very Long Tool Name That Goes On And On', description: 'd' });
    expect(t.length).toBeLessThanOrEqual(MAX_TITLE);
    expect(t).toBe('A Very Long Tool Name That Goes On And On | devkit-local');
  });
  it('truncates very long descriptions on a word boundary', () => {
    const d = toolDescription({ ...base, name: 'n', description: 'word '.repeat(60) });
    expect(d.length).toBeLessThanOrEqual(MAX_DESCRIPTION);
    expect(d.endsWith('…')).toBe(true);
  });
});

describe('structured data', () => {
  it('tool JSON-LD describes a free web app with breadcrumbs', () => {
    const t = tools.find((x) => x.slug === 'jwt-decoder')!;
    const ld = toolJsonLd(SITE, t) as { '@graph': Record<string, unknown>[] };
    const app = ld['@graph'][0]!;
    expect(app).toMatchObject({ '@type': 'WebApplication', name: 'JWT Decoder', url: `${SITE}/tools/jwt-decoder`, isAccessibleForFree: true, offers: { price: '0' } });
    const crumbs = ld['@graph'][1] as { itemListElement: { name: string; item: string }[] };
    expect(crumbs.itemListElement.map((c) => c.name)).toEqual(['devkit-local', 'Auth & Security', 'JWT Decoder']);
  });
  it('website JSON-LD has a search action and every tool', () => {
    const ld = websiteJsonLd(SITE, tools) as { '@graph': [{ potentialAction: { target: { urlTemplate: string } } }, { itemListElement: unknown[] }] };
    expect(ld['@graph'][0].potentialAction.target.urlTemplate).toBe(`${SITE}/?q={search_term_string}`);
    expect(ld['@graph'][1].itemListElement).toHaveLength(tools.length);
  });
  it('escapes "<" so JSON-LD cannot close the script tag', () => {
    expect(jsonLdScript({ a: '</script><script>alert(1)</script>' })).not.toContain('</script>');
  });
});
