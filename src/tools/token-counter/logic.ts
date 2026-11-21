/** Pure text/token helpers. The encoder is injected so this runs in workers and tests. */
export interface Encoder {
  encode(text: string): number[];
  decode(tokens: number[]): string;
}

export interface TextStats {
  characters: number;
  words: number;
  lines: number;
}

export function textStats(text: string): TextStats {
  if (!text) return { characters: 0, words: 0, lines: 0 };
  const characters = Array.from(text).length; // code points, not UTF-16 units
  const words = text.trim() ? text.trim().split(/\s+/u).length : 0;
  return { characters, words, lines: text.split(/\r\n|\r|\n/).length };
}

export interface TokenizeResult {
  count: number;
  /** decoded text for the first `maxPieces` tokens (for visualization) */
  pieces: string[];
  truncated: boolean;
}

export function tokenize(encoder: Encoder, text: string, maxPieces = 2000): TokenizeResult {
  if (!text) return { count: 0, pieces: [], truncated: false };
  const ids = encoder.encode(text);
  const shown = ids.slice(0, maxPieces);
  // A token can hold part of a multi-byte character; group such tokens so each piece is valid text.
  const pieces: string[] = [];
  let pending: number[] = [];
  for (const id of shown) {
    pending.push(id);
    const text = encoder.decode(pending);
    if (!text.endsWith('\uFFFD') || pending.length >= 4) {
      pieces.push(text);
      pending = [];
    }
  }
  if (pending.length) pieces.push(encoder.decode(pending));
  return { count: ids.length, pieces, truncated: ids.length > shown.length };
}

/** Show whitespace in token pieces so boundaries are visible. */
export function visiblePiece(piece: string): string {
  return piece.replace(/\n/g, '↵\n').replace(/\t/g, '→');
}
