import { generatePassword, entropyBits, randomInt, strengthLabel, charsets, randomToken, type PasswordOptions } from './logic';

const base: PasswordOptions = { length: 20, lower: true, upper: true, digits: true, symbols: false, excludeAmbiguous: false, requireEach: true };

describe('password', () => {
  it('generates with requested sets and length', () => {
    for (let i = 0; i < 50; i++) {
      const r = generatePassword(base);
      expect(r.ok).toBe(true);
      if (!r.ok) return;
      expect(r.value).toHaveLength(20);
      expect(r.value).toMatch(/[a-z]/);
      expect(r.value).toMatch(/[A-Z]/);
      expect(r.value).toMatch(/\d/);
      expect(r.value).not.toMatch(/[^a-zA-Z0-9]/);
    }
  });
  it('excludes ambiguous characters', () => {
    expect(charsets({ ...base, excludeAmbiguous: true }).join('')).not.toMatch(/[Il1O0o]/);
  });
  it('validates options', () => {
    expect(generatePassword({ ...base, lower: false, upper: false, digits: false })).toMatchObject({ ok: false, error: /at least one/ });
    expect(generatePassword({ ...base, length: 2 })).toMatchObject({ ok: false });
  });
  it('randomInt is unbiased by rejecting the tail', () => {
    const seq = [0xffffffff, 5];
    expect(randomInt(10, () => new Uint32Array([seq.shift()!]))).toBe(5);
  });
  it('entropy and labels', () => {
    expect(entropyBits({ ...base, length: 10, upper: false, digits: false })).toBe(47);
    expect(strengthLabel(30)).toBe('weak');
    expect(strengthLabel(128)).toBe('very strong');
  });
  it('random tokens', () => {
    expect(randomToken(16, 'hex')).toMatch(/^[0-9a-f]{32}$/);
    expect(randomToken(32, 'base64url')).toMatch(/^[A-Za-z0-9_-]{43}$/);
  });
});
