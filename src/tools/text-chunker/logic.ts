import type { Encoder } from '@/tools/token-counter/logic';

export type ChunkMode = 'recursive' | 'characters' | 'tokens';

export interface ChunkOptions {
  mode: ChunkMode;
  /** max chunk size: characters, or tokens when mode is 'tokens' or measureTokens is on */
  size: number;
  overlap: number;
  /** for 'recursive': tried in order */
  separators: string[];
  /** recursive mode: measure size in tokens instead of characters */
  measureTokens: boolean;
}

export interface Chunk {
  index: number;
  text: string;
  chars: number;
  tokens: number;
}

export type Result<T> = { ok: true; value: T } | { ok: false; error: string };

export const DEFAULT_SEPARATORS = ['\n\n', '\n', '. ', ' ', ''];

export function validate(o: ChunkOptions): string | null {
  if (!Number.isInteger(o.size) || o.size < 1) return 'Chunk size must be a whole number of at least 1.';
  if (!Number.isInteger(o.overlap) || o.overlap < 0) return 'Overlap must be zero or more.';
  if (o.overlap >= o.size) return 'Overlap must be smaller than the chunk size.';
  return null;
}

const MAX_CHUNKS = 20_000;

export function chunkByChars(text: string, size: number, overlap: number): string[] {
  const cps = Array.from(text); // don't split surrogate pairs
  const out: string[] = [];
  for (let i = 0; i < cps.length && out.length < MAX_CHUNKS; i += size - overlap) {
    out.push(cps.slice(i, i + size).join(''));
    if (i + size >= cps.length) break;
  }
  return out;
}

export function chunkByTokens(enc: Encoder, text: string, size: number, overlap: number): string[] {
  const ids = enc.encode(text);
  const out: string[] = [];
  for (let i = 0; i < ids.length && out.length < MAX_CHUNKS; i += size - overlap) {
    out.push(enc.decode(ids.slice(i, i + size)));
    if (i + size >= ids.length) break;
  }
  return out;
}

/**
 * Recursive splitter (like LangChain's RecursiveCharacterTextSplitter): split on the first
 * separator, merge small pieces up to `size`, and recurse into pieces that are still too big.
 * Separators are kept at the end of the piece they follow, so chunks join back to the text.
 */
export function chunkRecursive(text: string, size: number, overlap: number, separators: string[], len: (s: string) => number): string[] {
  const out: string[] = [];

  const splitKeep = (s: string, sep: string): string[] => {
    if (sep === '') return Array.from(s);
    const parts = s.split(sep);
    return parts.map((p, i) => (i < parts.length - 1 ? p + sep : p)).filter((p) => p !== '');
  };

  const merge = (pieces: string[]) => {
    const cur: string[] = [];
    let curLen = 0;
    for (const p of pieces) {
      const pl = len(p);
      if (curLen + pl > size && cur.length) {
        out.push(cur.join(''));
        // keep trailing pieces for overlap
        while (cur.length && (curLen > overlap || curLen + pl > size)) {
          curLen -= len(cur[0]!);
          cur.shift();
        }
      }
      cur.push(p);
      curLen += pl;
    }
    if (cur.length) out.push(cur.join(''));
  };

  const recurse = (s: string, seps: string[]) => {
    const idx = seps.findIndex((sep) => sep === '' || s.includes(sep));
    const sep = idx < 0 ? '' : seps[idx]!;
    const rest = idx < 0 ? [] : seps.slice(idx + 1);
    const good: string[] = [];
    for (const piece of splitKeep(s, sep)) {
      if (len(piece) <= size) good.push(piece);
      else {
        if (good.length) merge(good.splice(0));
        if (rest.length) recurse(piece, rest);
        else out.push(piece);
      }
      if (out.length > MAX_CHUNKS) return;
    }
    if (good.length) merge(good);
  };

  recurse(text, separators.length ? separators : ['']);
  return out.filter((c) => c.trim() !== '');
}

export function chunkText(text: string, o: ChunkOptions, enc: Encoder): Result<Chunk[]> {
  const err = validate(o);
  if (err) return { ok: false, error: err };
  if (!text) return { ok: true, value: [] };
  const tokenLen = (s: string) => enc.encode(s).length;
  const charLen = (s: string) => Array.from(s).length;
  const pieces =
    o.mode === 'characters' ? chunkByChars(text, o.size, o.overlap)
    : o.mode === 'tokens' ? chunkByTokens(enc, text, o.size, o.overlap)
    : chunkRecursive(text, o.size, o.overlap, o.separators, o.measureTokens ? tokenLen : charLen);
  return { ok: true, value: pieces.map((t, index) => ({ index, text: t, chars: charLen(t), tokens: tokenLen(t) })) };
}

/** Parse the separators field: one per line, with \n and \t escapes. Empty line = "" (char split). */
export function parseSeparators(input: string): string[] {
  return input.split('\n').map((l) => l.replace(/\\n/g, '\n').replace(/\\t/g, '\t'));
}

export function stats(chunks: Chunk[]) {
  if (!chunks.length) return { count: 0, minTokens: 0, maxTokens: 0, avgTokens: 0, totalTokens: 0 };
  const t = chunks.map((c) => c.tokens);
  const total = t.reduce((a, b) => a + b, 0);
  return { count: chunks.length, minTokens: Math.min(...t), maxTokens: Math.max(...t), avgTokens: Math.round(total / t.length), totalTokens: total };
}
