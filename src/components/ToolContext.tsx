import { createContext, useContext } from 'react';
import type { ToolMeta } from '@/lib/types';

export const ToolMetaCtx = createContext<ToolMeta | null>(null);

export function useToolMeta(): ToolMeta {
  const m = useContext(ToolMetaCtx);
  if (!m) throw new Error('useToolMeta must be used inside a tool page');
  return m;
}
