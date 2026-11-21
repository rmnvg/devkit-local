import { findVariables, render, lintTemplate } from './logic';

describe('prompt template', () => {
  const t = 'Hi {{name}}, you are {{ role }}. Bye {{name}}. Ctx: {{doc.title}}';
  it('finds variables with counts in order', () => {
    expect(findVariables(t)).toEqual([{ name: 'name', count: 2 }, { name: 'role', count: 1 }, { name: 'doc.title', count: 1 }]);
    expect(findVariables('no vars')).toEqual([]);
  });
  it('renders and reports missing', () => {
    const r = render(t, { name: 'Ada', role: 'admin', 'doc.title': '' });
    expect(r.text).toBe('Hi Ada, you are admin. Bye Ada. Ctx: {{doc.title}}');
    expect(r.missing).toEqual(['doc.title']);
  });
  it('does not re-expand values containing braces', () => {
    expect(render('{{a}}', { a: '{{b}}', b: 'x' }).text).toBe('{{b}}');
  });
  it('supports escaping', () => {
    expect(render('\\{{literal}} {{x}}', { x: '1' }).text).toBe('{{literal}} 1');
  });
  it('lints malformed braces', () => {
    expect(lintTemplate('{{ok}} {{ bad }')).toHaveLength(1);
    expect(lintTemplate('{{ok}}')).toEqual([]);
    expect(lintTemplate('oops }}')).toHaveLength(1);
  });
});
