import { JSONPath } from 'jsonpath-plus';
import { parseJson } from '@/tools/json-formatter/logic';

export type Result<T> = { ok: true; value: T } | { ok: false; error: string };

export interface PathMatch {
  path: string;
  value: unknown;
}

export function query(json: string, expr: string): Result<PathMatch[]> {
  if (!json.trim()) return { ok: false, error: 'Paste JSON to query.' };
  const p = parseJson(json);
  if (!p.ok) return { ok: false, error: `Invalid JSON: ${p.error.message} (line ${p.error.line}, column ${p.error.column}).` };
  const e = expr.trim();
  if (!e) return { ok: true, value: [] };
  if (!e.startsWith('$') && !e.startsWith('@')) return { ok: false, error: 'JSONPath expressions start with "$" (the root).' };
  try {
    const res = JSONPath({ path: e, json: p.value as object, resultType: 'all', wrap: true, eval: 'safe' }) as { path: string; value: unknown }[];
    return { ok: true, value: res.map((r) => ({ path: r.path, value: r.value })) };
  } catch (err) {
    return { ok: false, error: `Invalid expression: ${err instanceof Error ? err.message : String(err)}` };
  }
}

export const EXAMPLES: [string, string][] = [
  ['$.store.book[*].author', 'All authors'],
  ['$..price', 'Every price, anywhere'],
  ['$.store.book[?(@.price < 10)].title', 'Titles under $10'],
  ['$.store.book[-1:]', 'Last book'],
  ['$.store.book[0,1]', 'First two books'],
  ['$..book[?(@.isbn)]', 'Books with an ISBN'],
  ['$.store.*', 'Everything in the store'],
];
