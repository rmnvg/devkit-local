export interface PasswordOptions {
  length: number;
  lower: boolean;
  upper: boolean;
  digits: boolean;
  symbols: boolean;
  excludeAmbiguous: boolean;
  /** require at least one character from each selected set */
  requireEach: boolean;
}

const SETS = {
  lower: 'abcdefghijklmnopqrstuvwxyz',
  upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  digits: '0123456789',
  symbols: '!@#$%^&*()-_=+[]{};:,.<>/?~',
};
const AMBIGUOUS = /[Il1O0o|`'"]/g;

export type Rng = (n: number) => Uint32Array;
export const cryptoRng: Rng = (n) => crypto.getRandomValues(new Uint32Array(n));

/** Unbiased random integer in [0, max) via rejection sampling. */
export function randomInt(max: number, rng: Rng = cryptoRng): number {
  const limit = Math.floor(0x100000000 / max) * max;
  for (;;) {
    const x = rng(1)[0]!;
    if (x < limit) return x % max;
  }
}

export type Result<T> = { ok: true; value: T } | { ok: false; error: string };

export function charsets(o: PasswordOptions): string[] {
  return (['lower', 'upper', 'digits', 'symbols'] as const).filter((k) => o[k]).map((k) => (o.excludeAmbiguous ? SETS[k].replace(AMBIGUOUS, '') : SETS[k]));
}

export function generatePassword(o: PasswordOptions, rng: Rng = cryptoRng): Result<string> {
  const sets = charsets(o);
  if (!sets.length) return { ok: false, error: 'Select at least one character set.' };
  if (!Number.isInteger(o.length) || o.length < 4 || o.length > 512) return { ok: false, error: 'Length must be between 4 and 512.' };
  if (o.requireEach && o.length < sets.length) return { ok: false, error: 'Length is shorter than the number of required character sets.' };
  const all = sets.join('');
  const chars = Array.from({ length: o.length }, () => all[randomInt(all.length, rng)]!);
  if (o.requireEach) {
    // place one char from each set at distinct random positions
    const positions = new Set<number>();
    while (positions.size < sets.length) positions.add(randomInt(o.length, rng));
    [...positions].forEach((p, i) => (chars[p] = sets[i]![randomInt(sets[i]!.length, rng)]!));
  }
  return { ok: true, value: chars.join('') };
}

export function entropyBits(o: PasswordOptions): number {
  const n = charsets(o).join('').length;
  return n ? Math.round(o.length * Math.log2(n)) : 0;
}

export function strengthLabel(bits: number): string {
  if (bits < 40) return 'weak';
  if (bits < 60) return 'fair';
  if (bits < 80) return 'strong';
  return 'very strong';
}

/** Random token of `bytes` bytes, as hex or base64url (for API keys / secrets). */
export function randomToken(bytes: number, enc: 'hex' | 'base64url'): string {
  const b = crypto.getRandomValues(new Uint8Array(bytes));
  if (enc === 'hex') return Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
  let s = '';
  for (const x of b) s += String.fromCharCode(x);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
