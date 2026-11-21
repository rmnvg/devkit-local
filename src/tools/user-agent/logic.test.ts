import { parseUa } from './logic';

describe('user agent', () => {
  it('parses desktop Chrome on macOS', () => {
    const r = parseUa('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36');
    expect(r.browser).toBe('Chrome 131.0.0.0');
    expect(r.engine).toMatch(/^Blink/);
    expect(r.os).toMatch(/^Mac OS/);
    expect(r.bot).toBeNull();
  });
  it('parses iPhone Safari as mobile', () => {
    const r = parseUa('Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1');
    expect(r.browser).toMatch(/Safari 17\.5/);
    expect(r.os).toBe('iOS 17.5');
    expect(r.device).toMatch(/^mobile/);
  });
  it('detects AI crawlers and bots', () => {
    expect(parseUa('Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; ClaudeBot/1.0; +claudebot@anthropic.com)').bot).toBe('Anthropic ClaudeBot');
    expect(parseUa('Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; GPTBot/1.2; +https://openai.com/gptbot').bot).toBe('OpenAI GPTBot');
    expect(parseUa('curl/8.7.1').bot).toBe('curl');
  });
  it('handles empty input', () => {
    expect(parseUa('').browser).toBe('Unknown');
  });
});
