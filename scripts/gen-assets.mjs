// One-off: renders PWA icons and the Open Graph image with Playwright's Chromium.
// Run: node scripts/gen-assets.mjs  (outputs are committed in public/)
import { chromium } from '@playwright/test';
import { readFileSync } from 'node:fs';

const svg = readFileSync('public/icons/icon.svg', 'utf8');
const b = await chromium.launch();
const page = await b.newPage();

async function icon(size, file, padding = 0) {
  await page.setViewportSize({ width: size, height: size });
  const inner = size - padding * 2;
  await page.setContent(`<html><body style="margin:0;background:#0b0f17;display:grid;place-items:center;height:${size}px">
    <div style="width:${inner}px;height:${inner}px">${svg.replace('<svg ', `<svg width="${inner}" height="${inner}" `)}</div></body></html>`);
  await page.screenshot({ path: file, omitBackground: false });
}
await icon(192, 'public/icons/icon-192.png');
await icon(512, 'public/icons/icon-512.png');
await icon(512, 'public/icons/icon-maskable-512.png', 64);
await icon(180, 'public/icons/apple-touch-icon.png');

await page.setViewportSize({ width: 1200, height: 630 });
await page.setContent(`<html><body style="margin:0;width:1200px;height:630px;background:linear-gradient(135deg,#0b0f17,#0c2340);color:#e2e8f0;font-family:system-ui,sans-serif;display:flex;flex-direction:column;justify-content:center;padding:0 90px;box-sizing:border-box">
  <div style="display:flex;align-items:center;gap:24px">${svg.replace('<svg ', '<svg width="96" height="96" ')}<span style="font-size:56px;font-weight:700">devkit-local</span></div>
  <div style="font-size:64px;font-weight:700;margin-top:40px;line-height:1.1">The dev toolbox for AI engineers</div>
  <div style="font-size:30px;margin-top:28px;color:#94a3b8">Token counter · LLM cost calculator · JWT · JSON · Regex — 100% in your browser</div>
</body></html>`);
await page.screenshot({ path: 'public/og.png' });
await b.close();
console.log('done');
