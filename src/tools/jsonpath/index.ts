import { lazy } from 'react';
import type { ToolMeta } from '@/lib/types';

const meta: ToolMeta = {
  slug: 'jsonpath',
  name: 'JSONPath Tester',
  description: 'Run JSONPath queries (filters, wildcards, recursive descent) against JSON and see matching paths.',
  category: 'json',
  keywords: ['jsonpath', 'query', 'json', 'filter', 'select', 'jq', 'path expression'],
  component: lazy(() => import('./JsonPathTester')),
};
export default meta;
