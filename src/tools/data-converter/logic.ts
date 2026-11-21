import { dump as yamlDump, load as yamlLoad, JSON_SCHEMA } from 'js-yaml';
import Papa from 'papaparse';
import { XMLBuilder, XMLParser, XMLValidator } from 'fast-xml-parser';
import { parseJson } from '@/tools/json-formatter/logic';

export type Format = 'json' | 'yaml' | 'csv' | 'xml';
export type Result<T> = { ok: true; value: T } | { ok: false; error: string };

export interface ConvertOptions {
  delimiter: string; // ',' ';' '\t' '|'
  header: boolean;
  /** flatten nested objects to dot keys for CSV, and unflatten dot keys when reading CSV */
  flatten: boolean;
  indent: number;
}

export const DEFAULT_OPTIONS: ConvertOptions = { delimiter: ',', header: true, flatten: true, indent: 2 };

type Obj = Record<string, unknown>;
const isPlainObject = (v: unknown): v is Obj => !!v && typeof v === 'object' && !Array.isArray(v);

/** {a:{b:1}, c:[1,2]} → {"a.b":1, "c.0":1, "c.1":2} */
export function flatten(value: unknown, prefix = '', out: Obj = {}): Obj {
  if (isPlainObject(value) || Array.isArray(value)) {
    const entries = Array.isArray(value) ? value.map((v, i) => [String(i), v] as const) : Object.entries(value);
    if (!entries.length && prefix) out[prefix] = Array.isArray(value) ? '[]' : '{}';
    for (const [k, v] of entries) flatten(v, prefix ? `${prefix}.${k}` : k, out);
  } else {
    out[prefix || 'value'] = value;
  }
  return out;
}

/** Inverse of flatten. Numeric segments become array indexes. */
export function unflatten(flat: Obj): unknown {
  const root: Obj = {};
  for (const [key, v] of Object.entries(flat)) {
    const segs = key.split('.');
    let cur: Obj | unknown[] = root;
    segs.forEach((seg, i) => {
      const last = i === segs.length - 1;
      const nextIsIndex = !last && /^\d+$/.test(segs[i + 1]!);
      const c = cur as Record<string, unknown>;
      if (last) c[seg] = v;
      else {
        if (c[seg] === undefined || typeof c[seg] !== 'object' || c[seg] === null) c[seg] = nextIsIndex ? [] : {};
        cur = c[seg] as Obj;
      }
    });
  }
  return root;
}

function errMsg(e: unknown): string {
  return e instanceof Error ? e.message.split('\n')[0]! : String(e);
}

export function parseInput(text: string, fmt: Format, o: ConvertOptions): Result<unknown> {
  if (!text.trim()) return { ok: false, error: 'Input is empty.' };
  switch (fmt) {
    case 'json': {
      const r = parseJson(text);
      return r.ok ? r : { ok: false, error: `Invalid JSON: ${r.error.message} (line ${r.error.line}, column ${r.error.column}).` };
    }
    case 'yaml':
      try {
        return { ok: true, value: yamlLoad(text, { schema: JSON_SCHEMA }) };
      } catch (e) {
        return { ok: false, error: `Invalid YAML: ${errMsg(e)}` };
      }
    case 'csv': {
      const r = Papa.parse<unknown>(text.trim(), { header: o.header, delimiter: o.delimiter, dynamicTyping: true, skipEmptyLines: true });
      const fatal = r.errors.find((e) => e.type !== 'Delimiter');
      if (fatal) return { ok: false, error: `Invalid CSV at row ${(fatal.row ?? 0) + 1}: ${fatal.message}.` };
      const rows = r.data;
      return { ok: true, value: o.header && o.flatten ? rows.map((row) => unflatten(row as Obj)) : rows };
    }
    case 'xml': {
      const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_', parseTagValue: true, trimValues: true });
      try {
        const validation = XMLValidatorSafe(text);
        if (validation) return { ok: false, error: validation };
        return { ok: true, value: parser.parse(text) };
      } catch (e) {
        return { ok: false, error: `Invalid XML: ${errMsg(e)}` };
      }
    }
  }
}

function XMLValidatorSafe(text: string): string | null {
  const v = XMLValidator.validate(text);
  if (v === true) return null;
  return `Invalid XML at line ${v.err.line}, column ${v.err.col}: ${v.err.msg}`;
}

export function serialize(value: unknown, fmt: Format, o: ConvertOptions): Result<string> {
  try {
    switch (fmt) {
      case 'json':
        return { ok: true, value: JSON.stringify(value, null, o.indent) };
      case 'yaml':
        return { ok: true, value: yamlDump(value, { indent: o.indent, lineWidth: -1, noRefs: true }) };
      case 'csv': {
        let rows: unknown[] = Array.isArray(value) ? value : [value];
        if (!o.header) {
          if (!rows.every(Array.isArray)) rows = rows.map((r) => (isPlainObject(r) ? Object.values(o.flatten ? flatten(r) : r) : [r]));
          return { ok: true, value: Papa.unparse(rows as unknown[][], { delimiter: o.delimiter, header: false }) };
        }
        const objs = rows.map((r) => (isPlainObject(r) ? (o.flatten ? flatten(r) : r) : Array.isArray(r) ? (o.flatten ? flatten(r) : { value: JSON.stringify(r) }) : { value: r }));
        const columns: string[] = [];
        const seen = new Set<string>();
        for (const r of objs) for (const k of Object.keys(r)) if (!seen.has(k)) { seen.add(k); columns.push(k); }
        const cells = objs.map((r) => columns.map((c) => {
          const v = r[c];
          return v !== null && typeof v === 'object' ? JSON.stringify(v) : v ?? '';
        }));
        return { ok: true, value: Papa.unparse({ fields: columns, data: cells }, { delimiter: o.delimiter }) };
      }
      case 'xml': {
        let v = value;
        if (!isPlainObject(v) || Object.keys(v).filter((k) => !k.startsWith('?')).length !== 1) v = { root: Array.isArray(v) ? { item: v } : v };
        const b = new XMLBuilder({ ignoreAttributes: false, attributeNamePrefix: '@_', format: true, indentBy: ' '.repeat(o.indent), suppressEmptyNode: true });
        return { ok: true, value: (b.build(v) as string).trim() };
      }
    }
  } catch (e) {
    return { ok: false, error: `Could not convert to ${fmt.toUpperCase()}: ${errMsg(e)}` };
  }
}

export function convert(text: string, from: Format, to: Format, o: ConvertOptions = DEFAULT_OPTIONS): Result<string> {
  const p = parseInput(text, from, o);
  if (!p.ok) return p;
  return serialize(p.value, to, o);
}
