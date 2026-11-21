import { lazy } from 'react';
import type { ToolMeta } from '@/lib/types';

const meta: ToolMeta = {
  slug: 'case-converter',
  name: 'Case Converter',
  description: 'Convert text and identifiers between camelCase, snake_case, kebab-case, PascalCase, Title Case and more.',
  category: 'text',
  keywords: ['case', 'camelcase', 'snake_case', 'kebab-case', 'pascalcase', 'title case', 'uppercase', 'lowercase', 'convert'],
  component: lazy(() => import('./CaseConverter')),
};
export default meta;
