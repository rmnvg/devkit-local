import { outline, renderMarkdown, toHtmlDocument } from './logic';

const o = { gfm: true, breaks: false };

describe('markdown', () => {
  it('renders common markdown and GFM tables/task lists', () => {
    const h = renderMarkdown('# Title\n\n**bold** and `code`\n\n| a | b |\n|---|---|\n| 1 | 2 |\n\n- [x] done', o);
    expect(h).toContain('<h1>Title</h1>');
    expect(h).toContain('<strong>bold</strong>');
    expect(h).toContain('<table>');
    expect(h).toContain('type="checkbox"');
  });
  it('sanitizes dangerous HTML', () => {
    const h = renderMarkdown('<script>alert(1)</script><img src=x onerror="alert(1)"><a href="javascript:alert(1)">x</a>[y](javascript:alert(2))', o);
    expect(h).not.toMatch(/<script|onerror|href="javascript:/i);
  });
  it('line breaks option', () => {
    expect(renderMarkdown('a\nb', { gfm: true, breaks: true })).toContain('<br>');
    expect(renderMarkdown('a\nb', o)).not.toContain('<br>');
  });
  it('builds an outline, ignoring code fences', () => {
    expect(outline('# A\n```\n# not\n```\n## B ##\n####### too deep')).toEqual([{ level: 1, text: 'A' }, { level: 2, text: 'B' }]);
  });
  it('wraps a standalone document', () => {
    expect(toHtmlDocument('<p>x</p>', 'T<')).toContain('<title>T&lt;</title>');
  });
});
