/**
 * Infer a type model from a JSON sample and emit TypeScript, Pydantic v2, Go or Zod.
 * Arrays of objects are merged: keys missing from some elements become optional,
 * `null` values make a field nullable.
 */
import { parseJson } from '@/tools/json-formatter/logic';

export type Target = 'typescript' | 'pydantic' | 'go' | 'zod';

type Prim = 'string' | 'integer' | 'number' | 'boolean' | 'null' | 'unknown';
export type T =
  | { kind: 'prim'; name: Prim }
  | { kind: 'array'; items: T }
  | { kind: 'object'; id: number; hint: string; fields: Map<string, Field> }
  | { kind: 'union'; types: T[] };
interface Field {
  type: T;
  optional: boolean;
}

let nextId = 0;
const prim = (name: Prim): T => ({ kind: 'prim', name });

export function infer(v: unknown, hint: string): T {
  if (v === null) return prim('null');
  if (Array.isArray(v)) {
    const itemHint = singular(hint);
    return { kind: 'array', items: v.length ? v.map((x) => infer(x, itemHint)).reduce(merge) : prim('unknown') };
  }
  switch (typeof v) {
    case 'string': return prim('string');
    case 'number': return prim(Number.isInteger(v) ? 'integer' : 'number');
    case 'boolean': return prim('boolean');
    case 'object': {
      const fields = new Map<string, Field>();
      for (const [k, val] of Object.entries(v as object)) fields.set(k, { type: infer(val, k), optional: false });
      return { kind: 'object', id: nextId++, hint, fields };
    }
    default: return prim('unknown');
  }
}

function members(t: T): T[] {
  return t.kind === 'union' ? t.types : [t];
}

export function merge(a: T, b: T): T {
  if (a.kind === 'prim' && a.name === 'unknown') return b;
  if (b.kind === 'prim' && b.name === 'unknown') return a;
  const out: T[] = [];
  for (const t of [...members(a), ...members(b)]) {
    const i = out.findIndex((o) => o.kind === t.kind && (o.kind !== 'prim' || (t.kind === 'prim' && (o.name === t.name || numeric(o.name, t.name)))));
    if (i < 0) { out.push(t); continue; }
    const o = out[i]!;
    if (o.kind === 'prim' && t.kind === 'prim') out[i] = prim(o.name === t.name ? o.name : 'number');
    else if (o.kind === 'array' && t.kind === 'array') out[i] = { kind: 'array', items: merge(o.items, t.items) };
    else if (o.kind === 'object' && t.kind === 'object') out[i] = mergeObjects(o, t);
  }
  return out.length === 1 ? out[0]! : { kind: 'union', types: out };
}
const numeric = (x: Prim, y: Prim) => (x === 'integer' || x === 'number') && (y === 'integer' || y === 'number');

function mergeObjects(a: Extract<T, { kind: 'object' }>, b: Extract<T, { kind: 'object' }>): T {
  const fields = new Map<string, Field>();
  for (const [k, f] of a.fields) {
    const g = b.fields.get(k);
    fields.set(k, g ? { type: merge(f.type, g.type), optional: f.optional || g.optional } : { ...f, optional: true });
  }
  for (const [k, g] of b.fields) if (!a.fields.has(k)) fields.set(k, { ...g, optional: true });
  return { kind: 'object', id: a.id, hint: a.hint, fields };
}

// ---------- naming ----------
export function pascal(s: string): string {
  const p = s.replace(/[^A-Za-z0-9]+/g, ' ').trim().split(/\s+/).filter(Boolean).map((w) => w[0]!.toUpperCase() + w.slice(1)).join('');
  if (!p) return 'Item';
  return /^\d/.test(p) ? `T${p}` : p;
}
function singular(s: string): string {
  if (/ies$/i.test(s)) return s.slice(0, -3) + 'y';
  if (/(ss|us)$/i.test(s)) return s;
  if (/s$/i.test(s) && s.length > 1) return s.slice(0, -1);
  return s + 'Item';
}
export function snake(s: string): string {
  const r = s.replace(/([a-z0-9])([A-Z])/g, '$1_$2').replace(/[^A-Za-z0-9]+/g, '_').replace(/^_+|_+$/g, '').toLowerCase();
  const v = r || 'field';
  return /^\d/.test(v) ? `f_${v}` : v;
}

