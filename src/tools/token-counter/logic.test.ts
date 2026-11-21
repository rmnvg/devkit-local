import { Tiktoken } from 'js-tiktoken/lite';
import o200k from 'js-tiktoken/ranks/o200k_base';
import cl100k from 'js-tiktoken/ranks/cl100k_base';
import { textStats, tokenize, visiblePiece } from './logic';

const o200 = new Tiktoken(o200k);
const cl100 = new Tiktoken(cl100k);

describe('textStats', () => {
  it('counts chars, words, lines', () => {
    expect(textStats('hello world\nfoo')).toEqual({ characters: 15, words: 3, lines: 2 });
  });
  it('counts code points, not UTF-16 units', () => {
    expect(textStats('🌍🌍').characters).toBe(2);
  });
  it('handles empty and whitespace-only', () => {
    expect(textStats('')).toEqual({ characters: 0, words: 0, lines: 0 });
    expect(textStats('   \n ').words).toBe(0);
  });
});

describe('tokenize', () => {
  it('matches known counts', () => {
    expect(tokenize(o200, 'hello world').count).toBe(2);
    expect(tokenize(cl100, 'hello world').count).toBe(2);
  });
  it('pieces join back to the original text', () => {
    const text = 'The quick brown fox, jumps!';
    expect(tokenize(o200, text).pieces.join('')).toBe(text);
  });
  it('truncates visualization but not the count', () => {
    const r = tokenize(o200, 'word '.repeat(100), 10);
    expect(r.pieces).toHaveLength(10);
    expect(r.truncated).toBe(true);
    expect(r.count).toBeGreaterThan(10);
  });
  it('empty text', () => {
    expect(tokenize(o200, '')).toEqual({ count: 0, pieces: [], truncated: false });
  });
  it('visiblePiece marks whitespace', () => {
    expect(visiblePiece('a\tb\n')).toBe('a→b↵\n');
  });
});

describe('multi-byte tokens', () => {
  it('groups partial-character tokens into whole characters', () => {
    const text = 'key? 🙏 ok';
    const r = tokenize(o200, text);
    expect(r.pieces.join('')).toBe(text);
    expect(r.pieces.some((p) => p.includes('�'))).toBe(false);
    expect(r.count).toBeGreaterThanOrEqual(r.pieces.length);
  });
});
