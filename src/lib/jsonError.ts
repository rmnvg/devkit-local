/**
 * Locate the first syntax error in JSON text. Engines word JSON.parse errors differently,
 * so we run a tiny validating scanner to get a reliable offset, line and column.
 */
export interface JsonErrorInfo {
  message: string;
  offset: number;
  line: number;
  column: number;
  /** the offending line with a caret marker beneath */
  excerpt: string;
}

class Fail extends Error {
  constructor(public msg: string, public pos: number) {
    super(msg);
  }
}

function scan(text: string): void {
  let i = 0;
  const ws = () => {
    while (i < text.length && ' \t\n\r'.includes(text[i]!)) i++;
  };
  const describe = (p: number) => (p >= text.length ? 'end of input' : `"${text[p]}"`);
  const value = (): void => {
    ws();
    const c = text[i];
    if (c === '{') {
      i++;
      ws();
      if (text[i] === '}') { i++; return; }
      for (;;) {
        ws();
        if (text[i] !== '"') throw new Fail(text[i] === '}' ? 'Trailing comma before "}"' : `Expected a property name in double quotes, found ${describe(i)}`, i);
        string();
        ws();
        if (text[i] !== ':') throw new Fail(`Expected ":" after property name, found ${describe(i)}`, i);
        i++;
        value();
        ws();
        if (text[i] === ',') { i++; continue; }
        if (text[i] === '}') { i++; return; }
        throw new Fail(`Expected "," or "}" in object, found ${describe(i)}`, i);
      }
    }
    if (c === '[') {
      i++;
      ws();
      if (text[i] === ']') { i++; return; }
      for (;;) {
        ws();
        if (text[i] === ']') throw new Fail('Trailing comma before "]"', i);
        value();
        ws();
        if (text[i] === ',') { i++; continue; }
        if (text[i] === ']') { i++; return; }
        throw new Fail(`Expected "," or "]" in array, found ${describe(i)}`, i);
      }
    }
    if (c === '"') return string();
    if (c === "'") throw new Fail('Strings must use double quotes', i);
    if (c === '-' || (c !== undefined && c >= '0' && c <= '9')) return number();
    for (const lit of ['true', 'false', 'null']) {
      if (text.startsWith(lit, i)) { i += lit.length; return; }
    }
    throw new Fail(i >= text.length ? 'Unexpected end of input' : `Unexpected ${describe(i)}`, i);
  };
  const string = () => {
    const start = i;
    i++;
    while (i < text.length) {
      const ch = text[i]!;
      if (ch === '"') { i++; return; }
      if (ch === '\\') {
        const e = text[i + 1];
        if (e === 'u') {
          if (!/^[0-9a-fA-F]{4}$/.test(text.slice(i + 2, i + 6))) throw new Fail('Invalid \\u escape', i);
          i += 6;
          continue;
        }
        if (e === undefined || !'"\\/bfnrt'.includes(e)) throw new Fail('Invalid escape sequence', i);
        i += 2;
        continue;
      }
      if (ch < ' ') throw new Fail(ch === '\n' ? 'Unescaped line break in string' : 'Control character in string', i);
      i++;
    }
    throw new Fail('Unterminated string', start);
  };
  const number = () => {
    const m = /^-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?/.exec(text.slice(i, i + 400));
    if (!m) throw new Fail('Invalid number', i);
    i += m[0].length;
  };
  value();
  ws();
  if (i < text.length) throw new Fail(`Unexpected ${describe(i)} after the JSON value`, i);
}

export function locateJsonError(text: string, fallbackMessage = 'Invalid JSON'): JsonErrorInfo {
  let message = fallbackMessage;
  let offset = 0;
  try {
    scan(text);
  } catch (e) {
    if (e instanceof Fail) {
      message = e.msg;
      offset = e.pos;
    }
  }
  const before = text.slice(0, offset);
  const line = before.split('\n').length;
  const lineStart = before.lastIndexOf('\n') + 1;
  const column = offset - lineStart + 1;
  let lineEnd = text.indexOf('\n', offset);
  if (lineEnd < 0) lineEnd = text.length;
  let lineText = text.slice(lineStart, lineEnd);
  let caretCol = column - 1;
  if (lineText.length > 120) {
    const from = Math.max(0, caretCol - 60);
    lineText = (from > 0 ? '…' : '') + lineText.slice(from, from + 120);
    caretCol = caretCol - from + (from > 0 ? 1 : 0);
  }
  return { message, offset, line, column, excerpt: `${lineText}\n${' '.repeat(caretCol)}^` };
}
