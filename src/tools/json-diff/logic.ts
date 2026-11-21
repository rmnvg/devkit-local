import { parseJson, sortKeysDeep, toPath } from '@/tools/json-formatter/logic';

export type ChangeKind = 'added' | 'removed' | 'changed' | 'type';
export interface Change {
  path: string;
  kind: ChangeKind;
  before?: unknown;
  after?: unknown;
}
export type Result<T> = { ok: true; value: T } | { ok: false; error: string };

const kindOf = (v: unknown) => (v === null ? 'null' : Array.isArray(v) ? 'array' : typeof v);

/** Structural diff. Arrays are compared by index (or by `idKey` when every element has it). */
export function diffJson(a: unknown, b: unknown, opts: { idKey?: string } = {}, path: (string | number)[] = [], out: Change[] = []): Change[] {
  const ka = kindOf(a), kb = kindOf(b);
  if (ka !== kb) {
    out.push({ path: toPath(path), kind: 'type', before: a, after: b });
    return out;
  }
  if (ka === 'object') {
    const oa = a as Record<string, unknown>, ob = b as Record<string, unknown>;
    for (const k of Object.keys(oa)) {
      if (!(k in ob)) out.push({ path: toPath([...path, k]), kind: 'removed', before: oa[k] });
      else diffJson(oa[k], ob[k], opts, [...path, k], out);
    }
    for (const k of Object.keys(ob)) if (!(k in oa)) out.push({ path: toPath([...path, k]), kind: 'added', after: ob[k] });
    return out;
  }
  if (ka === 'array') {
    const aa = a as unknown[], ab = b as unknown[];
    const id = opts.idKey;
    const keyed = (arr: unknown[]) => !!id && arr.every((x) => x && typeof x === 'object' && !Array.isArray(x) && id in (x as object));
    if (id && keyed(aa) && keyed(ab)) {
      const key = (x: unknown) => JSON.stringify((x as Record<string, unknown>)[id]);
      const mb = new Map(ab.map((x) => [key(x), x]));
      const ma = new Map(aa.map((x) => [key(x), x]));
      aa.forEach((x, i) => (mb.has(key(x)) ? diffJson(x, mb.get(key(x)), opts, [...path, i], out) : out.push({ path: toPath([...path, i]), kind: 'removed', before: x })));
      ab.forEach((x, i) => !ma.has(key(x)) && out.push({ path: toPath([...path, i]), kind: 'added', after: x }));
      return out;
    }
    const n = Math.max(aa.length, ab.length);
    for (let i = 0; i < n; i++) {
      if (i >= aa.length) out.push({ path: toPath([...path, i]), kind: 'added', after: ab[i] });
      else if (i >= ab.length) out.push({ path: toPath([...path, i]), kind: 'removed', before: aa[i] });
      else diffJson(aa[i], ab[i], opts, [...path, i], out);
    }
    return out;
  }
  if (a !== b) out.push({ path: toPath(path), kind: 'changed', before: a, after: b });
  return out;
}

export function compare(left: string, right: string, idKey: string): Result<{ changes: Change[]; leftCanonical: string; rightCanonical: string }> {
  const pa = parseJson(left);
  if (!pa.ok) return { ok: false, error: `Left JSON is invalid: ${pa.error.message} (line ${pa.error.line}, column ${pa.error.column}).` };
  const pb = parseJson(right);
  if (!pb.ok) return { ok: false, error: `Right JSON is invalid: ${pb.error.message} (line ${pb.error.line}, column ${pb.error.column}).` };
  return {
    ok: true,
    value: {
      changes: diffJson(pa.value, pb.value, { idKey: idKey.trim() || undefined }),
      leftCanonical: JSON.stringify(sortKeysDeep(pa.value), null, 2),
      rightCanonical: JSON.stringify(sortKeysDeep(pb.value), null, 2),
    },
  };
}

export function summarizeChanges(c: Change[]): string {
  return c.map((x) => (x.kind === 'added' ? `+ ${x.path}: ${JSON.stringify(x.after)}` : x.kind === 'removed' ? `- ${x.path}: ${JSON.stringify(x.before)}` : `~ ${x.path}: ${JSON.stringify(x.before)} → ${JSON.stringify(x.after)}`)).join('\n');
}
