import type { CostRow } from '@/lib/llm';

export type SortKey = 'model' | 'provider' | 'input' | 'output' | 'perRequest' | 'perMonth' | 'context';
export type SortDir = 'asc' | 'desc';

function key(row: CostRow, k: SortKey): string | number | null {
  switch (k) {
    case 'model': return row.model.displayName.toLowerCase();
    case 'provider': return row.model.provider;
    case 'input': return row.model.inputPerMTok;
    case 'output': return row.model.outputPerMTok;
    case 'perRequest': return row.perRequest;
    case 'perMonth': return row.perMonth;
    case 'context': return row.model.contextWindow;
  }
}

/** Sort rows; unknown (null) values always sink to the bottom. */
export function sortRows(rows: CostRow[], k: SortKey, dir: SortDir): CostRow[] {
  const mul = dir === 'asc' ? 1 : -1;
  return [...rows].sort((a, b) => {
    const va = key(a, k);
    const vb = key(b, k);
    if (va == null && vb == null) return 0;
    if (va == null) return 1;
    if (vb == null) return -1;
    if (va < vb) return -1 * mul;
    if (va > vb) return 1 * mul;
    return 0;
  });
}

/** ids of the cheapest model(s) per request, ignoring unknown prices. */
export function cheapestIds(rows: CostRow[]): Set<string> {
  const known = rows.filter((r) => r.perRequest != null);
  if (!known.length) return new Set();
  const min = Math.min(...known.map((r) => r.perRequest!));
  if (min === 0 && known.every((r) => r.perRequest === 0)) return new Set();
  return new Set(known.filter((r) => Math.abs(r.perRequest! - min) < 1e-12).map((r) => r.model.id));
}

/** Parse a token count typed by a user: "12,000", "12k", "1.5M". */
export function parseCount(input: string): number | null {
  const m = /^\s*([\d,_]*\.?\d+)\s*([kKmM]?)\s*$/.exec(input);
  if (!m) return null;
  const n = parseFloat(m[1]!.replace(/[,_]/g, ''));
  const mult = m[2]?.toLowerCase() === 'k' ? 1e3 : m[2]?.toLowerCase() === 'm' ? 1e6 : 1;
  return Math.round(n * mult);
}
