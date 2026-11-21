import { convert, flatten, unflatten, parseInput, DEFAULT_OPTIONS as O } from './logic';

const users = [
  { id: 1, name: 'Ada', address: { city: 'London', zip: 'N1' }, tags: ['a', 'b'] },
  { id: 2, name: 'Linus', address: { city: 'Helsinki', zip: null }, tags: [] },
];

describe('flatten/unflatten', () => {
  it('flattens with dot keys and round-trips', () => {
    const f = flatten(users[0]);
    expect(f).toEqual({ id: 1, name: 'Ada', 'address.city': 'London', 'address.zip': 'N1', 'tags.0': 'a', 'tags.1': 'b' });
    expect(unflatten(f)).toEqual(users[0]);
  });
});

describe('convert', () => {
  const json = JSON.stringify(users);
  it('JSON → CSV with flattened headers', () => {
    const r = convert(json, 'json', 'csv');
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const [head, row1] = r.value.split(/\r?\n/);
    expect(head).toBe('id,name,address.city,address.zip,tags.0,tags.1,tags');
    expect(row1).toBe('1,Ada,London,N1,a,b,');
  });
  it('CSV → JSON unflattens and types values', () => {
    const r = convert('id,name,address.city\n1,Ada,London\n2,"Smith, J",Paris', 'csv', 'json');
    expect(r.ok && JSON.parse(r.value)).toEqual([
      { id: 1, name: 'Ada', address: { city: 'London' } },
      { id: 2, name: 'Smith, J', address: { city: 'Paris' } },
    ]);
  });
  it('CSV with semicolons and no header', () => {
    const r = convert('1;2\n3;4', 'csv', 'json', { ...O, delimiter: ';', header: false });
    expect(r.ok && JSON.parse(r.value)).toEqual([[1, 2], [3, 4]]);
    const back = convert('[[1,2],[3,4]]', 'json', 'csv', { ...O, delimiter: ';', header: false });
    expect(back.ok && back.value).toBe('1;2\r\n3;4');
  });
  it('JSON ↔ YAML round-trip', () => {
    const y = convert(json, 'json', 'yaml');
    expect(y.ok && y.value).toContain('city: London');
    const j = y.ok && convert(y.value, 'yaml', 'json');
    expect(j && j.ok && JSON.parse(j.value)).toEqual(users);
  });
  it('JSON → XML wraps arrays and round-trips attributes', () => {
    const x = convert(json, 'json', 'xml');
    expect(x.ok && x.value).toMatch(/^<root>\s*<item>/);
    const xml = '<book id="7"><title>Dune</title><year>1965</year></book>';
    const j = convert(xml, 'xml', 'json');
    expect(j.ok && JSON.parse(j.value)).toEqual({ book: { title: 'Dune', year: 1965, '@_id': '7' } });
    const back = j.ok && convert(j.value, 'json', 'xml');
    expect(back && back.ok && back.value).toContain('<book id="7">');
  });
  it('primitives to CSV become a value column', () => {
    expect(convert('[1,2]', 'json', 'csv')).toEqual({ ok: true, value: 'value\r\n1\r\n2' });
  });
  it('reports bad input in plain words', () => {
    expect(convert('', 'json', 'yaml')).toMatchObject({ ok: false, error: /empty/ });
    expect(convert('{bad', 'json', 'yaml')).toMatchObject({ ok: false, error: /Invalid JSON.*line 1/ });
    expect(convert('a: [1, 2', 'yaml', 'json')).toMatchObject({ ok: false, error: /Invalid YAML/ });
    expect(convert('<a><b></a>', 'xml', 'json')).toMatchObject({ ok: false, error: /Invalid XML at line 1/ });
    expect(parseInput('a,b\n"unclosed', 'csv', O)).toMatchObject({ ok: false, error: /Invalid CSV/ });
  });
});