interface Named {
  name: string;
  obj: Extract<T, { kind: 'object' }>;
}

/** Name every object type (post-order: dependencies first), deduplicating names. */
function collect(root: T, rootName: string): Named[] {
  const out: Named[] = [];
  const used = new Set<string>();
  const byId = new Map<number, string>();
  const visit = (t: T, hint: string) => {
    if (t.kind === 'array') return visit(t.items, singular(hint));
    if (t.kind === 'union') return t.types.forEach((x) => visit(x, hint));
    if (t.kind !== 'object' || byId.has(t.id)) return;
    let name = pascal(hint);
    for (let i = 2; used.has(name); i++) name = `${pascal(hint)}${i}`;
    used.add(name);
    byId.set(t.id, name);
    for (const [k, f] of t.fields) visit(f.type, k);
    out.push({ name, obj: t });
  };
  visit(root, rootName);
  nameOf = (t) => byId.get(t.id) ?? 'Unknown';
  return out;
}
let nameOf: (t: Extract<T, { kind: 'object' }>) => string = () => 'Unknown';

// ---------- emitters ----------
const TS_IDENT = /^[A-Za-z_$][A-Za-z0-9_$]*$/;
const PY_IDENT = /^[A-Za-z_][A-Za-z0-9_]*$/;
const PY_KEYWORDS = new Set(['class', 'def', 'from', 'import', 'global', 'lambda', 'pass', 'return', 'yield', 'None', 'True', 'False', 'and', 'or', 'not', 'in', 'is', 'if', 'else', 'elif', 'for', 'while', 'with', 'as', 'try', 'except', 'finally', 'raise', 'del', 'assert', 'break', 'continue', 'nonlocal', 'async', 'await']);

function isNull(t: T) { return t.kind === 'prim' && t.name === 'null'; }
function split(t: T): { nullable: boolean; rest: T | null } {
  const ms = members(t);
  const rest = ms.filter((m) => !isNull(m));
  return { nullable: rest.length !== ms.length, rest: rest.length === 0 ? null : rest.length === 1 ? rest[0]! : { kind: 'union', types: rest } };
}

function ts(t: T): string {
  switch (t.kind) {
    case 'prim': return t.name === 'integer' ? 'number' : t.name;
    case 'array': { const s = ts(t.items); return t.items.kind === 'union' ? `(${s})[]` : `${s}[]`; }
    case 'object': return nameOf(t);
    case 'union': return t.types.map(ts).join(' | ');
  }
}

function py(t: T): string {
  switch (t.kind) {
    case 'prim': return { string: 'str', integer: 'int', number: 'float', boolean: 'bool', null: 'None', unknown: 'Any' }[t.name];
    case 'array': return `list[${py(t.items)}]`;
    case 'object': return nameOf(t);
    case 'union': {
      const { nullable, rest } = split(t);
      const inner = rest ? (rest.kind === 'union' ? `Union[${rest.types.map(py).join(', ')}]` : py(rest)) : 'None';
      return nullable && rest ? `Optional[${inner}]` : inner;
    }
  }
}

function go(t: T): string {
  switch (t.kind) {
    case 'prim': return { string: 'string', integer: 'int64', number: 'float64', boolean: 'bool', null: 'interface{}', unknown: 'interface{}' }[t.name];
    case 'array': return `[]${go(t.items)}`;
    case 'object': return nameOf(t);
    case 'union': {
      const { nullable, rest } = split(t);
      if (!rest || rest.kind === 'union') return 'interface{}';
      const base = go(rest);
      return nullable && !base.startsWith('[]') && base !== 'interface{}' ? `*${base}` : base;
    }
  }
}

function zod(t: T): string {
  switch (t.kind) {
    case 'prim': return { string: 'z.string()', integer: 'z.number().int()', number: 'z.number()', boolean: 'z.boolean()', null: 'z.null()', unknown: 'z.unknown()' }[t.name];
    case 'array': return `z.array(${zod(t.items)})`;
    case 'object': return `${nameOf(t)}Schema`;
    case 'union': {
      const { nullable, rest } = split(t);
      if (!rest) return 'z.null()';
      const inner = rest.kind === 'union' ? `z.union([${rest.types.map(zod).join(', ')}])` : zod(rest);
      return nullable ? `${inner}.nullable()` : inner;
    }
  }
}

