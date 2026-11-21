import Papa from 'papaparse';

export type Result<T> = { ok: true; value: T } | { ok: false; error: string };
export interface Table {
  columns: string[];
  rows: string[][];
  delimiter: string;
  warnings: string[];
}

export function parseCsv(text: string, delimiter: string, header: boolean): Result<Table> {
  if (!text.trim()) return { ok: false, error: 'Paste CSV or drop a file.' };
  const r = Papa.parse<string[]>(text, { delimiter: delimiter === 'auto' ? '' : delimiter, skipEmptyLines: 'greedy' });
  const fatal = r.errors.find((e) => e.code === 'MissingQuotes');
  if (fatal) return { ok: false, error: `Row ${(fatal.row ?? 0) + 1}: a quoted field is never closed.` };
  const data = r.data;
  if (!data.length) return { ok: false, error: 'No rows found.' };
  const width = Math.max(...data.map((row) => row.length));
  const warnings: string[] = [];
  const ragged = data.filter((row) => row.length !== width).length;
  if (ragged) warnings.push(`${ragged} row(s) have fewer columns than the widest row.`);
  const pad = (row: string[]) => [...row, ...Array<string>(width - row.length).fill('')];
  const columns = header ? pad(data[0]!).map((c, i) => c || `column ${i + 1}`) : Array.from({ length: width }, (_, i) => `column ${i + 1}`);
  const rows = (header ? data.slice(1) : data).map(pad);
  return { ok: true, value: { columns, rows, delimiter: r.meta.delimiter, warnings } };
}

const NUM = /^\s*-?(\d+([.,]\d+)*|\d*\.\d+)([eE][+-]?\d+)?\s*$/;

/** Sort rows by column; numeric when every non-empty cell is numeric, else natural string order. */
export function sortRows(rows: string[][], col: number, dir: 'asc' | 'desc'): string[][] {
  const vals = rows.map((r) => r[col] ?? '').filter((v) => v.trim() !== '');
  const numeric = vals.length > 0 && vals.every((v) => NUM.test(v));
  const toNum = (v: string) => Number(v.replace(/,/g, ''));
  const coll = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
  const mul = dir === 'asc' ? 1 : -1;
  return [...rows].sort((a, b) => {
    const x = a[col] ?? '', y = b[col] ?? '';
    if (!x.trim() && !y.trim()) return 0;
    if (!x.trim()) return 1;
    if (!y.trim()) return -1;
    return (numeric ? toNum(x) - toNum(y) : coll.compare(x, y)) * mul;
  });
}

export function filterRows(rows: string[][], q: string): string[][] {
  const s = q.trim().toLowerCase();
  return s ? rows.filter((r) => r.some((c) => c.toLowerCase().includes(s))) : rows;
}

export function columnStats(rows: string[][], col: number): { filled: number; unique: number; numeric: boolean; min?: number; max?: number } {
  const vals = rows.map((r) => r[col] ?? '').filter((v) => v.trim() !== '');
  const numeric = vals.length > 0 && vals.every((v) => NUM.test(v));
  const nums = numeric ? vals.map((v) => Number(v.replace(/,/g, ''))) : [];
  return { filled: vals.length, unique: new Set(vals).size, numeric, ...(numeric ? { min: Math.min(...nums), max: Math.max(...nums) } : {}) };
}

export function toCsv(columns: string[], rows: string[][], delimiter: string): string {
  return Papa.unparse({ fields: columns, data: rows }, { delimiter });
}
