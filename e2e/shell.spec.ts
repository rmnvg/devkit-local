import { test, expect } from '@playwright/test';

test('home renders categories and search', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('dev toolbox');
  await page.getByLabel('Search tools').fill('zzzzqqq');
  await expect(page.getByText(/No tools match/)).toBeVisible();
});

test('navigate to a tool from home, sidebar and palette', async ({ page }) => {
  await page.goto('/');
  const firstCard = page.locator('main a[href^="/tools/"]').first();
  const href = await firstCard.getAttribute('href');
  await firstCard.click();
  await expect(page).toHaveURL(href!);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

  await page.goto('/');
  await page.getByRole('navigation', { name: 'Tools' }).locator(`a[href="${href}"]`).click();
  await expect(page).toHaveURL(href!);

  await page.goto('/');
  const name = await page.getByRole('navigation', { name: 'Tools' }).locator(`a[href="${href}"]`).innerText();
  await page.keyboard.press('ControlOrMeta+k');
  await page.getByPlaceholder('Search tools…').last().fill(name.replace(/new$/i, '').trim());
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(href!);
});

test('favorites and recents persist after reload', async ({ page }) => {
  await page.goto('/tools/hello');
  await page.getByRole('button', { name: 'Add to favorites' }).click();
  await page.goto('/');
  await page.reload();
  await expect(page.getByRole('region', { name: 'Favorites' }).getByText('Hello')).toBeVisible();
  await expect(page.getByRole('region', { name: 'Recent' }).getByText('Hello')).toBeVisible();
});

test('unknown tool shows 404', async ({ page }) => {
  await page.goto('/tools/does-not-exist');
  await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
  await page.goto('/nope');
  await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
});

test('shortcut help opens with ?', async ({ page }) => {
  await page.goto('/');
  await page.locator('body').click();
  await page.keyboard.press('?');
  await expect(page.getByRole('heading', { name: 'Keyboard shortcuts' })).toBeVisible();
});

test('theme toggle persists', async ({ page }) => {
  await page.goto('/');
  const html = page.locator('html');
  const wasDark = (await html.getAttribute('class'))?.includes('dark');
  await page.getByRole('button', { name: /Switch to/ }).click();
  await page.reload();
  await expect(html).toHaveClass(wasDark ? /^(?!.*dark)/ : /dark/);
});
