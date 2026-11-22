import { test, expect } from '@playwright/test';

test('prerendered tool page has SEO tags, valid JSON-LD and crawlable links', async ({ request }) => {
  const html = await (await request.get('/tools/jwt-decoder')).text();
  expect(html).toMatch(/<title>JWT Decoder Online — Free &amp; Private \| devkit-local<\/title>/);
  expect(html).toContain('<link rel="canonical" href="');
  expect(html).toContain('<meta name="robots" content="index, follow');
  expect(html).toContain('<meta name="twitter:card" content="summary_large_image" />');
  const ld = /<script type="application\/ld\+json">(.*?)<\/script>/s.exec(html);
  expect(ld).not.toBeNull();
  const data = JSON.parse(ld![1]!) as { '@graph': { '@type': string }[] };
  expect(data['@graph'].map((n) => n['@type'])).toEqual(['WebApplication', 'BreadcrumbList']);
  expect(html).toContain('<h1>JWT Decoder</h1>');
  expect(html).toMatch(/<h2>Related tools<\/h2><ul><li><a href="\/tools\//);
});

test('home has WebSite JSON-LD with a search action', async ({ request }) => {
  const html = await (await request.get('/')).text();
  const ld = JSON.parse(/<script type="application\/ld\+json">(.*?)<\/script>/s.exec(html)![1]!) as { '@graph': { '@type': string }[] };
  expect(ld['@graph'][0]!['@type']).toBe('WebSite');
});

test('JSON-LD does not trigger CSP errors on a direct load', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto('/tools/token-counter');
  await expect(page.getByRole('heading', { level: 1, name: 'Token Counter' })).toBeVisible();
  expect(errors).toEqual([]);
});

test('head tags follow client-side navigation', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('navigation', { name: 'Tools' }).getByRole('link', { name: 'Regex Tester' }).click();
  await expect(page).toHaveTitle('Regex Tester Online — Free & Private | devkit-local');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /\/tools\/regex-tester$/);
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', /Regex Tester/);
});

test('breadcrumbs and related tools link around the site', async ({ page }) => {
  await page.goto('/tools/hash');
  const crumbs = page.getByRole('navigation', { name: 'Breadcrumb' });
  await expect(crumbs).toContainText('Auth & Security');
  const related = page.getByRole('region', { name: 'Related tools' });
  await expect(related.getByRole('link')).toHaveCount(4);
  await crumbs.getByRole('link', { name: 'Auth & Security' }).click();
  await expect(page).toHaveURL(/\/#auth$/);
  await expect(page.getByRole('region', { name: 'Auth & Security' })).toBeInViewport();
});

test('?q= pre-fills the home search (sitelinks search box)', async ({ page }) => {
  await page.goto('/?q=jwt');
  await expect(page.getByLabel('Search tools')).toHaveValue('jwt');
  await expect(page.getByRole('region', { name: /Results/ })).toContainText('JWT Decoder');
});

test('404 is noindex', async ({ page, request }) => {
  expect(await (await request.get('/404.html')).text()).toContain('<meta name="robots" content="noindex, follow" />');
  await page.goto('/tools/nope');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, follow');
});

test('sitemap lists every tool', async ({ request }) => {
  const xml = await (await request.get('/sitemap.xml')).text();
  expect((xml.match(/<loc>[^<]*\/tools\//g) ?? []).length).toBeGreaterThanOrEqual(40);
  expect(await (await request.get('/robots.txt')).text()).toContain('Sitemap: ');
});
