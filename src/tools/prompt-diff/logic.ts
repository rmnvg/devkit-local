import { diffArrays, diffChars, diffWordsWithSpace } from 'diff';

export type Granularity = 'words' | 'lines' | 'chars';

export interface Part {
  value: string;
  type: 'same' | 'added' | 'removed';
}

export interface DiffResult {
  parts: Part[];
  added: number;
  removed: number;
  identical: boolean;
  /** left (old) and right (new) views for side-by-side rendering */
  left: Part[];
  right: Part[];
}

const MAX = 400_000;

export function diffPrompts(a: string, b: string, granularity: Granularity, ignoreCase = false): DiffResult | { error: string } {
  if (a.length + b.length > MAX) return { error: 'Inputs are too large to diff in the browser (over 400,000 characters combined).' };
  const opts = { ignoreCase };
  const kind = (c: { added: boolean; removed: boolean }): Part['type'] => (c.added ? 'added' : c.removed ? 'removed' : 'same');
  let parts: Part[];
  if (granularity === 'lines') {
    // diff lines as arrays so a case-insensitive comparator can be used
    const lines = (s: string) => s.match(/[^\n]*\n|[^\n]+$/g) ?? [];
    const comparator = (x: string, y: string) => (ignoreCase ? x.toLowerCase() === y.toLowerCase() : x === y);
    parts = diffArrays(lines(a), lines(b), { comparator }).map((c) => ({ value: c.value.join(''), type: kind(c) }));
  } else {
    const changes = granularity === 'chars' ? diffChars(a, b, opts) : diffWordsWithSpace(a, b, opts);
    parts = changes.map((c) => ({ value: c.value, type: kind(c) }));
  }
  const unit = (s: string) => (granularity === 'lines' ? s.split('\n').filter((x, i, arr) => x !== '' || i < arr.length - 1).length : granularity === 'chars' ? s.length : s.trim().split(/\s+/).filter(Boolean).length);
  let added = 0, removed = 0;
  for (const p of parts) {
    if (p.type === 'added') added += unit(p.value);
    if (p.type === 'removed') removed += unit(p.value);
  }
  return {
    parts,
    added,
    removed,
    identical: parts.every((p) => p.type === 'same'),
    left: parts.filter((p) => p.type !== 'added'),
    right: parts.filter((p) => p.type !== 'removed'),
  };
}

export function formatDelta(before: number, after: number): string {
  const d = after - before;
  const pct = before === 0 ? (after === 0 ? 0 : 100) : (d / before) * 100;
  return `${d > 0 ? '+' : ''}${d.toLocaleString()} (${d > 0 ? '+' : ''}${pct.toFixed(1)}%)`;
}

/** Unified text form, for copying. */
export function toUnified(parts: Part[]): string {
  return parts.map((p) => (p.type === 'same' ? p.value : p.type === 'added' ? `{+${p.value}+}` : `[-${p.value}-]`)).join('');
}
