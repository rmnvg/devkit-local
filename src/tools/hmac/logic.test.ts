// @vitest-environment node
import { computeHmac, keyBytes, verify } from './logic';

describe('hmac', () => {
  it('matches RFC 4231 test case 2', async () => {
    const r = await computeHmac('SHA-256', 'Jefe', 'utf8', 'what do ya want for nothing?');
    expect(r.ok && r.value.hex).toBe('5bdcc146bf60754e6a042426089575c75a003f089d2739839dec58b964ec3843');
  });
  it('supports hex and base64 keys', async () => {
    const a = await computeHmac('SHA-1', '4a656665', 'hex', 'msg');
    const b = await computeHmac('SHA-1', 'SmVmZQ==', 'base64', 'msg');
    const c = await computeHmac('SHA-1', 'Jefe', 'utf8', 'msg');
    expect(a.ok && b.ok && c.ok && a.value.hex === b.value.hex && b.value.hex === c.value.hex).toBe(true);
  });
  it('verifies in any encoding, with GitHub-style prefix', async () => {
    const r = await computeHmac('SHA-256', 'Jefe', 'utf8', 'what do ya want for nothing?');
    if (!r.ok) throw new Error();
    expect(verify('sha256=' + r.value.hex.toUpperCase(), r.value)).toBe(true);
    expect(verify(r.value.base64, r.value)).toBe(true);
    expect(verify(r.value.base64url, r.value)).toBe(true);
    expect(verify('abc', r.value)).toBe(false);
    expect(verify('', r.value)).toBe(false);
  });
  it('rejects bad keys', async () => {
    expect(keyBytes('xyz', 'hex')).toMatchObject({ ok: false, error: /Invalid hex/ });
    expect(await computeHmac('SHA-256', '', 'utf8', 'm')).toMatchObject({ ok: false, error: /secret key/ });
  });
});
