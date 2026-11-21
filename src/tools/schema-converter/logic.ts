/**
 * Convert tool/function definitions between JSON Schema, OpenAI (Chat Completions and
 * Responses), Anthropic and Gemini formats. Also infers a JSON Schema from a JSON sample.
 */
export type SourceFormat = 'auto' | 'jsonschema' | 'openai' | 'anthropic' | 'gemini' | 'sample';
export type TargetFormat = 'jsonschema' | 'openai' | 'openai-responses' | 'anthropic' | 'gemini';
export type Result<T> = { ok: true; value: T } | { ok: false; error: string };

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => !!v && typeof v === 'object' && !Array.isArray(v);

export interface ToolDef {
  name: string;
  description: string;
  schema: Obj;
}

export interface Options {
  /** used when the source has no name (JSON Schema without title, or a sample) */
  name: string;
  description: string;
  /** OpenAI strict mode: all properties required, additionalProperties false */
  strict: boolean;
}

// ---------------- sample → schema ----------------
function typeOf(v: unknown): string {
  if (v === null) return 'null';
  if (Array.isArray(v)) return 'array';
  if (typeof v === 'number') return Number.isInteger(v) ? 'integer' : 'number';
  return typeof v;
}

function mergeSchemas(a: Obj, b: Obj): Obj {
  if (JSON.stringify(a) === JSON.stringify(b)) return a;
  const ta = a.type, tb = b.type;
  if (ta === 'object' && tb === 'object') {
    const pa = (a.properties ?? {}) as Obj, pb = (b.properties ?? {}) as Obj;
    const ra = new Set((a.required ?? []) as string[]), rb = new Set((b.required ?? []) as string[]);
    const props: Obj = {};
    for (const k of new Set([...Object.keys(pa), ...Object.keys(pb)])) props[k] = pa[k] && pb[k] ? mergeSchemas(pa[k] as Obj, pb[k] as Obj) : (pa[k] ?? pb[k]);
    return { type: 'object', properties: props, required: [...ra].filter((k) => rb.has(k)) };
  }
  if (ta === 'array' && tb === 'array') return { type: 'array', items: mergeSchemas((a.items ?? {}) as Obj, (b.items ?? {}) as Obj) };
  if ((ta === 'integer' && tb === 'number') || (ta === 'number' && tb === 'integer')) return { type: 'number' };
  const types = [...new Set([...(Array.isArray(ta) ? ta : [ta]), ...(Array.isArray(tb) ? tb : [tb])])].filter(Boolean) as string[];
  if (types.every((t) => ['string', 'number', 'integer', 'boolean', 'null'].includes(t))) return { type: types };
  return { anyOf: [a, b] };
}

export function inferSchema(v: unknown): Obj {
  const t = typeOf(v);
  if (t === 'object') {
    const props: Obj = {};
    for (const [k, val] of Object.entries(v as Obj)) props[k] = inferSchema(val);
    return { type: 'object', properties: props, required: Object.keys(props) };
  }
  if (t === 'array') {
    const arr = v as unknown[];
    return arr.length ? { type: 'array', items: arr.map(inferSchema).reduce(mergeSchemas) } : { type: 'array', items: {} };
  }
  return { type: t };
}

// ---------------- detection & parsing ----------------
export function detectFormat(v: unknown): Exclude<SourceFormat, 'auto'> {
  const first = Array.isArray(v) ? v[0] : isObj(v) && Array.isArray(v.functionDeclarations) ? v.functionDeclarations[0] : v;
  if (isObj(v) && Array.isArray(v.functionDeclarations)) return 'gemini';
  if (!isObj(first)) return 'sample';
  if ('input_schema' in first) return 'anthropic';
  if (isObj(first.function) || (first.type === 'function' && 'parameters' in first)) return 'openai';
  if ('name' in first && ('parameters' in first || 'parametersJsonSchema' in first)) return 'gemini';
  if (('type' in first && typeof first.type === 'string' && ['object', 'array', 'string', 'number', 'integer', 'boolean'].includes(first.type)) || '$schema' in first || 'properties' in first) return 'jsonschema';
  return 'sample';
}

function fromGeminiSchema(s: unknown): unknown {
  if (Array.isArray(s)) return s.map(fromGeminiSchema);
  if (!isObj(s)) return s;
  const out: Obj = {};
  for (const [k, v] of Object.entries(s)) {
    if (k === 'type' && typeof v === 'string') out.type = v.toLowerCase();
    else if (k === 'nullable' || k === 'propertyOrdering') continue;
    else out[k] = k === 'properties' && isObj(v) ? Object.fromEntries(Object.entries(v).map(([pk, pv]) => [pk, fromGeminiSchema(pv)])) : fromGeminiSchema(v);
  }
  if (s.nullable === true && typeof out.type === 'string') out.type = [out.type, 'null'];
  return out;
}

