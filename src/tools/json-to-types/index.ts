import { lazy } from 'react';
import type { ToolMeta } from '@/lib/types';

const meta: ToolMeta = {
  slug: 'json-to-types',
  name: 'JSON → Types',
  description: 'Generate TypeScript interfaces, Pydantic v2 models, Go structs or Zod schemas from JSON.',
  category: 'json',
  keywords: ['typescript', 'interface', 'pydantic', 'python', 'go', 'golang', 'struct', 'zod', 'schema', 'types', 'quicktype'],
  component: lazy(() => import('./JsonToTypes')),
};
export default meta;
