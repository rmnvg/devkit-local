import { lazy } from 'react';
import type { ToolMeta } from '@/lib/types';

const meta: ToolMeta = {
  slug: 'schema-converter',
  name: 'Tool Schema Converter',
  description: 'Convert tool definitions between JSON Schema, OpenAI, Anthropic and Gemini — or generate one from a JSON sample.',
  category: 'ai',
  keywords: ['function calling', 'tool use', 'json schema', 'openai', 'anthropic', 'claude', 'gemini', 'function declaration', 'strict', 'structured outputs'],
  component: lazy(() => import('./SchemaConverter')),
  isNew: true,
};
export default meta;
