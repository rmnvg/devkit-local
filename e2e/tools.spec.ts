import { test, expect } from '@playwright/test';

/** Smoke test: every tool loads, "Load sample" produces output. Add new tools here. */
const TOOLS: { slug: string; output?: string }[] = [{ slug: 'hello' }];

for (const { slug, output = 'output' } of TOOLS) {
  test(`tool ${slug}: load sample shows output`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(`/tools/${slug}`);
    await page.getByRole('button', { name: 'Load sample' }).click();
    await expect(page.getByTestId(output).first()).not.toBeEmpty();
    await expect(page.getByTestId(output).first()).not.toContainText(/appears here/i);
    expect(errors).toEqual([]);
  });
}
