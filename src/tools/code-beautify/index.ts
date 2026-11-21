import { lazy } from 'react';
import type { ToolMeta } from '@/lib/types';

const meta: ToolMeta = {
  slug: 'code-beautify',
  name: 'HTML / CSS / JS Beautify & Minify',
  description: 'Pretty-print or minify HTML, CSS and JavaScript, with size savings.',
  category: 'text',
  keywords: ['beautify', 'minify', 'format', 'prettify', 'html', 'css', 'javascript', 'js', 'uglify', 'terser'],
  component: lazy(() => import('./CodeBeautify')),
};
export default meta;
