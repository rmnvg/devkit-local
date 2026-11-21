/** Tiny fuzzy matcher used by the home search. Returns a score (higher = better) or 0. */
export function fuzzyScore(query: string, text: string): number {
  const q = query.trim().toLowerCase();
  const t = text.toLowerCase();
  if (!q) return 1;
  if (t === q) return 100;
  if (t.startsWith(q)) return 80;
  const idx = t.indexOf(q);
  if (idx >= 0) return t[idx - 1] === ' ' || t[idx - 1] === '-' ? 70 : 60;
  // subsequence match
  let ti = 0;
  let gaps = 0;
  for (const ch of q) {
    const found = t.indexOf(ch, ti);
    if (found < 0) return 0;
    gaps += found - ti;
    ti = found + 1;
  }
  return Math.max(1, 40 - gaps);
}

export interface Searchable {
  name: string;
  slug: string;
  description: string;
  keywords: string[];
}

export function searchTools<T extends Searchable>(items: T[], query: string): T[] {
  if (!query.trim()) return items;
  const scored = items
    .map((item) => {
      const s = Math.max(
        fuzzyScore(query, item.name) * 1.2,
        fuzzyScore(query, item.slug),
        ...item.keywords.map((k) => fuzzyScore(query, k) * 0.9),
        fuzzyScore(query, item.description) * 0.5,
      );
      return { item, s };
    })
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s);
  return scored.map((x) => x.item);
}
