import { countText, formatMinutes } from './logic';

describe('word counter', () => {
  it('counts the basics', () => {
    const c = countText('Hello world. How are you?\n\nI am fine! Thanks.');
    expect(c.words).toBe(9);
    expect(c.sentences).toBe(4);
    expect(c.paragraphs).toBe(2);
    expect(c.lines).toBe(3);
    expect(c.characters).toBe(45);
    expect(c.charactersNoSpaces).toBe(36);
  });
  it('handles unicode and bytes', () => {
    const c = countText('naïve café 🌍');
    expect(c.words).toBe(2);
    expect(c.characters).toBe(12);
    expect(c.bytes).toBe(17);
  });
  it('top words skip stop words', () => {
    expect(countText('the model the model tokens model').topWords).toEqual([['model', 3], ['tokens', 1]]);
  });
  it('empty text', () => {
    expect(countText('')).toMatchObject({ words: 0, sentences: 0, paragraphs: 0, lines: 0 });
  });
  it('formats minutes', () => {
    expect(formatMinutes(0)).toBe('0 sec');
    expect(formatMinutes(0.25)).toBe('15 sec');
    expect(formatMinutes(2.5)).toBe('2 min 30 sec');
    expect(formatMinutes(3)).toBe('3 min');
  });
});
