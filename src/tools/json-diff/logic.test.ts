import { compare, diffJson, summarizeChanges } from './logic';

describe('json diff', () => {
  it('finds added, removed, changed and type changes', () => {
    const c = diffJson({ a: 1, b: { c: 2 }, d: [1, 2], e: 'x' }, { a: 2, b: { c: 2, n: true }, d: [1], e: 5 });
    expect(c).toEqual([
      { path: '$.a', kind: 'changed', before: 1, after: 2 },
      { path: '$.b.n', kind: 'added', after: true },
      { path: '$.d[1]', kind: 'removed', before: 2 },
      { path: '$.e', kind: 'type', before: 'x', after: 5 },
    ]);
  });
  it('ignores key order', () => {
    expect(diffJson({ a: 1, b: 2 }, { b: 2, a: 1 })).toEqual([]);
  });
  it('matches array items by id key', () => {
    const a = [{ id: 1, v: 'a' }, { id: 2, v: 'b' }];
    const b = [{ id: 2, v: 'B' }, { id: 1, v: 'a' }, { id: 3, v: 'c' }];
    expect(diffJson(a, b)).toHaveLength(5); // by index: ids and values differ at [0] and [1], plus [2] added
    expect(diffJson(a, b, { idKey: 'id' })).toEqual([
      { path: '$[1].v', kind: 'changed', before: 'b', after: 'B' },
      { path: '$[2]', kind: 'added', after: { id: 3, v: 'c' } },
    ]);
  });
  it('compare reports invalid sides and canonicalizes', () => {
    expect(compare('{', '{}', '')).toMatchObject({ ok: false, error: /Left JSON/ });
    expect(compare('{}', '[', '')).toMatchObject({ ok: false, error: /Right JSON/ });
    const r = compare('{"b":1,"a":2}', '{"a":2,"b":1}', '');
    expect(r.ok && r.value.changes).toEqual([]);
    expect(r.ok && r.value.leftCanonical).toBe(r.ok && r.value.rightCanonical);
  });
  it('summarizes', () => {
    expect(summarizeChanges(diffJson({ a: 1 }, { a: 2, b: 3 }))).toBe('~ $.a: 1 → 2\n+ $.b: 3');
  });
});
