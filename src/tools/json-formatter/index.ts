import { lazy } from 'react';
import type { ToolMeta } from '@/lib/types';

const meta: ToolMeta = {
  slug: 'json-formatter',
  name: 'JSON Formatter & Validator',
  description: 'Format, minify, sort and validate JSON with exact error positions and a tree view.',
  category: 'json',
  keywords: ['json', 'format', 'prettify', 'beautify', 'minify', 'validate', 'lint', 'tree', 'sort keys'],
  component: lazy(() => import('./JsonFormatter')),
};
export default meta;
