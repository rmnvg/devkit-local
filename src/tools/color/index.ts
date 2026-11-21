import { lazy } from 'react';
import type { ToolMeta } from '@/lib/types';

const meta: ToolMeta = {
  slug: 'color',
  name: 'Color Converter & Contrast',
  description: 'Convert colors between HEX, RGB, HSL and OKLCH, and check WCAG contrast with fix suggestions.',
  category: 'misc',
  keywords: ['color', 'colour', 'hex', 'rgb', 'hsl', 'oklch', 'contrast', 'wcag', 'accessibility', 'a11y', 'picker'],
  component: lazy(() => import('./Color')),
};
export default meta;
