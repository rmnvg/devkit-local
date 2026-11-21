import { lazy } from 'react';
import type { ToolMeta } from '@/lib/types';

const meta: ToolMeta = {
  slug: 'cosine-similarity',
  name: 'Cosine Similarity',
  description: 'Compare two embedding vectors: cosine similarity, dot product, norms and distance.',
  category: 'ai',
  keywords: ['embedding', 'vector', 'cosine', 'similarity', 'dot product', 'norm', 'rag', 'distance'],
  component: lazy(() => import('./CosineSimilarity')),
  isNew: true,
};
export default meta;
