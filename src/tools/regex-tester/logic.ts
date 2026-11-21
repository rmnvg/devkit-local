export type Result<T> = { ok: true; value: T } | { ok: false; error: string };

export const FLAGS = ['g', 'i', 'm', 's', 'u', 'y'] as const;

export interface Match {
  index: number;
  end: number;
  text: string;
  groups: (string | undefined)[];
  named: Record<string, string | undefined>;
}

export interface RegexRun {
  matches: Match[];
  truncated: boolean;
  replaced: string | null;
}

export function compile(pattern: string, flags: string): Result<RegExp> {
  const bad = [...flags].find((f) => !(FLAGS as readonly string[]).includes(f));
  if (bad) return { ok: false, error: `Unsupported flag "${bad}".` };
  if (new Set(flags).size !== flags.length) return { ok: false, error: 'Duplicate flags.' };
  try {
    return { ok: true, value: new RegExp(pattern, flags) };
  } catch (e) {
    return { ok: false, error: (e instanceof Error ? e.message : String(e)).replace(/^Invalid regular expression: /, '') };
  }
}

export function findMatches(re: RegExp, text: string, limit = 1000): { matches: Match[]; truncated: boolean } {
  const matches: Match[] = [];
  const global = re.global || re.sticky;
  const r = new RegExp(re.source, re.flags);
  r.lastIndex = 0;
  while (matches.length < limit) {
    const m = r.exec(text);
    if (!m) break;
    matches.push({ index: m.index, end: m.index + m[0].length, text: m[0], groups: m.slice(1), named: { ...(m.groups ?? {}) } });
    if (!global) break;
    if (m[0].length === 0) {
      // avoid infinite loop on empty matches; step over a full code point in unicode mode
      const cp = text.codePointAt(r.lastIndex);
      r.lastIndex += r.unicode && cp !== undefined && cp > 0xffff ? 2 : 1;
      if (r.lastIndex > text.length) break;
    }
  }
  const truncated = matches.length >= limit && global && r.exec(text) !== null;
  return { matches, truncated };
}

export function run(pattern: string, flags: string, text: string, replacement: string | null, limit = 1000): Result<RegexRun> {
  if (!pattern) return { ok: true, value: { matches: [], truncated: false, replaced: replacement == null ? null : text } };
  const c = compile(pattern, flags);
  if (!c.ok) return c;
  const { matches, truncated } = findMatches(c.value, text, limit);
  return { ok: true, value: { matches, truncated, replaced: replacement == null ? null : text.replace(c.value, replacement) } };
}

export interface Segment {
  text: string;
  match: number | null;
}

/** Split text into plain and matched segments for highlighting. */
export function segments(text: string, matches: Match[]): Segment[] {
  const out: Segment[] = [];
  let pos = 0;
  matches.forEach((m, i) => {
    if (m.end === m.index) return;
    if (m.index > pos) out.push({ text: text.slice(pos, m.index), match: null });
    out.push({ text: text.slice(m.index, m.end), match: i });
    pos = m.end;
  });
  if (pos < text.length) out.push({ text: text.slice(pos), match: null });
  return out;
}

export const CHEATSHEET: [string, string][] = [
  ['.', 'Any character (except newline unless s)'],
  ['\\d \\w \\s', 'Digit, word char, whitespace'],
  ['\\D \\W \\S', 'Negated classes'],
  ['[abc] [^abc]', 'Character set / negated set'],
  ['^ $', 'Start / end (of line with m)'],
  ['\\b \\B', 'Word boundary / not'],
  ['* + ?', '0+, 1+, 0 or 1'],
  ['{n,m}', 'Between n and m times'],
  ['*? +?', 'Lazy quantifiers'],
  ['(…)', 'Capture group ($1)'],
  ['(?<name>…)', 'Named group ($<name>)'],
  ['(?:…)', 'Non-capturing group'],
  ['a|b', 'Alternation'],
  ['(?=…) (?!…)', 'Lookahead / negative'],
  ['(?<=…) (?<!…)', 'Lookbehind / negative'],
  ['\\p{L}', 'Unicode property (u flag)'],
];

/** Name (or undefined) of each capturing group, in order. */
export function groupNames(pattern: string): (string | undefined)[] {
  const out: (string | undefined)[] = [];
  let inClass = false;
  for (let i = 0; i < pattern.length; i++) {
    const c = pattern[i];
    if (c === '\\') { i++; continue; }
    if (inClass) { if (c === ']') inClass = false; continue; }
    if (c === '[') { inClass = true; continue; }
    if (c !== '(') continue;
    if (pattern[i + 1] !== '?') { out.push(undefined); continue; }
    const m = /^\?<([A-Za-z_$][\w$]*)>/.exec(pattern.slice(i + 1));
    if (m) out.push(m[1]);
  }
  return out;
}
