import { base64Size, mediaTypeFor, snippets } from './logic';

describe('image to base64', () => {
  it('builds snippets', () => {
    const s = snippets('data:image/png;base64,AAAA', 'my-logo_v2.png', 10, 20);
    expect(s['HTML <img>']).toBe('<img src="data:image/png;base64,AAAA" alt="my logo v2" width="10" height="20" />');
    expect(s['CSS background']).toBe('background-image: url("data:image/png;base64,AAAA");');
    expect(s['Base64 only']).toBe('AAAA');
    expect(s.Markdown).toBe('![my logo v2](data:image/png;base64,AAAA)');
  });
  it('sizes and media types', () => {
    expect(base64Size(3)).toBe(4);
    expect(base64Size(4)).toBe(8);
    expect(mediaTypeFor('a.SVG', '')).toBe('image/svg+xml');
    expect(mediaTypeFor('x', 'image/webp')).toBe('image/webp');
    expect(mediaTypeFor('x.bin', '')).toBe('application/octet-stream');
  });
});
