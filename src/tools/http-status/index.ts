import { lazy } from 'react';
import type { ToolMeta } from '@/lib/types';

const meta: ToolMeta = {
  slug: 'http-status',
  name: 'HTTP Status Codes',
  description: 'Searchable reference of HTTP status codes with plain-language explanations.',
  category: 'web',
  keywords: ['http', 'status', 'code', '404', '500', '429', 'response', 'reference', 'error'],
  component: lazy(() => import('./HttpStatus')),
};
export default meta;
