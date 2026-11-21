import { lazy } from 'react';
import type { ToolMeta } from '@/lib/types';

const meta: ToolMeta = {
  slug: 'prompt-diff',
  name: 'Prompt Diff',
  description: 'Compare two prompt versions side by side, word by word, with the token count change.',
  category: 'ai',
  keywords: ['diff', 'compare', 'prompt', 'version', 'changes', 'tokens', 'side by side'],
  component: lazy(() => import('./PromptDiff')),
  isNew: true,
};
export default meta;
