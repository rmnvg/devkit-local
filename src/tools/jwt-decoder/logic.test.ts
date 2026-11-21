// @vitest-environment node
import { SignJWT, generateKeyPair, exportSPKI, exportJWK } from 'jose';
import { decodeJwt, detectKeyKind, relativeTime, verifyJwt } from './logic';
import { SAMPLE_JWT, SAMPLE_SECRET } from './samples';

const enc = (o: unknown) => Buffer.from(JSON.stringify(o)).toString('base64url');
const NOW = 1_800_000_000_000; // ms

describe('decodeJwt', () => {
  it('decodes the sample', () => {
    const r = decodeJwt(SAMPLE_JWT, NOW);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.header).toEqual({ alg: 'HS256', typ: 'JWT' });
    expect((r.value.payload as { name: string }).name).toBe('Ada Lovelace');
    expect(r.value.times.map((t) => t.claim)).toEqual(['exp', 'iat']);
    expect(r.value.expired).toBe(false);
    expect(r.value.warnings).toEqual([]);
  });
  it('strips a Bearer prefix and whitespace', () => {
    expect(decodeJwt(`  Bearer ${SAMPLE_JWT}\n`, NOW).ok).toBe(true);
  });
  it('handles unicode payloads', () => {
    const r = decodeJwt(`${enc({ alg: 'HS256' })}.${enc({ name: 'Zoë 🌍', exp: 1_900_000_000 })}.sig`, NOW);
    expect(r.ok && (r.value.payload as { name: string }).name).toBe('Zoë 🌍');
  });
  it('warns about alg none, expiry and missing exp', () => {
    const none = decodeJwt(`${enc({ alg: 'none' })}.${enc({ sub: 'x' })}.`, NOW);
    expect(none.ok && none.value.warnings.join(' ')).toMatch(/unsigned.*never expires/s);
    const expired = decodeJwt(`${enc({ alg: 'HS256' })}.${enc({ exp: 1_700_000_000 })}.x`, NOW);
    expect(expired.ok && expired.value.expired).toBe(true);
    expect(expired.ok && expired.value.warnings[0]).toMatch(/expired .* ago/);
  });
  it('warns on millisecond timestamps and non-numeric claims', () => {
    const r = decodeJwt(`${enc({ alg: 'HS256' })}.${enc({ exp: 1_900_000_000_000, iat: 'yesterday' })}.x`, NOW);
    expect(r.ok && r.value.warnings.join(' ')).toMatch(/milliseconds.*should be a number/s);
  });
  it('rejects bad input with friendly errors', () => {
    expect(decodeJwt('')).toMatchObject({ ok: false, error: /Paste/ });
    expect(decodeJwt('a.b')).toMatchObject({ ok: false, error: /3 parts/ });
    expect(decodeJwt('a.b.c.d.e')).toMatchObject({ ok: false, error: /JWE/ });
    expect(decodeJwt('!!!.b.c')).toMatchObject({ ok: false, error: /header is not valid base64url/ });
    expect(decodeJwt(`${Buffer.from('nope').toString('base64url')}.b.c`)).toMatchObject({ ok: false, error: /not valid JSON/ });
    expect(decodeJwt(`${enc([1])}.${enc({})}.c`)).toMatchObject({ ok: false, error: /JSON object/ });
  });
  it('relativeTime', () => {
    expect(relativeTime(100, 100)).toBe('now');
    expect(relativeTime(100 + 3600 * 3 + 120, 100)).toBe('in 3h 2m');
    expect(relativeTime(100, 100 + 86400 * 2)).toBe('2d ago');
  });
});

describe('verifyJwt', () => {
  it('verifies HS256 with the right secret and rejects the wrong one', async () => {
    expect(await verifyJwt(SAMPLE_JWT, SAMPLE_SECRET)).toEqual({ ok: true, value: true });
    expect(await verifyJwt(SAMPLE_JWT, 'wrong')).toMatchObject({ ok: false, error: /Invalid signature/ });
  });
  it('verifies HS256 with a base64 secret', async () => {
    const b64 = Buffer.from(SAMPLE_SECRET).toString('base64');
    expect((await verifyJwt(SAMPLE_JWT, b64, true)).ok).toBe(true);
  });
  it('verifies RS256 with PEM and JWK, and ES256 with a JWKS', async () => {
    const rs = await generateKeyPair('RS256', { extractable: true });
    const tok = await new SignJWT({ a: 1 }).setProtectedHeader({ alg: 'RS256' }).sign(rs.privateKey);
    expect((await verifyJwt(tok, await exportSPKI(rs.publicKey))).ok).toBe(true);
    expect((await verifyJwt(tok, JSON.stringify(await exportJWK(rs.publicKey)))).ok).toBe(true);

    const es = await generateKeyPair('ES256', { extractable: true });
    const tok2 = await new SignJWT({ a: 1 }).setProtectedHeader({ alg: 'ES256', kid: 'k2' }).sign(es.privateKey);
    const jwk = { ...(await exportJWK(es.publicKey)), kid: 'k2' };
    expect((await verifyJwt(tok2, JSON.stringify({ keys: [jwk] }))).ok).toBe(true);
    expect((await verifyJwt(tok2, await exportSPKI(rs.publicKey))).ok).toBe(false);
  });
  it('rejects missing key, bad JWK and alg none', async () => {
    expect(await verifyJwt(SAMPLE_JWT, '')).toMatchObject({ ok: false, error: /shared secret/ });
    expect(await verifyJwt(SAMPLE_JWT.replace(/^[^.]+/, enc({ alg: 'RS256' })), '{bad')).toMatchObject({ ok: false, error: /JWK is not valid JSON/ });
    expect((await verifyJwt(`${enc({ alg: 'none' })}.${enc({})}.`, 'x')).ok).toBe(false);
  });
  it('detects key kinds', () => {
    expect(detectKeyKind('HS256', 'secret')).toBe('secret');
    expect(detectKeyKind('RS256', '{"kty":"RSA"}')).toBe('jwk');
    expect(detectKeyKind('RS256', '-----BEGIN PUBLIC KEY-----')).toBe('spki');
    expect(detectKeyKind('RS256', '-----BEGIN CERTIFICATE-----')).toBe('x509');
  });
});
