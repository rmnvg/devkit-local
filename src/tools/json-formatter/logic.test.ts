import { formatJson, sortKeysDeep, toPath, summarize, parseJson } from './logic';
import { locateJsonError } from '@/lib/jsonError';

describe('formatJson', () => {
  const src = '{"b":1,"a":[1,{"d":2,"c":3}]}';
  it('formats with 2/4/tab and minifies', () => {
    expect(formatJson(src, '2', false)).toMatchObject({ ok: true, value: JSON.stringify(JSON.parse(src), null, 2) });
    expect(formatJson(src, '4', false).ok && (formatJson(src, '4', false) as { value: string }).value).toContain('\n    "b"');
    expect((formatJson(src, 'tab', false) as { value: string }).value).toContain('\n\t"b"');
    expect((formatJson(' {\n "a" : 1 } ', 'min', false) as { value: string }).value).toBe('{"a":1}');
  });
  it('sorts keys deeply', () => {
    expect((formatJson(src, 'min', true) as { value: string }).value).toBe('{"a":[1,{"c":3,"d":2}],"b":1}');
    expect(sortKeysDeep([{ z: 1, a: 2 }])).toEqual([{ a: 2, z: 1 }]);
  });
  it('empty input is not an error', () => {
    expect(formatJson('  ', '2', false)).toMatchObject({ ok: true, value: '' });
  });
  it('accepts top-level primitives', () => {
    expect(formatJson('42', '2', false)).toMatchObject({ ok: true, value: '42' });
  });
});

describe('error location', () => {
  const cases: [string, RegExp, number, number][] = [
    ['{"a":1,}', /Trailing comma/, 1, 8],
    ['{\n  "a": 1\n  "b": 2\n}', /Expected "," or "}"/, 3, 3],
    ["{'a':1}", /property name in double quotes/, 1, 2],
    ['[1,2', /Expected "," or "]"|end of input/, 1, 5],
    ['{"a": tru}', /Unexpected/, 1, 7],
    ['{"a":"x\ny"}', /line break/, 1, 8],
    ['{"a":1} x', /after the JSON value/, 1, 9],
    ['"abc', /Unterminated/, 1, 1],
    ['[01]', /Expected "," or "]"/, 1, 3],
  ];
  it.each(cases)('%j', (text, msg, line, column) => {
    const r = parseJson(text);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.message).toMatch(msg);
    expect([r.error.line, r.error.column]).toEqual([line, column]);
  });
  it('excerpt points at the column', () => {
    const e = locateJsonError('{"a":1,}');
    expect(e.excerpt).toBe('{"a":1,}\n       ^');
  });
  it('trims long lines around the error', () => {
    const e = locateJsonError('[' + '1,'.repeat(200) + ']');
    expect(e.excerpt.split('\n')[0]!.length).toBeLessThanOrEqual(121);
  });
});

describe('paths', () => {
  it('builds JSONPath', () => {
    expect(toPath([])).toBe('$');
    expect(toPath(['a', 0, 'b c', '$x'])).toBe('$.a[0]["b c"].$x');
  });
  it('summarizes containers', () => {
    expect(summarize([1, 2])).toBe('[2]');
    expect(summarize({ a: 1 })).toBe('{1}');
    expect(summarize(1)).toBe('');
  });
});
