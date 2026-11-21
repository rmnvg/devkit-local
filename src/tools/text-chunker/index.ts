import { lazy } from 'react';
import type { ToolMeta } from '@/lib/types';

const meta: ToolMeta = {
  slug: 'text-chunker',
  name: 'Text Chunker',
  description: 'Split text into chunks by tokens, characters or separators with overlap — preview RAG chunking.',
  category: 'ai',
  keywords: ['chunk', 'split', 'rag', 'embedding', 'overlap', 'langchain', 'splitter', 'tokens', 'retrieval'],
  component: lazy(() => import('./TextChunker')),
  isNew: true,
};
export default meta;
