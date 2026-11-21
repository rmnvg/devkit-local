export type Result<T> = { ok: true; value: T } | { ok: false; error: string };

export interface ParsedUrl {
  base: string;
  params: [string, string][];
  hash: string;
}

/** Parse a full URL, a "?query" string or a bare "a=1&b=2" query. */
export function parseQuery(input: string): Result<ParsedUrl> {
  const s = input.trim();
  if (!s) return { ok: false, error: 'Paste a URL or query string.' };
  let base = '';
  let query = s;
  let hash = '';
  const hi = query.indexOf('#');
  if (hi >= 0) { hash = query.slice(hi + 1); query = query.slice(0, hi); }
  const qi = query.indexOf('?');
  if (qi >= 0) { base = query.slice(0, qi); query = query.slice(qi + 1); }
  else if (/^[a-z][a-z0-9+.-]*:\/\//i.test(query) || (!query.includes('=') && query.includes('/'))) { base = query; query = ''; }
  const params: [string, string][] = [];
  for (const part of query.split('&')) {
    if (!part) continue;
    const eq = part.indexOf('=');
    const rawK = eq >= 0 ? part.slice(0, eq) : part;
    const rawV = eq >= 0 ? part.slice(eq + 1) : '';
    try {
      params.push([decodeURIComponent(rawK.replace(/\+/g, ' ')), decodeURIComponent(rawV.replace(/\+/g, ' '))]);
    } catch {
      return { ok: false, error: `Malformed percent-encoding in "${part}".` };
    }
  }
  return { ok: true, value: { base, params, hash } };
}

const enc = (s: string) => encodeURIComponent(s).replace(/%20/g, '+');

export function buildUrl(p: ParsedUrl): string {
  const q = p.params.filter(([k]) => k !== '').map(([k, v]) => `${enc(k)}=${enc(v)}`).join('&');
  return `${p.base}${q ? `?${q}` : ''}${p.hash ? `#${p.hash}` : ''}`;
}

/** Convert params to an object. Repeated keys become arrays; a[b][c] / a[] bracket notation nests. */
export function toObject(params: [string, string][], brackets: boolean): Record<string, unknown> {
  const root: Record<string, unknown> = {};
  for (const [k, v] of params) {
    const path = brackets ? keyPath(k) : [k];
    let cur: Record<string, unknown> | unknown[] = root;
    path.forEach((seg, i) => {
      const last = i === path.length - 1;
      const c = cur as Record<string, unknown> & unknown[];
      if (seg === '') {
        if (!Array.isArray(cur)) return;
        if (last) (cur as unknown[]).push(v);
        else { const o = {}; (cur as unknown[]).push(o); cur = o; }
        return;
      }
      if (last) {
        const existing = c[seg as never] as unknown;
        if (existing === undefined) c[seg as never] = v as never;
        else if (Array.isArray(existing)) existing.push(v);
        else c[seg as never] = [existing, v] as never;
      } else {
        if (c[seg as never] === undefined || typeof c[seg as never] !== 'object') c[seg as never] = (path[i + 1] === '' ? [] : {}) as never;
        cur = c[seg as never] as Record<string, unknown>;
      }
    });
  }
  return root;
}

function keyPath(k: string): string[] {
  const m = /^([^[\]]+)((?:\[[^\]]*\])+)$/.exec(k);
  if (!m) return [k];
  return [m[1]!, ...[...m[2]!.matchAll(/\[([^\]]*)\]/g)].map((x) => x[1]!)];
}
