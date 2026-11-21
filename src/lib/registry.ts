/** Tool registry: the single source of truth. Add one line here per tool. */
import type { ToolMeta } from './types';
import tokenCounter from '@/tools/token-counter';
import llmCost from '@/tools/llm-cost';
import contextFit from '@/tools/context-fit';
import jwtDecoder from '@/tools/jwt-decoder';
import jsonFormatter from '@/tools/json-formatter';
import dataConverter from '@/tools/data-converter';
import jsonToTypes from '@/tools/json-to-types';
import regexTester from '@/tools/regex-tester';
import timestamp from '@/tools/timestamp';

export type { ToolMeta, ToolCategory } from './types';

export const tools: ToolMeta[] = [
  tokenCounter,
  llmCost,
  contextFit,
  jwtDecoder,
  jsonFormatter,
  dataConverter,
  jsonToTypes,
  regexTester,
  timestamp,
];

const bySlug = new Map(tools.map((t) => [t.slug, t]));

export function getTool(slug: string | undefined): ToolMeta | undefined {
  return slug ? bySlug.get(slug) : undefined;
}
