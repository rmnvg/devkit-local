import { lazy } from 'react';
import type { ToolMeta } from '@/lib/types';

const meta: ToolMeta = {
  slug: 'uuid',
  name: 'UUID / ULID Generator',
  description: 'Generate UUID v4, UUID v7 and ULIDs in bulk, and inspect an ID’s version and timestamp.',
  category: 'auth',
  keywords: ['uuid', 'guid', 'ulid', 'v4', 'v7', 'random id', 'generate', 'unique id'],
  component: lazy(() => import('./Uuid')),
};
export default meta;
