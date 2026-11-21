import beautify from 'js-beautify';

export type Lang = 'html' | 'css' | 'js';
export type Result<T> = { ok: true; value: T } | { ok: false; error: string };

export interface BeautifyOptions {
  indent: number;
  useTabs: boolean;
}

export function beautifyCode(code: string, lang: Lang, o: BeautifyOptions): Result<string> {
  if (!code.trim()) return { ok: true, value: '' };
  const opts = { indent_size: o.indent, indent_char: o.useTabs ? '\t' : ' ', indent_with_tabs: o.useTabs, end_with_newline: true, preserve_newlines: true, max_preserve_newlines: 2 };
  try {
    const out = lang === 'html' ? beautify.html(code, { ...opts, wrap_line_length: 120, indent_inner_html: true }) : lang === 'css' ? beautify.css(code, opts) : beautify.js(code, opts);
    return { ok: true, value: out };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

/** Remove comments and collapse whitespace in CSS, keeping strings intact. */
export function minifyCss(css: string): string {
  let out = '';
  let i = 0;
  while (i < css.length) {
    const c = css[i]!;
    if (c === '"' || c === "'") {
      let j = i + 1;
      while (j < css.length && css[j] !== c) j += css[j] === '\\' ? 2 : 1;
      out += css.slice(i, j + 1);
      i = j + 1;
    } else if (c === '/' && css[i + 1] === '*') {
      const end = css.indexOf('*/', i + 2);
      i = end < 0 ? css.length : end + 2;
    } else if (/\s/.test(c)) {
      while (i < css.length && /\s/.test(css[i]!)) i++;
      const prev = out[out.length - 1] ?? '';
      const next = css[i] ?? '';
      if (prev && !/[{};:,>+~(]/.test(prev) && !/[{};:,>+~)!]/.test(next)) out += ' ';
    } else {
      out += c;
      i++;
    }
  }
  return out.replace(/;}/g, '}').trim();
}

/** Collapse whitespace between tags and remove comments; leaves <pre>, <textarea>, <script>, <style> alone. */
export function minifyHtml(html: string): string {
  const keep: string[] = [];
  const guarded = html.replace(/<(pre|textarea|script|style)\b[\s\S]*?<\/\1>/gi, (m) => {
    keep.push(m);
    return `<keep-${keep.length - 1}>`;
  });
  const min = guarded
    .replace(/<!--(?!\[if)[\s\S]*?-->/g, '')
    .replace(/>\s+</g, '><')
    .replace(/\s{2,}/g, ' ')
    .trim();
  return min.replace(/<keep-(\d+)>/g, (_, n: string) => keep[Number(n)]!);
}

export async function minifyJs(code: string): Promise<Result<string>> {
  if (!code.trim()) return { ok: true, value: '' };
  try {
    const { minify } = await import('terser');
    const r = await minify(code, { compress: true, mangle: true, format: { comments: false } });
    return { ok: true, value: r.code ?? '' };
  } catch (e) {
    const err = e as { message?: string; line?: number; col?: number };
    return { ok: false, error: `${err.message ?? String(e)}${err.line ? ` (line ${err.line}, column ${(err.col ?? 0) + 1})` : ''}` };
  }
}

export function sizeChange(before: string, after: string): string {
  const a = new TextEncoder().encode(before).length;
  const b = new TextEncoder().encode(after).length;
  if (!a) return '';
  return `${a.toLocaleString()} → ${b.toLocaleString()} bytes (${b <= a ? '−' : '+'}${Math.abs(((a - b) / a) * 100).toFixed(1)}%)`;
}
