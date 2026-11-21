import { lazy } from 'react';
import type { ToolMeta } from '@/lib/types';

const meta: ToolMeta = {
  slug: 'markdown-preview',
  name: 'Markdown Preview',
  description: 'Live GitHub-flavored Markdown preview with sanitized HTML output and export.',
  category: 'text',
  keywords: ['markdown', 'md', 'preview', 'gfm', 'readme', 'html', 'render'],
  component: lazy(() => import('./MarkdownPreview')),
};
export default meta;
