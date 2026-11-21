import { formatSql, minifySql, type SqlOptions } from './logic';

const o: SqlOptions = { language: 'postgresql', keywordCase: 'upper', tabWidth: 2, linesBetweenQueries: 1 };

describe('sql formatter', () => {
  it('formats and upper-cases keywords', () => {
    const r = formatSql('select id, name from users where active = true order by name', o);
    expect(r).toEqual({ ok: true, value: 'SELECT\n  id,\n  name\nFROM\n  users\nWHERE\n  active = TRUE\nORDER BY\n  name' });
  });
  it('empty input', () => {
    expect(formatSql('  ', o)).toEqual({ ok: true, value: '' });
  });
  it('reports parse errors', () => {
    expect(formatSql("select 'unterminated", o)).toMatchObject({ ok: false, error: /Could not format/ });
  });
  it('minifies but keeps strings and drops comments', () => {
    expect(minifySql("SELECT  a ,\n b -- note\nFROM t /* x */ WHERE s = 'a  b'")).toBe("SELECT a, b FROM t WHERE s = 'a  b'");
    expect(minifySql("SELECT f( x , 'it''s  ok' ) ;")).toBe("SELECT f(x, 'it''s  ok');");
  });
});
