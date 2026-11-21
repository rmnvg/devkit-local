import { locateJsonError, type JsonErrorInfo } from '@/lib/jsonError';

export type Indent = '2' | '4' | 'tab' | 'min';

export type FormatResult = { ok: true; value: string; parsed: unknown } | { ok: false; error: JsonErrorInfo };

export function sortKeysDeep(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(sortKeysDeep);
  if (v && typeof v === 'object') {
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(v).sort()) out[k] = sortKeysDeep((v as Record<string, unknown>)[k]);
    return out;
  }
  return v;
}

export function parseJson(text: string): { ok: true; value: unknown } | { ok: false; error: JsonErrorInfo } {
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch (e) {
    return { ok: false, error: locateJsonError(text, e instanceof Error ? e.message : 'Invalid JSON') };
  }
}

export function formatJson(text: string, indent: Indent, sortKeys: boolean): FormatResult {
  if (!text.trim()) return { ok: true, value: '', parsed: undefined };
  const p = parseJson(text);
  if (!p.ok) return p;
  const v = sortKeys ? sortKeysDeep(p.value) : p.value;
  const space = indent === 'min' ? undefined : indent === 'tab' ? '\t' : Number(indent);
  return { ok: true, value: JSON.stringify(v, null, space), parsed: v };
}

const IDENT = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

/** Build a JSONPath-style path ($.a.b[0]["odd key"]) from segments. */
export function toPath(segments: (string | number)[]): string {
  return '$' + segments.map((s) => (typeof s === 'number' ? `[${s}]` : IDENT.test(s) ? `.${s}` : `[${JSON.stringify(s)}]`)).join('');
}

export function summarize(v: unknown): string {
  if (Array.isArray(v)) return `[${v.length}]`;
  if (v && typeof v === 'object') return `{${Object.keys(v).length}}`;
  return '';
}
