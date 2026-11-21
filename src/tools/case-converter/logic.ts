/** Split any identifier or phrase into lowercase-insensitive words. */
export function words(input: string): string[] {
  return input
    .replace(/([a-z\d])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);
}

const cap = (w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
const SMALL = new Set(['a', 'an', 'and', 'as', 'at', 'but', 'by', 'for', 'in', 'nor', 'of', 'on', 'or', 'the', 'to', 'up', 'via', 'vs']);

export const CASES = {
  camel: (s: string) => words(s).map((w, i) => (i ? cap(w) : w.toLowerCase())).join(''),
  pascal: (s: string) => words(s).map(cap).join(''),
  snake: (s: string) => words(s).map((w) => w.toLowerCase()).join('_'),
  constant: (s: string) => words(s).map((w) => w.toUpperCase()).join('_'),
  kebab: (s: string) => words(s).map((w) => w.toLowerCase()).join('-'),
  train: (s: string) => words(s).map(cap).join('-'),
  dot: (s: string) => words(s).map((w) => w.toLowerCase()).join('.'),
  path: (s: string) => words(s).map((w) => w.toLowerCase()).join('/'),
  title: (s: string) => words(s).map((w, i, arr) => (i > 0 && i < arr.length - 1 && SMALL.has(w.toLowerCase()) ? w.toLowerCase() : cap(w))).join(' '),
  sentence: (s: string) => { const w = words(s).map((x) => x.toLowerCase()).join(' '); return w.charAt(0).toUpperCase() + w.slice(1); },
  lower: (s: string) => s.toLowerCase(),
  upper: (s: string) => s.toUpperCase(),
} satisfies Record<string, (s: string) => string>;

export type CaseName = keyof typeof CASES;

export const CASE_LABELS: Record<CaseName, string> = {
  camel: 'camelCase', pascal: 'PascalCase', snake: 'snake_case', constant: 'CONSTANT_CASE', kebab: 'kebab-case', train: 'Train-Case',
  dot: 'dot.case', path: 'path/case', title: 'Title Case', sentence: 'Sentence case', lower: 'lower case', upper: 'UPPER CASE',
};

/** Convert each line separately so lists of identifiers work. */
export function convertLines(text: string, c: CaseName): string {
  return text.split('\n').map((l) => (l.trim() ? CASES[c](l) : l)).join('\n');
}
