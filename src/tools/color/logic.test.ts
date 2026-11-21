import { contrastRatio, parseColor, suggestForeground, toHex, toHslString, toOklchString, toRgbString, wcag, type Rgba } from './logic';

const p = (s: string) => {
  const r = parseColor(s);
  if (!r.ok) throw new Error(r.error);
  return r.value;
};

describe('parse', () => {
  it('reads hex, rgb and hsl in modern and legacy syntax', () => {
    expect(p('#1e90ff')).toEqual({ r: 30, g: 144, b: 255, a: 1 });
    expect(p('f0f')).toEqual({ r: 255, g: 0, b: 255, a: 1 });
    expect(p('#00000080').a).toBeCloseTo(0.502, 2);
    expect(p('rgb(30, 144, 255)')).toEqual({ r: 30, g: 144, b: 255, a: 1 });
    expect(p('rgb(100% 0% 0% / 50%)')).toEqual({ r: 255, g: 0, b: 0, a: 0.5 });
    expect(toHex(p('hsl(210 100% 50%)'))).toBe('#0080ff');
    expect(toHex(p('hsla(0.5turn, 100%, 50%, 0.2)'))).toBe('#00ffff33');
  });
  it('rejects junk', () => {
    expect(parseColor('#12')).toMatchObject({ ok: false });
    expect(parseColor('rgb(1,2)')).toMatchObject({ ok: false });
    expect(parseColor('')).toMatchObject({ ok: false });
  });
});

describe('format', () => {
  const c = p('#1e90ff');
  it('to every space', () => {
    expect(toRgbString(c)).toBe('rgb(30 144 255)');
    expect(toHslString(c)).toBe('hsl(209.6 100% 55.9%)');
    expect(toOklchString(p('#ffffff'))).toBe('oklch(100% 0 0)');
    expect(toOklchString(p('#ff0000'))).toBe('oklch(62.8% 0.2577 29.23)');
    expect(toRgbString({ ...c, a: 0.5 })).toBe('rgb(30 144 255 / 0.5)');
  });
});

describe('contrast', () => {
  const black: Rgba = { r: 0, g: 0, b: 0, a: 1 };
  const white: Rgba = { r: 255, g: 255, b: 255, a: 1 };
  it('matches WCAG reference values', () => {
    expect(contrastRatio(black, white)).toBeCloseTo(21, 5);
    expect(contrastRatio(white, white)).toBeCloseTo(1, 5);
    expect(contrastRatio(p('#767676'), white)).toBeCloseTo(4.54, 2);
  });
  it('composites translucent foregrounds', () => {
    expect(contrastRatio({ ...black, a: 0.5 }, white)).toBeCloseTo(contrastRatio(p('#808080'), white), 1);
  });
  it('wcag levels and suggestions', () => {
    expect(wcag(4.6)).toEqual({ aaNormal: true, aaLarge: true, aaaNormal: false, aaaLarge: true, ui: true });
    const s = suggestForeground(p('#999999'), white);
    expect(s && contrastRatio(s, white)).toBeGreaterThanOrEqual(4.5);
    expect(suggestForeground(p('#777'), p('#777'), 22)).toBeNull();
  });
});