function parseTools(v: unknown, fmt: Exclude<SourceFormat, 'auto'>, o: Options): Result<ToolDef[]> {
  if (fmt === 'sample') return { ok: true, value: [{ name: o.name, description: o.description, schema: inferSchema(v) }] };
  if (fmt === 'jsonschema') {
    if (!isObj(v)) return { ok: false, error: 'A JSON Schema must be an object.' };
    const { title, description, ...rest } = v;
    const schema = Object.fromEntries(Object.entries(rest).filter(([k]) => k !== '$schema'));
    return { ok: true, value: [{ name: typeof title === 'string' ? title : o.name, description: typeof description === 'string' ? description : o.description, schema }] };
  }
  const list = isObj(v) && Array.isArray(v.functionDeclarations) ? v.functionDeclarations : Array.isArray(v) ? v : [v];
  const out: ToolDef[] = [];
  for (const [i, t] of list.entries()) {
    if (!isObj(t)) return { ok: false, error: `Tool ${i + 1} is not an object.` };
    if (fmt === 'openai') {
      const f = isObj(t.function) ? t.function : t;
      if (typeof f.name !== 'string') return { ok: false, error: `Tool ${i + 1}: missing "name".` };
      out.push({ name: f.name, description: typeof f.description === 'string' ? f.description : '', schema: isObj(f.parameters) ? f.parameters : { type: 'object', properties: {} } });
    } else if (fmt === 'anthropic') {
      if (typeof t.name !== 'string') return { ok: false, error: `Tool ${i + 1}: missing "name".` };
      out.push({ name: t.name, description: typeof t.description === 'string' ? t.description : '', schema: isObj(t.input_schema) ? t.input_schema : { type: 'object', properties: {} } });
    } else {
      if (typeof t.name !== 'string') return { ok: false, error: `Tool ${i + 1}: missing "name".` };
      const schema = isObj(t.parametersJsonSchema) ? t.parametersJsonSchema : isObj(t.parameters) ? (fromGeminiSchema(t.parameters) as Obj) : { type: 'object', properties: {} };
      out.push({ name: t.name, description: typeof t.description === 'string' ? t.description : '', schema });
    }
  }
  return { ok: true, value: out };
}

// ---------------- target transforms ----------------
/** OpenAI strict mode: every object closed, every property required (optional ones become nullable). */
export function toStrict(schema: unknown, warnings: string[], path = '$'): unknown {
  if (Array.isArray(schema)) return schema.map((s, i) => toStrict(s, warnings, `${path}[${i}]`));
  if (!isObj(schema)) return schema;
  const out: Obj = {};
  for (const [k, v] of Object.entries(schema)) out[k] = ['properties', '$defs', 'definitions'].includes(k) && isObj(v) ? Object.fromEntries(Object.entries(v).map(([pk, pv]) => [pk, toStrict(pv, warnings, `${path}.${pk}`)])) : toStrict(v, warnings, path);
  if (out.type === 'object' || (Array.isArray(out.type) && out.type.includes('object')) || isObj(out.properties)) {
    const props = (out.properties ?? {}) as Obj;
    const req = new Set(Array.isArray(out.required) ? (out.required as string[]) : []);
    for (const k of Object.keys(props)) {
      if (!req.has(k)) {
        const p = props[k] as Obj;
        if (typeof p.type === 'string') p.type = [p.type, 'null'];
        else if (Array.isArray(p.type) && !p.type.includes('null')) p.type = [...p.type, 'null'];
        warnings.push(`${path}.${k} was optional; strict mode makes it required and nullable.`);
      }
    }
    out.required = Object.keys(props);
    out.additionalProperties = false;
  }
  return out;
}

const GEMINI_DROP = new Set(['$schema', '$id', 'additionalProperties', 'default', 'examples', '$comment', 'title', 'patternProperties', 'unevaluatedProperties', 'dependentRequired']);

