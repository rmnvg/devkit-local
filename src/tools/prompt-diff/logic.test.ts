import { diffPrompts, formatDelta, toUnified, type DiffResult } from './logic';

const ok = (r: ReturnType<typeof diffPrompts>) => {
  if ('error' in r) throw new Error(r.error);
  return r as DiffResult;
};

describe('prompt diff', () => {
  it('word-level diff with counts and side-by-side views', () => {
    const r = ok(diffPrompts('You are a helpful assistant.', 'You are a concise, helpful assistant.', 'words'));
    expect(r.added).toBe(1);
    expect(r.removed).toBe(0);
    expect(toUnified(r.parts)).toBe('You are a {+concise, +}helpful assistant.');
    expect(r.left.map((p) => p.value).join('')).toBe('You are a helpful assistant.');
    expect(r.right.map((p) => p.value).join('')).toBe('You are a concise, helpful assistant.');
  });
  it('replacements count both sides', () => {
    const r = ok(diffPrompts('reply in English', 'reply in French', 'words'));
    expect([r.added, r.removed]).toEqual([1, 1]);
  });
  it('line and char modes', () => {
    expect(ok(diffPrompts('a\nb\n', 'a\nc\n', 'lines'))).toMatchObject({ added: 1, removed: 1 });
    expect(ok(diffPrompts('cat', 'cart', 'chars'))).toMatchObject({ added: 1, removed: 0 });
  });
  it('identical and ignore case', () => {
    expect(ok(diffPrompts('same', 'same', 'words')).identical).toBe(true);
    expect(ok(diffPrompts('Hello', 'hello', 'words', true)).identical).toBe(true);
  });
  it('rejects huge input', () => {
    expect(diffPrompts('a'.repeat(300_000), 'b'.repeat(200_000), 'words')).toHaveProperty('error');
  });
  it('formats token deltas', () => {
    expect(formatDelta(100, 120)).toBe('+20 (+20.0%)');
    expect(formatDelta(100, 90)).toBe('-10 (-10.0%)');
    expect(formatDelta(0, 0)).toBe('0 (0.0%)');
  });
});

it('line mode honours ignore case', () => {
  expect(ok(diffPrompts('Alpha\nbeta\n', 'alpha\nbeta\n', 'lines', true)).identical).toBe(true);
  expect(ok(diffPrompts('Alpha\nbeta', 'alpha\nbeta', 'lines')).removed).toBe(1);
});
