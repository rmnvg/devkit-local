import { test, expect } from '@playwright/test';

/** Smoke test: every tool loads, "Load sample" produces the expected output. Add new tools here. */
const TOOLS: { slug: string; expect: RegExp }[] = [
  { slug: 'token-counter', expect: /^[1-9][\d,]*$/ },
  { slug: 'llm-cost', expect: /cheapest/i },
  { slug: 'context-fit', expect: /\d+\.\d%/ },
  { slug: 'schema-converter', expect: /"type": "function"/ },
  { slug: 'chat-format', expect: /"tool_use_id": "call_abc123"/ },
  { slug: 'prompt-template', expect: /You are Nova, a support assistant for Acme Cloud/ },
  { slug: 'prompt-diff', expect: /^\+\d+ \(\+[\d.]+%\)$/ },
  { slug: 'text-chunker', expect: /^[2-9]\d*$/ },
  { slug: 'cosine-similarity', expect: /^-?0\.\d+$/ },
  { slug: 'jwt-decoder', expect: /Ada Lovelace/ },
  { slug: 'base64', expect: /^SGVsbG8sIGRldmtpdC1sb2NhbCEg8J\+Ri/ },
  { slug: 'hash', expect: /9e107d9d372bb6826bd81d3542a419d6/ },
  { slug: 'hmac', expect: /^[0-9a-f]{64}$/ },
  { slug: 'password', expect: /^(\S{20}\n){4}\S{20}$/ },
  { slug: 'uuid', expect: /^([0-9a-f-]{36}\n){4}[0-9a-f-]{36}$/ },
  { slug: 'url-encode', expect: /https%3A%2F%2Fexample\.com/ },
  { slug: 'json-formatter', expect: /"name": "devkit-local"/ },
  { slug: 'data-converter', expect: /address\.city/ },
  { slug: 'json-to-types', expect: /export interface ChatCompletion/ },
  { slug: 'jsonpath', expect: /Sayings of the Century[\s\S]*Moby Dick/ },
  { slug: 'json-diff', expect: /\$\.settings\.locale/ },
  { slug: 'sql-formatter', expect: /^SELECT\n {2}u\.id,/ },
  { slug: 'csv-viewer', expect: /Claude Sonnet 5\.5/ },
  { slug: 'regex-tester', expect: /ada\.lovelace@example\.com/ },
  { slug: 'timestamp', expect: /2026-11-1\d/ },
];

for (const { slug, expect: pattern } of TOOLS) {
  test(`tool ${slug}: load sample shows output`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    await page.goto(`/tools/${slug}`);
    await page.getByRole('button', { name: 'Load sample' }).click();
    await expect(page.getByTestId('output').first()).toHaveText(pattern, { timeout: 15_000 });
    expect(errors, errors.join("\n")).toEqual([]);
  });
}

test('jwt sample verifies signature', async ({ page }) => {
  await page.goto('/tools/jwt-decoder');
  await page.getByRole('button', { name: 'Load sample' }).click();
  await expect(page.getByText('Signature verified (HS256)')).toBeVisible();
});

test('token counter hands off to cost calculator', async ({ page }) => {
  await page.goto('/tools/token-counter');
  await page.getByRole('button', { name: 'Load sample' }).click();
  await expect(page.getByTestId('output')).toHaveText(/^[1-9]/);
  const count = (await page.getByTestId('output').innerText()).replace(/,/g, '');
  await page.getByRole('button', { name: /Send to cost calculator/ }).click();
  await expect(page).toHaveURL(/\/tools\/llm-cost$/);
  await expect(page.getByLabel('Input tokens / request')).toHaveValue(count);
});

test('regex timeout protects the page', async ({ page }) => {
  await page.goto('/tools/regex-tester');
  await page.getByRole('textbox', { name: 'Test text' }).fill('a'.repeat(40) + '!');
  await page.getByLabel('Pattern').fill('(a+)+$');
  await expect(page.getByText(/took too long/)).toBeVisible({ timeout: 10_000 });
  await page.getByLabel('Pattern').fill('a+');
  await expect(page.getByTestId('output')).toContainText('#1');
});

test('json formatter shows error position', async ({ page }) => {
  await page.goto('/tools/json-formatter');
  await page.locator('.cm-content').fill('{"a": 1,}');
  await expect(page.getByRole('alert')).toContainText('line 1, column 9');
});
