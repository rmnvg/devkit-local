/** Color parsing/conversion and WCAG 2.x contrast. Colors are sRGB with alpha. */
export interface Rgba { r: number; g: number; b: number; a: number }
export type Result<T> = { ok: true; value: T } | { ok: false; error: string };

const clamp = (n: number, lo = 0, hi = 255) => Math.min(hi, Math.max(lo, n));
const NUM = String.raw`[-+]?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?`;

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  h = ((h % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return [(r + m) * 255, (g + m) * 255, (b + m) * 255];
}

export function rgbToHsl({ r, g, b }: Rgba): [number, number, number] {
  const R = r / 255, G = g / 255, B = b / 255;
  const max = Math.max(R, G, B), min = Math.min(R, G, B);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h = max === R ? (G - B) / d + (G < B ? 6 : 0) : max === G ? (B - R) / d + 2 : (R - G) / d + 4;
  return [h * 60, s, l];
}

export function parseColor(input: string): Result<Rgba> {
  const s = input.trim().toLowerCase();
  if (!s) return { ok: false, error: 'Enter a color.' };
  if (s === 'transparent') return { ok: true, value: { r: 0, g: 0, b: 0, a: 0 } };
  let m = /^#?([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/.exec(s);
  if (m) {
    let h = m[1]!;
    if (h.length <= 4) h = [...h].map((c) => c + c).join('');
    const n = (i: number) => parseInt(h.slice(i, i + 2), 16);
    return { ok: true, value: { r: n(0), g: n(2), b: n(4), a: h.length === 8 ? n(6) / 255 : 1 } };
  }
  const alpha = (v?: string) => (v === undefined ? 1 : v.endsWith('%') ? parseFloat(v) / 100 : parseFloat(v));
  m = new RegExp(`^rgba?\\(\\s*(${NUM}%?)[\\s,]+(${NUM}%?)[\\s,]+(${NUM}%?)(?:\\s*[,/]\\s*(${NUM}%?))?\\s*\\)$`).exec(s);
  if (m) {
    const ch = (v: string) => clamp(v.endsWith('%') ? (parseFloat(v) / 100) * 255 : parseFloat(v));
    return { ok: true, value: { r: ch(m[1]!), g: ch(m[2]!), b: ch(m[3]!), a: clamp(alpha(m[4]), 0, 1) } };
  }
  m = new RegExp(`^hsla?\\(\\s*(${NUM})(deg|turn|rad)?[\\s,]+(${NUM})%[\\s,]+(${NUM})%(?:\\s*[,/]\\s*(${NUM}%?))?\\s*\\)$`).exec(s);
  if (m) {
    let h = parseFloat(m[1]!);
    if (m[2] === 'turn') h *= 360;
    if (m[2] === 'rad') h = (h * 180) / Math.PI;
    const [r, g, b] = hslToRgb(h, clamp(parseFloat(m[3]!), 0, 100) / 100, clamp(parseFloat(m[4]!), 0, 100) / 100);
    return { ok: true, value: { r, g, b, a: clamp(alpha(m[5]), 0, 1) } };
  }
  return { ok: false, error: 'Use a hex (#1e90ff), rgb(), hsl() or CSS named color.' };
}

const r2 = (n: number, d = 0) => Number(n.toFixed(d));

export function toHex({ r, g, b, a }: Rgba): string {
  const h = (n: number) => Math.round(n).toString(16).padStart(2, '0');
  return `#${h(r)}${h(g)}${h(b)}${a < 1 ? h(a * 255) : ''}`;
}
export function toRgbString({ r, g, b, a }: Rgba): string {
  return a < 1 ? `rgb(${Math.round(r)} ${Math.round(g)} ${Math.round(b)} / ${r2(a, 3)})` : `rgb(${Math.round(r)} ${Math.round(g)} ${Math.round(b)})`;
}
export function toHslString(c: Rgba): string {
  const [h, s, l] = rgbToHsl(c);
  return `hsl(${r2(h, 1)} ${r2(s * 100, 1)}% ${r2(l * 100, 1)}%${c.a < 1 ? ` / ${r2(c.a, 3)}` : ''})`;
}

const lin = (v: number) => { const c = v / 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };

/** OKLCH via OKLab (Björn Ottosson). */
export function toOklchString(c: Rgba): string {
  const R = lin(c.r), G = lin(c.g), B = lin(c.b);
  const l = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B);
  const m = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B);
  const s = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const b = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  const C = Math.sqrt(a * a + b * b);
  const H = C < 1e-4 ? 0 : ((Math.atan2(b, a) * 180) / Math.PI + 360) % 360;
  return `oklch(${r2(L * 100, 2)}% ${r2(C, 4)} ${r2(H, 2)}${c.a < 1 ? ` / ${r2(c.a, 3)}` : ''})`;
}

export function luminance(c: Rgba): number {
  return 0.2126 * lin(c.r) + 0.7152 * lin(c.g) + 0.0722 * lin(c.b);
}

/** Alpha-composite fg over an opaque bg. */
export function over(fg: Rgba, bg: Rgba): Rgba {
  return { r: fg.r * fg.a + bg.r * (1 - fg.a), g: fg.g * fg.a + bg.g * (1 - fg.a), b: fg.b * fg.a + bg.b * (1 - fg.a), a: 1 };
}

export function contrastRatio(fg: Rgba, bg: Rgba): number {
  const f = luminance(over(fg, { ...bg, a: 1 }));
  const b = luminance({ ...bg, a: 1 });
  const [hi, lo] = f > b ? [f, b] : [b, f];
  return (hi + 0.05) / (lo + 0.05);
}

export function wcag(ratio: number) {
  return { aaNormal: ratio >= 4.5, aaLarge: ratio >= 3, aaaNormal: ratio >= 7, aaaLarge: ratio >= 4.5, ui: ratio >= 3 };
}

/** Nearest foreground (by HSL lightness) that reaches `target` contrast on bg; null if impossible. */
export function suggestForeground(fg: Rgba, bg: Rgba, target = 4.5): Rgba | null {
  if (contrastRatio(fg, bg) >= target) return fg;
  const [h, s, l] = rgbToHsl(fg);
  for (let d = 0.01; d <= 1; d += 0.01) {
    for (const nl of [l - d, l + d]) {
      if (nl < 0 || nl > 1) continue;
      const [r, g, b] = hslToRgb(h, s, nl);
      const c = { r, g, b, a: fg.a };
      if (contrastRatio(c, bg) >= target) return c;
    }
  }
  return null;
}
