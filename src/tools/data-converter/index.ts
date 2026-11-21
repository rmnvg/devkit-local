import { lazy } from 'react';
import type { ToolMeta } from '@/lib/types';

const meta: ToolMeta = {
  slug: 'data-converter',
  name: 'JSON ↔ YAML ↔ CSV ↔ XML',
  description: 'Convert data between JSON, YAML, CSV and XML, with CSV delimiter and flattening options.',
  category: 'json',
  keywords: ['convert', 'json', 'yaml', 'yml', 'csv', 'xml', 'tsv', 'flatten', 'converter'],
  component: lazy(() => import('./DataConverter')),
};
export default meta;
