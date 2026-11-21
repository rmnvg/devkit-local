import { lazy } from 'react';
import type { ToolMeta } from '@/lib/types';

const meta: ToolMeta = {
  slug: 'llm-cost',
  name: 'LLM Cost Calculator',
  description: 'Compare API costs across OpenAI, Claude and Gemini models per request, day and month.',
  category: 'ai',
  keywords: ['price', 'pricing', 'cost', 'budget', 'gpt', 'claude', 'gemini', 'tokens', 'cache'],
  component: lazy(() => import('./LlmCost')),
  isNew: true,
};
export default meta;
