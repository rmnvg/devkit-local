import { generate, type LoremOptions } from './logic';

const base: LoremOptions = { unit: 'paragraphs', count: 3, startWithLorem: true, html: false, seed: 42 };

describe('lorem ipsum', () => {
  it('generates paragraphs, starting with the classic phrase', () => {
    const t = generate(base);
    expect(t.split('\n\n')).toHaveLength(3);
    expect(t.startsWith('Lorem ipsum dolor sit amet, consectetur adipiscing elit. ')).toBe(true);
  });
  it('is deterministic per seed', () => {
    expect(generate(base)).toBe(generate(base));
    expect(generate(base)).not.toBe(generate({ ...base, seed: 7 }));
  });
  it('exact word counts and HTML', () => {
    expect(generate({ ...base, unit: 'words', count: 25 }).split(' ')).toHaveLength(25);
    expect(generate({ ...base, unit: 'words', count: 2 })).toBe('Lorem ipsum.');
    expect(generate({ ...base, html: true, count: 2 })).toMatch(/^<p>.*<\/p>\n<p>.*<\/p>$/);
  });
  it('sentences and clamping', () => {
    const t = generate({ ...base, unit: 'sentences', count: 5, startWithLorem: false });
    expect(t.match(/\./g)).toHaveLength(5);
    expect(generate({ ...base, count: 0 }).split('\n\n')).toHaveLength(1);
  });
});
