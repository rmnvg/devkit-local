import { test, expect } from '@playwright/test';

test('works offline after the first visit', async ({ page, context }) => {
  await page.goto('/');
  // wait for the service worker to install, precache everything and take control
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) {
      await new Promise<void>((r) => navigator.serviceWorker.addEventListener('controllerchange', () => r(), { once: true }));
    }
  });
  await context.setOffline(true);

  await page.goto('/tools/token-counter');
  await page.getByRole('button', { name: 'Load sample' }).click();
  await expect(page.getByTestId('output')).toHaveText(/^[1-9]/, { timeout: 15_000 });

  await page.goto('/tools/json-formatter');
  await page.getByRole('button', { name: 'Load sample' }).click();
  await expect(page.getByTestId('output')).toContainText('"devkit-local"');
  await context.setOffline(false);
});

test('manifest is valid', async ({ request }) => {
  const m = await (await request.get('/manifest.webmanifest')).json();
  expect(m.short_name).toBe('devkit-local');
  expect(m.icons.some((i: { sizes: string }) => i.sizes === '512x512')).toBe(true);
});
