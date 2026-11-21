import { buildUrl, parseQuery, toObject } from './logic';

describe('query string', () => {
  it('parses full URLs with hash, repeated keys and plus signs', () => {
    expect(parseQuery('https://x.io/s?q=caf%C3%A9+au+lait&tag=a&tag=b&empty=&flag#top')).toEqual({
      ok: true,
      value: { base: 'https://x.io/s', params: [['q', 'café au lait'], ['tag', 'a'], ['tag', 'b'], ['empty', ''], ['flag', '']], hash: 'top' },
    });
  });
  it('parses bare and ?-prefixed queries, and URLs without a query', () => {
    expect(parseQuery('a=1&b=2')).toMatchObject({ ok: true, value: { base: '', params: [['a', '1'], ['b', '2']] } });
    expect(parseQuery('?a=1')).toMatchObject({ ok: true, value: { base: '', params: [['a', '1']] } });
    expect(parseQuery('https://x.io/path')).toMatchObject({ ok: true, value: { base: 'https://x.io/path', params: [] } });
  });
  it('rejects malformed encoding', () => {
    expect(parseQuery('a=%E0%A4%A')).toMatchObject({ ok: false });
    expect(parseQuery('')).toMatchObject({ ok: false });
  });
  it('builds URLs back', () => {
    const p = parseQuery('https://x.io/s?q=a b&x=1#h');
    expect(p.ok && buildUrl(p.value)).toBe('https://x.io/s?q=a+b&x=1#h');
  });
  it('converts to objects with bracket nesting', () => {
    const p = parseQuery('user[name]=Ada&user[langs][]=en&user[langs][]=fr&page=1&page=2');
    if (!p.ok) throw new Error();
    expect(toObject(p.value.params, true)).toEqual({ user: { name: 'Ada', langs: ['en', 'fr'] }, page: ['1', '2'] });
    expect(toObject(p.value.params, false)).toMatchObject({ 'user[name]': 'Ada', page: ['1', '2'] });
  });
});
