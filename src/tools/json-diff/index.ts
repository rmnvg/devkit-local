import { lazy } from 'react';
import type { ToolMeta } from '@/lib/types';

const meta: ToolMeta = {
  slug: 'json-diff',
  name: 'JSON Diff',
  description: 'Compare two JSON documents structurally: added, removed and changed values by path, ignoring key order.',
  category: 'json',
  keywords: ['json', 'diff', 'compare', 'difference', 'changes', 'patch'],
  component: lazy(() => import('./JsonDiff')),
};
export default meta;
