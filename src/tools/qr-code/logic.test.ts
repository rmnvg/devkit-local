// @vitest-environment node
import { qrSvg, wifiPayload, hexColor } from './logic';

const o = { ecc: 'M' as const, margin: 2, dark: '#000000', light: '#ffffff' };

describe('qr', () => {
  it('renders an SVG', async () => {
    const r = await qrSvg('https://example.com', o);
    expect(r.ok && r.value).toMatch(/^<svg[\s\S]*<\/svg>\s*$/);
    expect(r.ok && r.value).toContain('#000000');
  });
  it('errors on empty and oversize input', async () => {
    expect(await qrSvg('', o)).toMatchObject({ ok: false });
    expect(await qrSvg('x'.repeat(5000), { ...o, ecc: 'H' })).toMatchObject({ ok: false, error: /Too much data/ });
  });
  it('builds Wi-Fi payloads with escaping', () => {
    expect(wifiPayload('Cafe;Guest', 'p:ss', 'WPA', false)).toBe('WIFI:T:WPA;S:Cafe\\;Guest;P:p\\:ss;;');
    expect(wifiPayload('a\\b', 'x', 'WEP', false)).toBe('WIFI:T:WEP;S:a\\\\b;P:x;;');
    expect(wifiPayload('Open', '', 'nopass', true)).toBe('WIFI:T:nopass;S:Open;H:true;;');
  });
  it('validates colors', () => {
    expect(hexColor('#123abc')).toBe(true);
    expect(hexColor('red')).toBe(false);
  });
});