export interface GenOptions {
  rootName: string;
  allOptional: boolean;
}

export type GenResult = { ok: true; value: string } | { ok: false; error: string };

export function generate(json: string, target: Target, opts: GenOptions): GenResult {
  if (!json.trim()) return { ok: false, error: 'Paste a JSON sample.' };
  const p = parseJson(json);
  if (!p.ok) return { ok: false, error: `Invalid JSON: ${p.error.message} (line ${p.error.line}, column ${p.error.column}).` };
  const rootName = pascal(opts.rootName || 'Root');
  nextId = 0;
  const root = infer(p.value, rootName);
  const named = collect(root, rootName);
  const opt = (f: Field) => opts.allOptional || f.optional;
  const lines: string[] = [];

  if (target === 'typescript') {
    for (const { name, obj } of named) {
      lines.push(`export interface ${name} {`);
      for (const [k, f] of obj.fields) lines.push(`  ${TS_IDENT.test(k) ? k : JSON.stringify(k)}${opt(f) ? '?' : ''}: ${ts(f.type)};`);
      lines.push('}', '');
    }
    if (root.kind !== 'object') lines.push(`export type ${rootName} = ${ts(root)};`, '');
  }

  if (target === 'zod') {
    lines.push("import { z } from 'zod';", '');
    for (const { name, obj } of named) {
      lines.push(`export const ${name}Schema = z.object({`);
      for (const [k, f] of obj.fields) lines.push(`  ${TS_IDENT.test(k) ? k : JSON.stringify(k)}: ${zod(f.type)}${opt(f) ? '.optional()' : ''},`);
      lines.push('});', `export type ${name} = z.infer<typeof ${name}Schema>;`, '');
    }
    if (root.kind !== 'object') lines.push(`export const ${rootName}Schema = ${zod(root)};`, `export type ${rootName} = z.infer<typeof ${rootName}Schema>;`, '');
  }

  if (target === 'pydantic') {
    const body: string[] = [];
    let needsField = false;
    for (const { name, obj } of named) {
      body.push(`class ${name}(BaseModel):`);
      if (!obj.fields.size) body.push('    pass');
      for (const [k, f] of obj.fields) {
        let attr = snake(k);
        if (PY_KEYWORDS.has(attr) || !PY_IDENT.test(attr)) attr += '_';
        let type = py(f.type);
        const optional = opt(f);
        if (optional && !type.startsWith('Optional[') && type !== 'None') type = `Optional[${type}]`;
        const alias = attr !== k;
        if (alias) needsField = true;
        const def = alias ? ` = Field(${optional ? 'None, ' : ''}alias=${JSON.stringify(k)})` : optional ? ' = None' : '';
        body.push(`    ${attr}: ${type}${def}`);
      }
      body.push('', '');
    }
    const code = body.join('\n');
    const typing = ['Any', 'Optional', 'Union'].filter((n) => new RegExp(`\\b${n}\\b`).test(code));
    if (typing.length) lines.push(`from typing import ${typing.join(', ')}`, '');
    lines.push(`from pydantic import BaseModel${needsField ? ', ConfigDict, Field' : ''}`, '', '');
    if (needsField) {
      // allow populating by field name as well as alias
      lines.push(code.replace(/\(BaseModel\):\n/g, '(BaseModel):\n    model_config = ConfigDict(populate_by_name=True)\n\n'));
    } else lines.push(code);
    if (root.kind !== 'object') lines.push(`${rootName} = ${py(root)}`, '');
  }

  if (target === 'go') {
    lines.push('package main', '');
    for (const { name, obj } of [...named].reverse()) {
      lines.push(`type ${name} struct {`);
      const usedNames = new Set<string>();
      for (const [k, f] of obj.fields) {
        let field = pascal(k);
        for (let i = 2; usedNames.has(field); i++) field = `${pascal(k)}${i}`;
        usedNames.add(field);
        let type = go(f.type);
        if (opt(f) && !type.startsWith('*') && !type.startsWith('[]') && type !== 'interface{}') type = `*${type}`;
        lines.push(`\t${field} ${type} \`json:"${k}${opt(f) ? ',omitempty' : ''}"\``);
      }
      lines.push('}', '');
    }
    if (root.kind !== 'object') lines.push(`type ${rootName} ${go(root)}`, '');
  }

  return { ok: true, value: lines.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n' };
}
