import { compile, findMatches, run, segments } from './logic';

describe('compile', () => {
  it('compiles and rejects bad patterns/flags', () => {
    expect(compile('a+', 'gi').ok).toBe(true);
    expect(compile('(', '')).toMatchObject({ ok: false, error: expect.stringMatching(/Unterminated group|missing \)/i) });
    expect(compile('a', 'x')).toMatchObject({ ok: false, error: 'Unsupported flag "x".' });
    expect(compile('a', 'gg')).toMatchObject({ ok: false, error: 'Duplicate flags.' });
  });
});

describe('findMatches', () => {
  it('finds all matches with numbered and named groups', () => {
    const re = /(?<user>\w+)@(\w+)\.com/g;
    const { matches } = findMatches(re, 'a@x.com, bob@y.com');
    expect(matches).toHaveLength(2);
    expect(matches[1]).toEqual({ index: 9, end: 18, text: 'bob@y.com', groups: ['bob', 'y'], named: { user: 'bob' } });
  });
  it('only first match without g', () => {
    expect(findMatches(/a/, 'aaa').matches).toHaveLength(1);
  });
  it('handles empty matches without looping', () => {
    expect(findMatches(/x*/g, 'abc').matches).toHaveLength(4);
    expect(findMatches(/(?:)/gu, '😀a').matches).toHaveLength(3);
  });
  it('truncates at the limit', () => {
    const r = findMatches(/a/g, 'a'.repeat(50), 10);
    expect(r.matches).toHaveLength(10);
    expect(r.truncated).toBe(true);
  });
  it('does not mutate the input regex', () => {
    const re = /a/g;
    findMatches(re, 'aaa');
    expect(re.lastIndex).toBe(0);
  });
});

describe('run & segments', () => {
  it('replaces with group references', () => {
    const r = run('(\\w+)@(\\w+)', 'g', 'ada@home', '$2 <- $1');
    expect(r.ok && r.value.replaced).toBe('home <- ada');
    const n = run('(?<y>\\d{4})-(?<m>\\d\\d)', '', '2026-11', '$<m>/$<y>');
    expect(n.ok && n.value.replaced).toBe('11/2026');
  });
  it('empty pattern means no matches', () => {
    expect(run('', 'g', 'abc', null)).toEqual({ ok: true, value: { matches: [], truncated: false, replaced: null } });
  });
  it('segments split text around matches', () => {
    const r = run('b+', 'g', 'abbcb', null);
    expect(r.ok && segments('abbcb', r.value.matches)).toEqual([
      { text: 'a', match: null },
      { text: 'bb', match: 0 },
      { text: 'c', match: null },
      { text: 'b', match: 1 },
    ]);
  });
});

import { groupNames } from './logic';
describe('groupNames', () => {
  it('maps capturing groups to names', () => {
    expect(groupNames('(?<a>x)(y)(?:z)(?=q)(?<!r)(?<b>\\(w\\))[(]')).toEqual(['a', undefined, 'b']);
  });
});
