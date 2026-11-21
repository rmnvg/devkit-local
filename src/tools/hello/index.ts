import { lazy } from 'react';
import type { ToolMeta } from '@/lib/types';

const meta: ToolMeta = {
  slug: 'hello',
  name: 'Hello',
  description: 'Dummy tool proving the plugin pattern: upper-cases text.',
  category: 'misc',
  keywords: ['hello', 'demo', 'uppercase'],
  component: lazy(() => import('./Hello')),
};
export default meta;
