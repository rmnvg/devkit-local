/** Tool registry: the single source of truth. Add one line here per tool. */
import type { ToolMeta } from './types';
import hello from '@/tools/hello';

export type { ToolMeta, ToolCategory } from './types';

export const tools: ToolMeta[] = [hello];

const bySlug = new Map(tools.map((t) => [t.slug, t]));

export function getTool(slug: string | undefined): ToolMeta | undefined {
  return slug ? bySlug.get(slug) : undefined;
}
