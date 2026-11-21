import { format, type SqlLanguage } from 'sql-formatter';

export const DIALECTS: { value: SqlLanguage; label: string }[] = [
  { value: 'sql', label: 'Standard SQL' },
  { value: 'postgresql', label: 'PostgreSQL' },
  { value: 'mysql', label: 'MySQL' },
  { value: 'mariadb', label: 'MariaDB' },
  { value: 'sqlite', label: 'SQLite' },
  { value: 'tsql', label: 'SQL Server (T-SQL)' },
  { value: 'bigquery', label: 'BigQuery' },
  { value: 'snowflake', label: 'Snowflake' },
  { value: 'redshift', label: 'Redshift' },
  { value: 'duckdb', label: 'DuckDB' },
  { value: 'plsql', label: 'Oracle PL/SQL' },
  { value: 'spark', label: 'Spark SQL' },
  { value: 'trino', label: 'Trino / Presto' },
];

export interface SqlOptions {
  language: SqlLanguage;
  keywordCase: 'preserve' | 'upper' | 'lower';
  tabWidth: number;
  linesBetweenQueries: number;
}

export type Result<T> = { ok: true; value: T } | { ok: false; error: string };

export function formatSql(sql: string, o: SqlOptions): Result<string> {
  if (!sql.trim()) return { ok: true, value: '' };
  try {
    return { ok: true, value: format(sql, { language: o.language, keywordCase: o.keywordCase, tabWidth: o.tabWidth, linesBetweenQueries: o.linesBetweenQueries }) };
  } catch (e) {
    return { ok: false, error: `Could not format: ${(e instanceof Error ? e.message : String(e)).split('\n')[0]}` };
  }
}

/** Collapse whitespace and drop comments, leaving string literals untouched. */
export function minifySql(sql: string): string {
  let out = '';
  let pendingSpace = false;
  const emit = (t: string) => {
    const punct = /^[(),;]/.test(t);
    if (pendingSpace && out && !punct && !out.endsWith('(')) out += ' ';
    pendingSpace = false;
    out += t;
    if (t === ',') pendingSpace = true;
  };
  let i = 0;
  while (i < sql.length) {
    const c = sql[i]!;
    if (c === "'" || c === '"' || c === '`') {
      let j = i + 1;
      while (j < sql.length && !(sql[j] === c && sql[j + 1] !== c)) j += sql[j] === c ? 2 : 1;
      emit(sql.slice(i, j + 1));
      i = j + 1;
    } else if (c === '-' && sql[i + 1] === '-') {
      const nl = sql.indexOf('\n', i);
      i = nl < 0 ? sql.length : nl;
    } else if (c === '/' && sql[i + 1] === '*') {
      const end = sql.indexOf('*/', i + 2);
      i = end < 0 ? sql.length : end + 2;
      pendingSpace = true;
    } else if (/\s/.test(c)) {
      pendingSpace = true;
      i++;
    } else {
      let j = i + 1;
      if (!/[(),;]/.test(c)) while (j < sql.length && !/[\s(),;'"`]/.test(sql[j]!) && !(sql[j] === '-' && sql[j + 1] === '-')) j++;
      emit(sql.slice(i, j));
      i = j;
    }
  }
  return out.trim();
}
