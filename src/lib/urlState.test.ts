import { decodeState, encodeState, pickShareable, MAX_HASH_BYTES } from './urlState';

describe('urlState', () => {
  it('round-trips state', () => {
    const state = { text: 'héllo 🌍 & = # ?', n: 3, flag: true, nested: { a: [1, 2] } };
    const enc = encodeState(state);
    expect(enc.ok).toBe(true);
    if (!enc.ok) return;
    expect(enc.hash.startsWith('#s=')).toBe(true);
    const dec = decodeState(enc.hash);
    expect(dec).toEqual({ ok: true, value: state });
  });
  it('compresses repetitive state', () => {
    const enc = encodeState({ text: 'a'.repeat(20000) });
    expect(enc.ok).toBe(true);
    if (enc.ok) expect(enc.hash.length).toBeLessThan(MAX_HASH_BYTES);
  });
  it('rejects state over the cap', () => {
    let seed = 42;
    const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31);
    const random = Array.from({ length: 20000 }, () => String.fromCharCode(33 + Math.floor(rnd() * 90))).join('');
    const enc = encodeState({ text: random });
    expect(enc.ok).toBe(false);
    if (!enc.ok) expect(enc.error).toMatch(/Too large/);
  });
  it('handles missing and corrupted hashes', () => {
    expect(decodeState('').ok).toBe(false);
    expect(decodeState('#other=1').ok).toBe(false);
    expect(decodeState('#s=%%%garbage').ok).toBe(false);
  });
  it('pickShareable drops input keys unless included', () => {
    const s = { token: 'secret', alg: 'HS256' };
    expect(pickShareable(s, ['token'], false)).toEqual({ alg: 'HS256' });
    expect(pickShareable(s, ['token'], true)).toEqual(s);
  });
});
