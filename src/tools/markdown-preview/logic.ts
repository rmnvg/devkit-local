import { Marked } from 'marked';
import DOMPurify from 'dompurify';

export interface RenderOptions {
  gfm: boolean;
  breaks: boolean;
}

/** Markdown → sanitized HTML. Scripts, event handlers and javascript: URLs are removed. */
export function renderMarkdown(md: string, o: RenderOptions): string {
  const m = new Marked({ gfm: o.gfm, breaks: o.breaks, async: false });
  const raw = m.parse(md) as string;
  return DOMPurify.sanitize(raw, { USE_PROFILES: { html: true }, ADD_ATTR: ['target'] });
}

export interface Heading {
  level: number;
  text: string;
}

export function outline(md: string): Heading[] {
  const out: Heading[] = [];
  let fence = false;
  for (const line of md.split('\n')) {
    if (/^\s*(```|~~~)/.test(line)) fence = !fence;
    const h = !fence && /^(#{1,6})\s+(.+?)\s*#*\s*$/.exec(line);
    if (h) out.push({ level: h[1]!.length, text: h[2]! });
  }
  return out;
}

/** Wrap rendered HTML in a standalone document for download. */
export function toHtmlDocument(body: string, title = 'Document'): string {
  return `<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n<title>${title.replace(/</g, '&lt;')}</title>\n<style>body{font:16px/1.6 system-ui,sans-serif;max-width:46rem;margin:2rem auto;padding:0 1rem}pre{background:#f4f4f5;padding:1rem;overflow:auto}code{font-family:ui-monospace,monospace}table{border-collapse:collapse}td,th{border:1px solid #ddd;padding:.3rem .6rem}</style>\n</head>\n<body>\n${body}\n</body>\n</html>\n`;
}