/** Map to Gemini's OpenAPI-subset schema (used by `parameters`). */
export function toGeminiSchema(s: unknown, warnings: string[], defs: Obj = {}, path = '$'): unknown {
  if (Array.isArray(s)) return s.map((x, i) => toGeminiSchema(x, warnings, defs, `${path}[${i}]`));
  if (!isObj(s)) return s;
  const localDefs = { ...defs, ...((s.$defs ?? s.definitions ?? {}) as Obj) };
  if (typeof s.$ref === 'string') {
    const name = s.$ref.replace(/^#\/(\$defs|definitions)\//, '');
    if (localDefs[name] && !path.split('.').includes(`ref:${name}`)) return toGeminiSchema(localDefs[name], warnings, localDefs, `${path}.ref:${name}`);
    warnings.push(`${path}: $ref "${s.$ref}" could not be inlined (missing or recursive); replaced with an object.`);
    return { type: 'object' };
  }
  const out: Obj = {};
  for (const [k, v] of Object.entries(s)) {
    if (k === '$defs' || k === 'definitions') continue;
    if (GEMINI_DROP.has(k)) {
      if (k === 'additionalProperties' || k === 'default') warnings.push(`${path}: "${k}" is not supported by Gemini parameters and was removed.`);
      continue;
    }
    if (k === 'type' && Array.isArray(v)) {
      const nonNull = v.filter((t) => t !== 'null');
      if (nonNull.length === 1) out.type = nonNull[0];
      else {
        out.anyOf = nonNull.map((t) => ({ type: t }));
        warnings.push(`${path}: multiple types converted to anyOf.`);
      }
      if (v.includes('null')) out.nullable = true;
    } else if (k === 'const') out.enum = [v];
    else if (k === 'oneOf') {
      out.anyOf = toGeminiSchema(v, warnings, localDefs, path);
      warnings.push(`${path}: oneOf converted to anyOf.`);
    } else if (k === 'properties' && isObj(v)) out.properties = Object.fromEntries(Object.entries(v).map(([pk, pv]) => [pk, toGeminiSchema(pv, warnings, localDefs, `${path}.${pk}`)]));
    else out[k] = toGeminiSchema(v, warnings, localDefs, path);
  }
  if (Array.isArray(out.enum) && out.enum.some((e) => typeof e !== 'string')) {
    out.enum = out.enum.map(String);
    out.type = 'string';
    warnings.push(`${path}: Gemini enums must be strings; values were converted.`);
  }
  return out;
}

const NAME_RE = /^[a-zA-Z0-9_-]{1,64}$/;
const GEMINI_NAME_RE = /^[a-zA-Z_][a-zA-Z0-9_.:-]{0,63}$/;

export function convertSchema(json: string, from: SourceFormat, to: TargetFormat, o: Options): Result<{ output: string; detected: Exclude<SourceFormat, 'auto'>; warnings: string[] }> {
  if (!json.trim()) return { ok: false, error: 'Paste a tool definition, JSON Schema or JSON sample.' };
  let v: unknown;
  try {
    v = JSON.parse(json);
  } catch (e) {
    return { ok: false, error: `Invalid JSON: ${e instanceof Error ? e.message : String(e)}` };
  }
  const detected = from === 'auto' ? detectFormat(v) : from;
  const parsed = parseTools(v, detected, o);
  if (!parsed.ok) return parsed;
  const warnings: string[] = [];
  const out = parsed.value.map((t) => {
    if (to !== 'jsonschema') {
      if (!(to === 'gemini' ? GEMINI_NAME_RE : NAME_RE).test(t.name)) warnings.push(`Tool name "${t.name}" is not valid for ${to}: use letters, digits, "_" or "-" (max 64).`);
      if (!t.description) warnings.push(`Tool "${t.name}" has no description; models choose tools much better with one.`);
      if (t.schema.type !== 'object') warnings.push(`Tool "${t.name}": parameters should be an object schema.`);
    }
    switch (to) {
      case 'jsonschema':
        return { $schema: 'https://json-schema.org/draft/2020-12/schema', title: t.name, ...(t.description ? { description: t.description } : {}), ...t.schema };
      case 'openai':
      case 'openai-responses': {
        const parameters = o.strict ? toStrict(t.schema, warnings) : t.schema;
        const fn = { name: t.name, description: t.description, parameters, ...(o.strict ? { strict: true } : {}) };
        return to === 'openai' ? { type: 'function', function: fn } : { type: 'function', ...fn };
      }
      case 'anthropic':
        return { name: t.name, description: t.description, input_schema: t.schema };
      case 'gemini':
        return { name: t.name, description: t.description, parameters: toGeminiSchema(t.schema, warnings) };
    }
  });
  const value = to === 'gemini' && out.length > 1 ? { functionDeclarations: out } : out.length === 1 ? out[0] : out;
  return { ok: true, value: { output: JSON.stringify(value, null, 2), detected, warnings: [...new Set(warnings)] } };
}
