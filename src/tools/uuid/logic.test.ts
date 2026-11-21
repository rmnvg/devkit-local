import { inspect, ulid, uuidV4, uuidV7 } from './logic';

const fixed = (byte: number) => (n: number) => new Uint8Array(n).fill(byte);

describe('generation', () => {
  it('v4 has version and variant bits', () => {
    expect(uuidV4(fixed(0xff))).toBe('ffffffff-ffff-4fff-bfff-ffffffffffff');
    expect(uuidV4()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(uuidV4()).not.toBe(uuidV4());
  });
  it('v7 encodes the timestamp and sorts by time', () => {
    const t = 1_795_000_000_000;
    const u = uuidV7(t, fixed(0));
    expect(u.replace(/-/g, '').slice(0, 12)).toBe(t.toString(16).padStart(12, '0'));
    expect(u.slice(14, 15)).toBe('7');
    expect(inspect(u)).toMatchObject({ ok: true, value: { version: 7, timestampMs: t } });
    expect(uuidV7(t) < uuidV7(t + 1)).toBe(true);
  });
  it('ulid encodes the timestamp in Crockford base32', () => {
    expect(ulid(0, fixed(0))).toBe('0'.repeat(26));
    const t = 1_469_918_176_385;
    expect(ulid(t, fixed(0)).slice(0, 10)).toBe('01ARYZ6S41');
    expect(inspect(ulid(t))).toMatchObject({ ok: true, value: { kind: 'ulid', timestampMs: t } });
  });
});

describe('inspect', () => {
  it('reads versions and variants, accepts braces/urn/uppercase', () => {
    expect(inspect('{F81D4FAE-7DEC-11D0-A765-00A0C91E6BF6}')).toMatchObject({ ok: true, value: { version: 1, variant: 'RFC 9562', normalized: 'f81d4fae-7dec-11d0-a765-00a0c91e6bf6' } });
    expect(inspect('urn:uuid:f81d4fae7dec11d0a76500a0c91e6bf6').ok).toBe(true);
    const v1 = inspect('f81d4fae-7dec-11d0-a765-00a0c91e6bf6');
    expect(v1.ok && new Date(v1.value.timestampMs!).toISOString()).toBe('1997-02-03T17:43:12.216Z');
  });
  it('rejects junk', () => {
    expect(inspect('not-a-uuid')).toMatchObject({ ok: false });
    expect(inspect('8ZZZZZZZZZZZZZZZZZZZZZZZZZ')).toMatchObject({ ok: false, error: /overflows/ });
  });
});
