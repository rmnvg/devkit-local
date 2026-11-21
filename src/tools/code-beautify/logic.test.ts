import { beautifyCode, minifyCss, minifyHtml, minifyJs, sizeChange } from './logic';

const o = { indent: 2, useTabs: false };

describe('beautify', () => {
  it('formats JS, CSS and HTML', () => {
    expect(beautifyCode('function f(a){if(a){return 1}return 2}', 'js', o)).toEqual({ ok: true, value: 'function f(a) {\n  if (a) {\n    return 1\n  }\n  return 2\n}\n' });
    expect(beautifyCode('a{color:red;margin:0}', 'css', o)).toEqual({ ok: true, value: 'a {\n  color: red;\n  margin: 0\n}\n' });
    const h = beautifyCode('<div><p>hi</p></div>', 'html', o);
    expect(h.ok && h.value).toBe('<div>\n  <p>hi</p>\n</div>\n');
  });
  it('uses tabs when asked and handles empty input', () => {
    expect(beautifyCode('a{b:c}', 'css', { indent: 1, useTabs: true })).toEqual({ ok: true, value: 'a {\n\tb: c\n}\n' });
    expect(beautifyCode('  ', 'js', o)).toEqual({ ok: true, value: '' });
  });
});

describe('minify', () => {
  it('CSS keeps strings and needed spaces', () => {
    expect(minifyCss('/* c */\na  >  b , c {\n  margin : 0 auto ;\n  content: "a  b";\n}\n@media (min-width: 10px) { x { y: z } }')).toBe('a>b,c{margin:0 auto;content:"a  b"}@media (min-width:10px){x{y:z}}');
  });
  it('HTML collapses whitespace but not inside pre', () => {
    expect(minifyHtml('<div>\n  <!-- x -->\n  <p>a   b</p>\n  <pre>  keep\n  this </pre>\n</div>')).toBe('<div><p>a b</p><pre>  keep\n  this </pre></div>');
  });
  it('JS via terser, with friendly errors', async () => {
    const r = await minifyJs('function add(first, second) { return first + second; }\nconsole.log(add(1, 2));');
    expect(r.ok && r.value.length).toBeLessThan(60);
    expect(await minifyJs('function (')).toMatchObject({ ok: false, error: /line 1/ });
  });
  it('reports size change', () => {
    expect(sizeChange('aaaa', 'aa')).toBe('4 → 2 bytes (−50.0%)');
  });
});
