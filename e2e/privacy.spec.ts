import { test, expect } from '@playwright/test';

const SLUGS = ['token-counter', 'llm-cost', 'context-fit', 'schema-converter', 'chat-format', 'prompt-template', 'prompt-diff', 'text-chunker', 'cosine-similarity', 'jwt-decoder', 'base64', 'hash', 'hmac', 'password', 'uuid', 'url-encode', 'json-formatter', 'data-converter', 'json-to-types', 'jsonpath', 'json-diff', 'sql-formatter', 'csv-viewer', 'curl-converter', 'http-status', 'query-string', 'user-agent', 'regex-tester', 'text-diff', 'case-converter', 'word-counter', 'lorem-ipsum', 'timestamp'];

test('CSP header is served', async ({ request }) => {
  const res = await request.get('/');
  expect(res.headers()['content-security-policy']).toContain("connect-src 'self'");
});

test('using every tool makes no requests to other origins', async ({ page, baseURL }) => {
  const origin = new URL(baseURL!).origin;
  const external: string[] = [];
  const violations: string[] = [];
  page.on('request', (r) => {
    const u = r.url();
    if (!u.startsWith(origin) && !u.startsWith('data:') && !u.startsWith('blob:')) external.push(u);
  });
  page.on('console', (m) => /Content Security Policy|Refused to/i.test(m.text()) && violations.push(m.text()));
  for (const slug of SLUGS) {
    await page.goto(`/tools/${slug}`);
    await page.getByRole('button', { name: 'Load sample' }).click();
    await expect(page.getByTestId('output').first()).not.toBeEmpty();
    await page.waitForTimeout(300);
  }
  expect(external).toEqual([]);
  expect(violations).toEqual([]);
});

test('prerendered tool pages carry title and description', async ({ request }) => {
  const html = await (await request.get('/tools/jwt-decoder')).text();
  expect(html).toContain('<title>JWT Decoder — devkit-local</title>');
  expect(html).toContain('<meta property="og:title"');
});

test('privacy page shows the policy', async ({ page }) => {
  await page.goto('/privacy');
  await expect(page.getByRole('heading', { name: 'The exact policy' })).toBeVisible();
  await expect(page.locator('pre')).toContainText("connect-src 'self'");
});
