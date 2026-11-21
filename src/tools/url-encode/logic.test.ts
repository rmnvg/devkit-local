import { decode, decodeFully, encode } from './logic';

describe('url encode', () => {
  const s = 'a b&c=d/é?#🌍';
  it('encodes in three modes', () => {
    expect(encode(s, 'component')).toEqual({ ok: true, value: 'a%20b%26c%3Dd%2F%C3%A9%3F%23%F0%9F%8C%8D' });
    expect(encode(s, 'uri')).toEqual({ ok: true, value: 'a%20b&c=d/%C3%A9?#%F0%9F%8C%8D' });
    expect(encode('a b', 'form')).toEqual({ ok: true, value: 'a+b' });
    expect(encode('\uD800', 'component')).toMatchObject({ ok: false });
  });
  it('round-trips', () => {
    for (const m of ['component', 'uri', 'form'] as const) {
      const e = encode(s, m);
      expect(e.ok && decode(e.value, m)).toEqual({ ok: true, value: s });
    }
  });
  it('reports malformed input', () => {
    expect(decode('100%', 'component')).toMatchObject({ ok: false, error: /position 4/ });
    expect(decode('%E9', 'component')).toMatchObject({ ok: false, error: /UTF-8/ });
  });
  it('decodes double-encoded strings', () => {
    expect(decodeFully('a%2520b', 'component')).toEqual({ ok: true, value: { value: 'a b', rounds: 2 } });
    expect(decodeFully('plain', 'component')).toEqual({ ok: true, value: { value: 'plain', rounds: 0 } });
  });
});
