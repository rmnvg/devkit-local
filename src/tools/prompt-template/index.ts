import { lazy } from 'react';
import type { ToolMeta } from '@/lib/types';

const meta: ToolMeta = {
  slug: 'prompt-template',
  name: 'Prompt Template Tester',
  description: 'Detect {{variables}} in a prompt, fill them in a form, and see the rendered prompt and token count.',
  category: 'ai',
  keywords: ['prompt', 'template', 'variables', 'mustache', 'handlebars', 'jinja', 'render', 'llm'],
  component: lazy(() => import('./PromptTemplate')),
  isNew: true,
};
export default meta;
