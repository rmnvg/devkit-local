export type Result<T> = { ok: true; value: T } | { ok: false; error: string };

/** Parse a vector from a JSON array, or numbers separated by commas/whitespace. Brackets optional. */
export function parseVector(input: string, label = 'Vector'): Result<number[]> {
  const s = input.trim();
  if (!s) return { ok: false, error: `${label} is empty.` };
  let parts: string[];
  if (s.startsWith('[') || s.startsWith('{')) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(s);
    } catch {
      parts = s.replace(/^\[|\]$/g, '').split(/[\s,]+/).filter(Boolean);
      return fromStrings(parts, label);
    }
    // accept {"embedding": [...]} or {"data":[{"embedding":[...]}]} (common API shapes)
    const obj = parsed as { embedding?: unknown; data?: { embedding?: unknown }[]; values?: unknown };
    const arr = Array.isArray(parsed) ? parsed : obj.embedding ?? obj.values ?? obj.data?.[0]?.embedding;
    if (!Array.isArray(arr)) return { ok: false, error: `${label}: expected an array of numbers.` };
    if (arr.length && Array.isArray(arr[0])) return { ok: false, error: `${label}: nested arrays found; paste a single vector.` };
    const bad = arr.findIndex((x) => typeof x !== 'number' || !Number.isFinite(x));
    if (bad >= 0) return { ok: false, error: `${label}: item ${bad + 1} is not a finite number (${JSON.stringify(arr[bad])}).` };
    if (!arr.length) return { ok: false, error: `${label} is empty.` };
    return { ok: true, value: arr as number[] };
  }
  parts = s.split(/[\s,;]+/).filter(Boolean);
  return fromStrings(parts, label);
}

function fromStrings(parts: string[], label: string): Result<number[]> {
  const out: number[] = [];
  for (let i = 0; i < parts.length; i++) {
    const n = Number(parts[i]);
    if (!Number.isFinite(n)) return { ok: false, error: `${label}: "${parts[i]}" (item ${i + 1}) is not a number.` };
    out.push(n);
  }
  if (!out.length) return { ok: false, error: `${label} is empty.` };
  return { ok: true, value: out };
}

export interface Similarity {
  dimensions: number;
  dot: number;
  normA: number;
  normB: number;
  cosine: number | null;
  angleDeg: number | null;
  euclidean: number;
  /** both vectors have norm ≈ 1 (typical for OpenAI-style embeddings) */
  normalized: boolean;
}

export function similarity(a: number[], b: number[]): Result<Similarity> {
  if (a.length !== b.length) return { ok: false, error: `Dimension mismatch: vector A has ${a.length} values, vector B has ${b.length}.` };
  let dot = 0, na = 0, nb = 0, sq = 0;
  for (let i = 0; i < a.length; i++) {
    const x = a[i]!, y = b[i]!;
    dot += x * y;
    na += x * x;
    nb += y * y;
    sq += (x - y) ** 2;
  }
  const normA = Math.sqrt(na), normB = Math.sqrt(nb);
  const cosine = normA === 0 || normB === 0 ? null : Math.max(-1, Math.min(1, dot / (normA * normB)));
  return {
    ok: true,
    value: {
      dimensions: a.length, dot, normA, normB, cosine,
      angleDeg: cosine == null ? null : (Math.acos(cosine) * 180) / Math.PI,
      euclidean: Math.sqrt(sq),
      normalized: Math.abs(normA - 1) < 1e-3 && Math.abs(normB - 1) < 1e-3,
    },
  };
}

export function describeCosine(c: number): string {
  if (c >= 0.9) return 'very similar';
  if (c >= 0.75) return 'similar';
  if (c >= 0.5) return 'somewhat related';
  if (c > 0) return 'weakly related';
  if (c === 0) return 'orthogonal';
  return 'opposite direction';
}
