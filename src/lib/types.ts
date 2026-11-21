import type { ComponentType, LazyExoticComponent } from 'react';

export type ToolCategory = 'ai' | 'auth' | 'json' | 'web' | 'text' | 'time' | 'misc';

export interface ToolMeta {
  slug: string;
  name: string;
  description: string;
  category: ToolCategory;
  keywords: string[];
  component: LazyExoticComponent<ComponentType>;
  isNew?: boolean;
  /** true → share links omit inputs unless the user opts in */
  sensitive?: boolean;
}

export const CATEGORIES: { id: ToolCategory; label: string }[] = [
  { id: 'ai', label: 'AI / LLM' },
  { id: 'auth', label: 'Auth & Security' },
  { id: 'json', label: 'JSON & Data' },
  { id: 'web', label: 'Web & API' },
  { id: 'text', label: 'Text' },
  { id: 'time', label: 'Time' },
  { id: 'misc', label: 'Misc' },
];

export function categoryLabel(id: ToolCategory): string {
  return CATEGORIES.find((c) => c.id === id)?.label ?? id;
}
