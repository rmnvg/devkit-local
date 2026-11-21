/** Tool registry: the single source of truth. Add one line here per tool. */
import type { ToolMeta } from './types';
import tokenCounter from '@/tools/token-counter';
import llmCost from '@/tools/llm-cost';
import contextFit from '@/tools/context-fit';
import schemaConverter from '@/tools/schema-converter';
import chatFormat from '@/tools/chat-format';
import promptTemplate from '@/tools/prompt-template';
import promptDiff from '@/tools/prompt-diff';
import textChunker from '@/tools/text-chunker';
import cosineSimilarity from '@/tools/cosine-similarity';
import jwtDecoder from '@/tools/jwt-decoder';
import base64 from '@/tools/base64';
import hash from '@/tools/hash';
import hmac from '@/tools/hmac';
import password from '@/tools/password';
import uuid from '@/tools/uuid';
import urlEncode from '@/tools/url-encode';
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
  schemaConverter,
  chatFormat,
  promptTemplate,
  promptDiff,
  textChunker,
  cosineSimilarity,
  jwtDecoder,
  base64,
  hash,
  hmac,
  password,
  uuid,
  urlEncode,
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
