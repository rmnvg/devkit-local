// @vitest-environment node
import { readFileSync } from 'node:fs';
import headers from '../../config/security-headers.json';

/** Hosting configs must carry exactly the headers in config/security-headers.json. */
describe('security headers', () => {
  it('CSP blocks third-party connections and inline scripts', () => {
    const csp = headers['Content-Security-Policy'];
    expect(csp).toContain("connect-src 'self'");
    expect(csp).toContain("script-src 'self'");
    expect(csp).not.toMatch(/script-src[^;]*unsafe-inline/);
    expect(csp).not.toMatch(/https?:/);
  });
  it('vercel.json matches', () => {
    const v = JSON.parse(readFileSync('vercel.json', 'utf8')) as { headers: { source: string; headers: { key: string; value: string }[] }[] };
    const all = v.headers.find((h) => h.source === '/(.*)')!.headers;
    expect(Object.fromEntries(all.map((h) => [h.key, h.value]))).toEqual(headers);
  });
  it('Cloudflare _headers matches', () => {
    const text = readFileSync('public/_headers', 'utf8');
    for (const [k, v] of Object.entries(headers)) expect(text).toContain(`  ${k}: ${v}`);
  });
});
