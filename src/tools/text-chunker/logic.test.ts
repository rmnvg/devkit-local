import { Tiktoken } from 'js-tiktoken/lite';
import o200k from 'js-tiktoken/ranks/o200k_base';
import { chunkByChars, chunkRecursive, chunkText, parseSeparators, stats, validate, DEFAULT_SEPARATORS, type ChunkOptions } from './logic';

const enc = new Tiktoken(o200k);
const len = (s: string) => s.length;
const base: ChunkOptions = { mode: 'recursive', size: 50, overlap: 0, separators: DEFAULT_SEPARATORS, measureTokens: false };

describe('validation', () => {
  it('rejects bad sizes', () => {
    expect(validate({ ...base, size: 0 })).toMatch(/at least 1/);
    expect(validate({ ...base, overlap: 50 })).toMatch(/smaller/);
    expect(validate({ ...base, overlap: -1 })).toMatch(/zero or more/);
    expect(chunkText('x', { ...base, size: 10, overlap: 10 }, enc)).toMatchObject({ ok: false });
  });
});

describe('characters', () => {
  it('splits with overlap', () => {
    expect(chunkByChars('abcdefghij', 4, 1)).toEqual(['abcd', 'defg', 'ghij']);
    expect(chunkByChars('abc', 10, 2)).toEqual(['abc']);
  });
  it('never splits emoji', () => {
    expect(chunkByChars('😀😀😀', 2, 0)).toEqual(['😀😀', '😀']);
  });
});

describe('tokens', () => {
  it('windows over tokens and respects size', () => {
    const text = 'one two three four five six seven eight nine ten';
    const r = chunkText(text, { ...base, mode: 'tokens', size: 4, overlap: 1 }, enc);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.every((c) => c.tokens <= 4)).toBe(true);
    expect(r.value[0]!.text).toBe('one two three four');
    expect(r.value[1]!.text.startsWith(' four')).toBe(true);
  });
});

describe('recursive', () => {
  const doc = 'Para one is here.\n\nPara two is a bit longer than one.\n\nThree.';
  it('prefers paragraph boundaries and joins back to the text', () => {
    const c = chunkRecursive(doc, 40, 0, DEFAULT_SEPARATORS, len);
    expect(c.join('')).toBe(doc);
    expect(c.every((x) => x.length <= 40)).toBe(true);
    expect(c[0]).toBe('Para one is here.\n\n');
  });
  it('falls back to smaller separators for long paragraphs', () => {
    const long = 'word '.repeat(30).trim();
    const c = chunkRecursive(long, 20, 0, DEFAULT_SEPARATORS, len);
    expect(c.every((x) => x.length <= 20)).toBe(true);
    expect(c.join('')).toBe(long);
  });
  it('adds overlap between chunks', () => {
    const c = chunkRecursive('a b c d e f g h', 6, 2, [' '], len);
    expect(c[0]).toBe('a b c ');
    expect(c[1]!.startsWith('c ')).toBe(true);
  });
  it('can measure in tokens', () => {
    const r = chunkText('alpha beta gamma delta epsilon zeta eta theta', { ...base, size: 3, measureTokens: true }, enc);
    expect(r.ok && r.value.every((c) => c.tokens <= 3)).toBe(true);
  });
  it('empty input', () => {
    expect(chunkText('', base, enc)).toEqual({ ok: true, value: [] });
  });
});

describe('helpers', () => {
  it('parses separators with escapes', () => {
    expect(parseSeparators('\\n\\n\n\\n\n \n')).toEqual(['\n\n', '\n', ' ', '']);
  });
  it('stats', () => {
    expect(stats([{ index: 0, text: 'a', chars: 1, tokens: 2 }, { index: 1, text: 'b', chars: 1, tokens: 4 }])).toEqual({ count: 2, minTokens: 2, maxTokens: 4, avgTokens: 3, totalTokens: 6 });
  });
});
