import { lazy } from 'react';
import type { ToolMeta } from '@/lib/types';

const meta: ToolMeta = {
  slug: 'sql-formatter',
  name: 'SQL Formatter',
  description: 'Format or minify SQL for PostgreSQL, MySQL, SQLite, BigQuery, Snowflake, T-SQL and more.',
  category: 'json',
  keywords: ['sql', 'format', 'beautify', 'prettify', 'minify', 'postgres', 'mysql', 'query'],
  component: lazy(() => import('./SqlFormatter')),
};
export default meta;
