import { lazy } from 'react';
import type { ToolMeta } from '@/lib/types';

const meta: ToolMeta = {
  slug: 'token-counter',
  name: 'Token Counter',
  description: 'Count tokens for OpenAI, Claude and Gemini models, with token boundary visualization.',
  category: 'ai',
  keywords: ['tokens', 'tiktoken', 'gpt', 'claude', 'gemini', 'llm', 'prompt', 'o200k', 'cl100k'],
  component: lazy(() => import('./TokenCounter')),
  isNew: true,
};
export default meta;
