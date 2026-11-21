/** Model catalog (validated) and pure LLM math shared by the AI tools. */
import { z } from 'zod';
import raw from '@/data/llm-models.json';

const price = z.number().nonnegative().nullable();

export const ModelSchema = z.object({
  id: z.string().min(1),
  provider: z.enum(['openai', 'anthropic', 'google']),
  displayName: z.string().min(1),
  contextWindow: z.number().int().positive().nullable(),
  maxOutput: z.number().int().positive().nullable(),
  inputPerMTok: price,
  outputPerMTok: price,
  cachedInputPerMTok: price,
  tokenizer: z.enum(['o200k_base', 'cl100k_base']).nullable(),
  tokenEstimateFactor: z.number().positive(),
  /** true only when js-tiktoken officially maps this model to `tokenizer` */
  exactTokenCount: z.boolean(),
  notes: z.string().optional(),
});

export const CatalogSchema = z.object({
  lastUpdated: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  sources: z.object({ openai: z.string().url(), anthropic: z.string().url(), google: z.string().url() }),
  notes: z.string().optional(),
  models: z.array(ModelSchema).min(1),
});

export type LlmModel = z.infer<typeof ModelSchema>;
export type Provider = LlmModel['provider'];
export type Catalog = z.infer<typeof CatalogSchema>;

export const catalog: Catalog = raw as Catalog;
export const models = catalog.models;

export const PROVIDER_LABEL: Record<Provider, string> = {
  openai: 'OpenAI',
  anthropic: 'Anthropic (Claude)',
  google: 'Google (Gemini)',
};

export function getModel(id: string): LlmModel | undefined {
  return models.find((m) => m.id === id);
}

/** Token count for a model given an o200k/cl100k base count. */
export function estimateTokens(model: LlmModel, baseCount: number): number {
  if (model.tokenizer) return baseCount;
  return Math.round(baseCount * model.tokenEstimateFactor);
}

export interface CostInput {
  inputTokens: number;
  outputTokens: number;
  /** part of inputTokens served from cache */
  cachedInputTokens: number;
  requestsPerDay: number;
}

export interface CostRow {
  model: LlmModel;
  perRequest: number | null;
  perDay: number | null;
  perMonth: number | null;
  /** cached rate unknown, so cached tokens were billed at the full input rate */
  cacheFallback: boolean;
}

export const DAYS_PER_MONTH = 30;

export function costPerRequest(model: LlmModel, input: CostInput): { cost: number | null; cacheFallback: boolean } {
  if (model.inputPerMTok == null || model.outputPerMTok == null) return { cost: null, cacheFallback: false };
  const cached = Math.min(Math.max(0, input.cachedInputTokens), Math.max(0, input.inputTokens));
  const uncached = Math.max(0, input.inputTokens) - cached;
  const cacheRate = model.cachedInputPerMTok ?? model.inputPerMTok;
  const cost =
    (uncached * model.inputPerMTok + cached * cacheRate + Math.max(0, input.outputTokens) * model.outputPerMTok) / 1e6;
  return { cost, cacheFallback: cached > 0 && model.cachedInputPerMTok == null };
}

export function costTable(list: LlmModel[], input: CostInput): CostRow[] {
  return list.map((model) => {
    const { cost, cacheFallback } = costPerRequest(model, input);
    const perDay = cost == null ? null : cost * Math.max(0, input.requestsPerDay);
    return { model, perRequest: cost, perDay, perMonth: perDay == null ? null : perDay * DAYS_PER_MONTH, cacheFallback };
  });
}

export function formatUsd(n: number | null): string {
  if (n == null) return '—';
  if (n === 0) return '$0';
  if (n < 0.01) return '$' + n.toPrecision(2);
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: n < 1 ? 4 : 2 });
}

export type FitLevel = 'ok' | 'warn' | 'over' | 'unknown';

export function contextFit(promptTokens: number, outputTokens: number, model: LlmModel): { pct: number | null; level: FitLevel; total: number } {
  const total = promptTokens + outputTokens;
  if (!model.contextWindow) return { pct: null, level: 'unknown', total };
  const pct = (total / model.contextWindow) * 100;
  const level: FitLevel = pct > 100 ? 'over' : pct >= 75 ? 'warn' : 'ok';
  return { pct, level, total };
}
