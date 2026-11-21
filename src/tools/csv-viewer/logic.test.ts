import { columnStats, filterRows, parseCsv, sortRows, toCsv } from './logic';

const csv = 'name,age,city\nAda,36,London\nLinus,9,Helsinki\nGrace,100,"New York, NY"\nBob,,Paris';

describe('csv viewer', () => {
  it('parses with header and auto delimiter', () => {
    const r = parseCsv(csv, 'auto', true);
    expect(r.ok && r.value.columns).toEqual(['name', 'age', 'city']);
    expect(r.ok && r.value.rows[2]).toEqual(['Grace', '100', 'New York, NY']);
    expect(parseCsv('a;b\n1;2', 'auto', true)).toMatchObject({ ok: true, value: { delimiter: ';' } });
  });
  it('pads ragged rows with a warning and names blank headers', () => {
    const r = parseCsv('a,,c\n1,2\n', ',', true);
    expect(r.ok && r.value.columns).toEqual(['a', 'column 2', 'c']);
    expect(r.ok && r.value.rows[0]).toEqual(['1', '2', '']);
    expect(r.ok && r.value.warnings[0]).toMatch(/1 row/);
  });
  it('errors', () => {
    expect(parseCsv('', ',', true)).toMatchObject({ ok: false });
    expect(parseCsv('a\n"open', ',', true)).toMatchObject({ ok: false, error: /never closed/ });
  });
  it('sorts numerically with blanks last, and naturally for text', () => {
    const r = parseCsv(csv, ',', true);
    if (!r.ok) throw new Error();
    expect(sortRows(r.value.rows, 1, 'asc').map((x) => x[0])).toEqual(['Linus', 'Ada', 'Grace', 'Bob']);
    expect(sortRows(r.value.rows, 1, 'desc').map((x) => x[0])).toEqual(['Grace', 'Ada', 'Linus', 'Bob']);
    expect(sortRows([['file10'], ['file2']], 0, 'asc').map((x) => x[0])).toEqual(['file2', 'file10']);
  });
  it('filters and computes stats', () => {
    const r = parseCsv(csv, ',', true);
    if (!r.ok) throw new Error();
    expect(filterRows(r.value.rows, 'york')).toHaveLength(1);
    expect(columnStats(r.value.rows, 1)).toEqual({ filled: 3, unique: 3, numeric: true, min: 9, max: 100 });
    expect(toCsv(['a'], [['x,y']], ',')).toBe('a\r\n"x,y"');
  });
});
