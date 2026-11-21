import { generate, pascal, snake } from './logic';

const sample = JSON.stringify({
  id: 1,
  name: 'Ada',
  score: 9.5,
  active: true,
  'first-name': 'A',
  manager: null,
  address: { city: 'London', zip: 'N1' },
  orders: [
    { id: 10, total: 5, coupon: 'X' },
    { id: 11, total: 7.25 },
  ],
  tags: ['a', 'b'],
});
const opts = { rootName: 'User', allOptional: false };
const gen = (t: Parameters<typeof generate>[1], o = opts) => {
  const r = generate(sample, t, o);
  if (!r.ok) throw new Error(r.error);
  return r.value;
};

describe('typescript', () => {
  const out = gen('typescript');
  it('emits nested interfaces with merged optional fields', () => {
    expect(out).toContain('export interface User {');
    expect(out).toContain('  address: Address;');
    expect(out).toContain('  orders: Order[];');
    expect(out).toMatch(/interface Order \{\n {2}id: number;\n {2}total: number;\n {2}coupon\?: string;/);
    expect(out).toContain('  "first-name": string;');
    expect(out).toContain('  manager: null;');
    expect(out).toContain('  tags: string[];');
  });
  it('allOptional makes every field optional', () => {
    expect(gen('typescript', { ...opts, allOptional: true })).toContain('  id?: number;');
  });
});

describe('pydantic', () => {
  const out = gen('pydantic');
  it('emits models in dependency order with aliases', () => {
    expect(out.indexOf('class Address')).toBeLessThan(out.indexOf('class User'));
    expect(out).toContain('from pydantic import BaseModel, ConfigDict, Field');
    expect(out).toContain('    first_name: str = Field(alias="first-name")');
    expect(out).toContain('    score: float');
    expect(out).toContain('    coupon: Optional[str] = None');
    expect(out).toContain('    orders: list[Order]');
    expect(out).toMatch(/from typing import .*Optional/);
  });
});

describe('go', () => {
  const out = gen('go');
  it('emits structs with json tags', () => {
    expect(out).toContain('type User struct {');
    expect(out).toContain('\tFirstName string `json:"first-name"`');
    expect(out).toContain('\tOrders []Order `json:"orders"`');
    expect(out).toContain('\tCoupon *string `json:"coupon,omitempty"`');
    expect(out).toContain('\tTotal float64 `json:"total"`');
    expect(out).toContain('\tID int64'.replace('ID', 'Id'));
  });
});

describe('zod', () => {
  const out = gen('zod');
  it('emits schemas before use', () => {
    expect(out.indexOf('AddressSchema = z.object')).toBeLessThan(out.indexOf('UserSchema = z.object'));
    expect(out).toContain('  orders: z.array(OrderSchema),');
    expect(out).toContain('  coupon: z.string().optional(),');
    expect(out).toContain('  id: z.number().int(),');
    expect(out).toContain('export type User = z.infer<typeof UserSchema>;');
  });
});

describe('edge cases', () => {
  it('nullable merged values', () => {
    const r = generate('[{"a":1},{"a":null}]', 'typescript', { rootName: 'Row', allOptional: false });
    expect(r.ok && r.value).toContain('a: number | null;');
    const z = generate('[{"a":1},{"a":null}]', 'zod', { rootName: 'Row', allOptional: false });
    expect(z.ok && z.value).toContain('a: z.number().int().nullable(),');
    expect(r.ok && r.value).toContain('export type Row = RowItem[];');
  });
  it('primitive root and empty array', () => {
    expect(generate('"x"', 'typescript', opts)).toEqual({ ok: true, value: 'export type User = string;\n' });
    expect(generate('[]', 'go', opts)).toMatchObject({ ok: true, value: expect.stringContaining('type User []interface{}') });
  });
  it('bad input', () => {
    expect(generate('', 'go', opts)).toMatchObject({ ok: false });
    expect(generate('{x}', 'go', opts)).toMatchObject({ ok: false, error: /Invalid JSON/ });
  });
  it('naming helpers', () => {
    expect(pascal('first-name')).toBe('FirstName');
    expect(pascal('123abc')).toBe('T123abc');
    expect(pascal('')).toBe('Item');
    expect(snake('firstName')).toBe('first_name');
    expect(snake('2fa')).toBe('f_2fa');
  });
});
