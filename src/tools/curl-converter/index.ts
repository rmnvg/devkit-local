import { lazy } from 'react';
import type { ToolMeta } from '@/lib/types';

const meta: ToolMeta = {
  slug: 'curl-converter',
  name: 'cURL Converter',
  description: 'Convert curl commands to JavaScript fetch, axios or Python requests code.',
  category: 'web',
  keywords: ['curl', 'fetch', 'axios', 'python', 'requests', 'convert', 'http', 'api', 'code generator'],
  component: lazy(() => import('./CurlConverter')),
  sensitive: true,
};
export default meta;
