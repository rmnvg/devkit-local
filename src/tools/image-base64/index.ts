import { lazy } from 'react';
import type { ToolMeta } from '@/lib/types';

const meta: ToolMeta = {
  slug: 'image-base64',
  name: 'Image → Base64',
  description: 'Turn an image into a Base64 data URI with ready-to-paste HTML, CSS and Markdown snippets.',
  category: 'misc',
  keywords: ['image', 'base64', 'data uri', 'inline', 'embed', 'png', 'svg', 'css background'],
  component: lazy(() => import('./ImageBase64')),
};
export default meta;
