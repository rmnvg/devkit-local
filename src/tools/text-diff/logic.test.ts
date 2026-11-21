import { diffText, lineStats, unifiedDiff } from './logic';

describe('text diff', () => {
  const a = 'one\ntwo\nthree\nfour\n';
  const b = 'one\n2\nthree\nfour\nfive\n';
  it('produces a unified patch', () => {
    const p = unifiedDiff(a, b, { ignoreWhitespace: false, context: 3 });
    expect(p).toContain('--- original');
    expect(p).toContain('+++ modified');
    expect(p).toContain('-two\n+2');
    expect(p).toContain('+five');
    expect(lineStats(p)).toEqual({ added: 2, removed: 1, unchanged: 3 });
  });
  it('ignores whitespace differences when asked', () => {
    expect(lineStats(unifiedDiff('a  b\n', 'a b \n', { ignoreWhitespace: true, context: 3 }))).toEqual({ added: 0, removed: 0, unchanged: 0 });
  });
  it('reuses the word-level differ', () => {
    const r = diffText('the cat', 'the dog', 'words');
    expect('error' in r ? null : [r.added, r.removed]).toEqual([1, 1]);
  });
});
