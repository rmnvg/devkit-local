const WORDS = 'lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua enim ad minim veniam quis nostrud exercitation ullamco laboris nisi aliquip ex ea commodo consequat duis aute irure in reprehenderit voluptate velit esse cillum fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt culpa qui officia deserunt mollit anim id est laborum'.split(' ');

/** Small deterministic PRNG (mulberry32) so a seed gives repeatable text. */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type Unit = 'paragraphs' | 'sentences' | 'words';

export interface LoremOptions {
  unit: Unit;
  count: number;
  startWithLorem: boolean;
  html: boolean;
  seed: number;
}

export function generate(o: LoremOptions): string {
  const r = rng(o.seed);
  const pick = () => WORDS[Math.floor(r() * WORDS.length)]!;
  const between = (lo: number, hi: number) => lo + Math.floor(r() * (hi - lo + 1));
  const sentence = () => {
    const n = between(6, 14);
    const w = Array.from({ length: n }, pick);
    if (n > 8 && r() < 0.5) w[between(2, n - 3)] += ',';
    const s = w.join(' ');
    return s.charAt(0).toUpperCase() + s.slice(1) + '.';
  };
  const paragraph = () => Array.from({ length: between(4, 7) }, sentence).join(' ');
  const count = Math.max(1, Math.min(o.unit === 'words' ? 10000 : 500, Math.floor(o.count)));
  const LOREM = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit';
  let parts: string[];
  if (o.unit === 'words') {
    const w = Array.from({ length: count }, pick);
    if (o.startWithLorem) LOREM.replace(',', '').toLowerCase().split(' ').slice(0, count).forEach((x, i) => (w[i] = x));
    const s = w.join(' ');
    parts = [s.charAt(0).toUpperCase() + s.slice(1) + '.'];
  } else if (o.unit === 'sentences') {
    parts = [Array.from({ length: count }, sentence).join(' ')];
    if (o.startWithLorem) parts[0] = LOREM + '. ' + parts[0]!.split('. ').slice(1).join('. ');
  } else {
    parts = Array.from({ length: count }, paragraph);
    if (o.startWithLorem) parts[0] = LOREM + '. ' + parts[0]!.split('. ').slice(1).join('. ');
  }
  parts = parts.map((p) => p.replace(/\.\s*\.$/, '.').trim());
  return o.html ? parts.map((p) => `<p>${p}</p>`).join('\n') : parts.join('\n\n');
}
