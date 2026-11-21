import { lazy } from 'react';
import type { ToolMeta } from '@/lib/types';

const meta: ToolMeta = {
  slug: 'text-diff',
  name: 'Text Diff',
  description: 'Compare two texts line by line or word by word, side by side or as a unified patch.',
  category: 'text',
  keywords: ['diff', 'compare', 'text', 'patch', 'unified diff', 'changes', 'merge'],
  component: lazy(() => import('./TextDiff')),
};
export default meta;
