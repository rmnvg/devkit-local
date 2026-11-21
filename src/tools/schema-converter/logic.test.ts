import { convertSchema, detectFormat, inferSchema, toGeminiSchema, toStrict } from './logic';

const o = { name: 'my_tool', description: 'Does a thing', strict: false };
const weather = {
  type: 'function',
  function: {
    name: 'get_weather',
    description: 'Get the weather for a city',
    parameters: { type: 'object', properties: { city: { type: 'string' }, unit: { type: 'string', enum: ['c', 'f'] } }, required: ['city'], additionalProperties: false },
  },
};
const run = (v: unknown, from: Parameters<typeof convertSchema>[1], to: Parameters<typeof convertSchema>[2], opts = o) => {
  const r = convertSchema(JSON.stringify(v), from, to, opts);
  if (!r.ok) throw new Error(r.error);
  return { out: JSON.parse(r.value.output) as Record<string, unknown>, ...r.value };
};

describe('detect', () => {
  it('detects formats', () => {
    expect(detectFormat(weather)).toBe('openai');
    expect(detectFormat({ type: 'function', name: 'x', parameters: {} })).toBe('openai');
    expect(detectFormat({ name: 'x', input_schema: {} })).toBe('anthropic');
    expect(detectFormat({ name: 'x', parameters: { type: 'OBJECT' } })).toBe('gemini');
    expect(detectFormat({ functionDeclarations: [{ name: 'x' }] })).toBe('gemini');
    expect(detectFormat({ type: 'object', properties: {} })).toBe('jsonschema');
    expect(detectFormat({ id: 1, name: 'Ada' })).toBe('sample');
  });
});

describe('conversions', () => {
  it('OpenAI → Anthropic', () => {
    expect(run(weather, 'auto', 'anthropic').out).toEqual({ name: 'get_weather', description: 'Get the weather for a city', input_schema: weather.function.parameters });
  });
  it('Anthropic → OpenAI Responses (flat) and Chat (nested)', () => {
    const a = run(weather, 'auto', 'anthropic').out;
    expect(run(a, 'auto', 'openai-responses').out).toMatchObject({ type: 'function', name: 'get_weather', parameters: { type: 'object' } });
    expect(run(a, 'auto', 'openai').out).toEqual(weather);
  });
  it('→ Gemini strips unsupported keywords and warns', () => {
    const { out, warnings } = run(weather, 'auto', 'gemini');
    expect(out).toEqual({ name: 'get_weather', description: 'Get the weather for a city', parameters: { type: 'object', properties: { city: { type: 'string' }, unit: { type: 'string', enum: ['c', 'f'] } }, required: ['city'] } });
    expect(warnings.join(' ')).toMatch(/additionalProperties/);
  });
  it('Gemini → JSON Schema lowercases types and maps nullable', () => {
    const g = { name: 'f', description: 'd', parameters: { type: 'OBJECT', properties: { n: { type: 'INTEGER', nullable: true } } } };
    expect(run(g, 'auto', 'jsonschema').out).toMatchObject({ title: 'f', type: 'object', properties: { n: { type: ['integer', 'null'] } } });
  });
  it('multiple tools to Gemini become functionDeclarations', () => {
    const { out } = run([weather, { ...weather, function: { ...weather.function, name: 'other' } }], 'openai', 'gemini');
    expect((out.functionDeclarations as unknown[]).length).toBe(2);
  });
  it('JSON sample → tool', () => {
    const { out, detected } = run({ city: 'Paris', days: 3, tags: ['a'] }, 'auto', 'anthropic');
    expect(detected).toBe('sample');
    expect(out).toEqual({ name: 'my_tool', description: 'Does a thing', input_schema: { type: 'object', properties: { city: { type: 'string' }, days: { type: 'integer' }, tags: { type: 'array', items: { type: 'string' } } }, required: ['city', 'days', 'tags'] } });
  });
  it('warns on invalid names and missing descriptions', () => {
    const { warnings } = run({ name: 'bad name!', input_schema: { type: 'object' } }, 'anthropic', 'openai');
    expect(warnings.join(' ')).toMatch(/not valid.*no description/s);
  });
  it('bad input', () => {
    expect(convertSchema('', 'auto', 'openai', o)).toMatchObject({ ok: false });
    expect(convertSchema('{', 'auto', 'openai', o)).toMatchObject({ ok: false, error: /Invalid JSON/ });
    expect(convertSchema('{"input_schema":{}}', 'anthropic', 'openai', o)).toMatchObject({ ok: false, error: /missing "name"/ });
  });
});

describe('helpers', () => {
  it('inferSchema merges array items and marks partial keys optional', () => {
    expect(inferSchema([{ a: 1, b: 'x' }, { a: 2.5 }])).toEqual({ type: 'array', items: { type: 'object', properties: { a: { type: 'number' }, b: { type: 'string' } }, required: ['a'] } });
    expect(inferSchema([1, 'a', null])).toEqual({ type: 'array', items: { type: ['integer', 'string', 'null'] } });
  });
  it('toStrict closes objects and nulls optional fields', () => {
    const w: string[] = [];
    expect(toStrict({ type: 'object', properties: { a: { type: 'string' }, b: { type: 'object', properties: { c: { type: 'integer' } } } }, required: ['a'] }, w)).toEqual({
      type: 'object',
      properties: { a: { type: 'string' }, b: { type: ['object', 'null'], properties: { c: { type: ['integer', 'null'] } }, required: ['c'], additionalProperties: false } },
      required: ['a', 'b'],
      additionalProperties: false,
    });
    expect(w).toHaveLength(2);
  });
  it('toGeminiSchema inlines $ref, maps const/oneOf/non-string enums', () => {
    const w: string[] = [];
    const s = { type: 'object', $defs: { Unit: { type: 'string', enum: ['c', 'f'] } }, properties: { u: { $ref: '#/$defs/Unit' }, k: { const: 'x' }, n: { type: 'integer', enum: [1, 2] }, x: { oneOf: [{ type: 'string' }, { type: 'number' }] } } };
    expect(toGeminiSchema(s, w)).toEqual({ type: 'object', properties: { u: { type: 'string', enum: ['c', 'f'] }, k: { enum: ['x'] }, n: { type: 'string', enum: ['1', '2'] }, x: { anyOf: [{ type: 'string' }, { type: 'number' }] } } });
    expect(w.join(' ')).toMatch(/oneOf.*enums must be strings|enums must be strings.*oneOf/s);
  });
});
