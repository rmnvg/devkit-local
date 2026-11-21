import { query } from './logic';

const doc = JSON.stringify({ store: { book: [{ title: 'A', price: 8, isbn: 'x' }, { title: 'B', price: 12 }], bicycle: { price: 20 } } });

describe('jsonpath', () => {
  it('queries with paths', () => {
    expect(query(doc, '$.store.book[*].title')).toEqual({ ok: true, value: [{ path: "$['store']['book'][0]['title']", value: 'A' }, { path: "$['store']['book'][1]['title']", value: 'B' }] });
    expect(query(doc, '$..price').ok && (query(doc, '$..price') as { value: unknown[] }).value).toHaveLength(3);
  });
  it('supports filters with the safe evaluator', () => {
    const r = query(doc, '$.store.book[?(@.price < 10)].title');
    expect(r.ok && r.value.map((m) => m.value)).toEqual(['A']);
    const r2 = query(doc, '$..book[?(@.isbn)].title');
    expect(r2.ok && r2.value.map((m) => m.value)).toEqual(['A']);
  });
  it('handles no matches and errors', () => {
    expect(query(doc, '$.nope')).toEqual({ ok: true, value: [] });
    expect(query(doc, 'store')).toMatchObject({ ok: false, error: /start with "\$"/ });
    expect(query('{bad', '$')).toMatchObject({ ok: false, error: /Invalid JSON/ });
    expect(query('', '$')).toMatchObject({ ok: false });
  });
});
