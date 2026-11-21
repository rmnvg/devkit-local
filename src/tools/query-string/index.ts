import { lazy } from 'react';
import type { ToolMeta } from '@/lib/types';

const meta: ToolMeta = {
  slug: 'query-string',
  name: 'Query String Parser',
  description: 'Break a URL into decoded query parameters, edit them in a table, and rebuild the URL or JSON.',
  category: 'web',
  keywords: ['query string', 'url', 'parameters', 'params', 'parse', 'search params', 'utm'],
  component: lazy(() => import('./QueryString')),
};
export default meta;
