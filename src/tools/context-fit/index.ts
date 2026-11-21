import { lazy } from 'react';
import type { ToolMeta } from '@/lib/types';

const meta: ToolMeta = {
  slug: 'context-fit',
  name: 'Context Window Fit',
  description: 'See how much of each model’s context window your prompt and expected output use.',
  category: 'ai',
  keywords: ['context', 'window', 'limit', 'fit', 'tokens', 'llm', 'claude', 'gpt', 'gemini'],
  component: lazy(() => import('./ContextFit')),
  isNew: true,
};
export default meta;
