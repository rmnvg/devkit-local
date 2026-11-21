import { lazy } from 'react';
import type { ToolMeta } from '@/lib/types';

const meta: ToolMeta = {
  slug: 'lorem-ipsum',
  name: 'Lorem Ipsum Generator',
  description: 'Generate placeholder paragraphs, sentences or words, as plain text or HTML.',
  category: 'text',
  keywords: ['lorem ipsum', 'placeholder', 'dummy text', 'filler', 'generator'],
  component: lazy(() => import('./LoremIpsum')),
};
export default meta;
