import { lazy } from 'react';
import type { ToolMeta } from '@/lib/types';

const meta: ToolMeta = {
  slug: 'word-counter',
  name: 'Word & Character Counter',
  description: 'Count words, characters, sentences, paragraphs, bytes and tokens, with reading time and top words.',
  category: 'text',
  keywords: ['word count', 'character count', 'letters', 'sentences', 'reading time', 'bytes', 'tokens', 'counter'],
  component: lazy(() => import('./WordCounter')),
};
export default meta;
