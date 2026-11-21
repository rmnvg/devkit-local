import { fuzzyScore, searchTools } from './search';

const items = [
  { name: 'JWT Decoder', slug: 'jwt-decoder', description: 'Decode JSON Web Tokens', keywords: ['token', 'auth'] },
  { name: 'Token Counter', slug: 'token-counter', description: 'Count LLM tokens', keywords: ['tiktoken', 'gpt'] },
  { name: 'Regex Tester', slug: 'regex-tester', description: 'Test regular expressions', keywords: ['regexp'] },
];

describe('search', () => {
  it('scores exact > prefix > substring > subsequence > none', () => {
    const a = fuzzyScore('jwt', 'jwt');
    const b = fuzzyScore('jw', 'jwt decoder');
    const c = fuzzyScore('dec', 'jwt decoder');
    const d = fuzzyScore('jdr', 'jwt decoder');
    expect(a).toBeGreaterThan(b);
    expect(b).toBeGreaterThan(c);
    expect(c).toBeGreaterThan(d);
    expect(d).toBeGreaterThan(0);
    expect(fuzzyScore('xyz', 'jwt decoder')).toBe(0);
  });
  it('ranks by name over keyword', () => {
    expect(searchTools(items, 'token')[0]!.slug).toBe('token-counter');
  });
  it('matches keywords and fuzzy names', () => {
    expect(searchTools(items, 'tiktoken').map((i) => i.slug)).toEqual(['token-counter']);
    expect(searchTools(items, 'rgx')[0]!.slug).toBe('regex-tester');
  });
  it('empty query returns everything', () => {
    expect(searchTools(items, '  ')).toHaveLength(3);
  });
});
