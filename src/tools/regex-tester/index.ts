import { lazy } from 'react';
import type { ToolMeta } from '@/lib/types';

const meta: ToolMeta = {
  slug: 'regex-tester',
  name: 'Regex Tester',
  description: 'Test JavaScript regular expressions with live highlighting, groups and replace preview.',
  category: 'text',
  keywords: ['regex', 'regexp', 'regular expression', 'match', 'replace', 'pattern', 'capture group'],
  component: lazy(() => import('./RegexTester')),
};
export default meta;
