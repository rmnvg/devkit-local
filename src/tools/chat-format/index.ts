import { lazy } from 'react';
import type { ToolMeta } from '@/lib/types';

const meta: ToolMeta = {
  slug: 'chat-format',
  name: 'Chat Format Converter',
  description: 'Convert message arrays between OpenAI, Anthropic and Gemini formats, including tool calls and images.',
  category: 'ai',
  keywords: ['messages', 'chat', 'openai', 'anthropic', 'claude', 'gemini', 'convert', 'tool calls', 'system prompt', 'contents'],
  component: lazy(() => import('./ChatFormat')),
  isNew: true,
};
export default meta;
