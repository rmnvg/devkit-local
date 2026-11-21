import { contextFit, estimateTokens, type FitLevel, type LlmModel } from '@/lib/llm';

export interface FitRow {
  model: LlmModel;
  promptTokens: number;
  total: number;
  pct: number | null;
  level: FitLevel;
  /** expected output exceeds the model's max output */
  outputTooLong: boolean;
}

/** `baseCounts` holds tiktoken counts by encoding name. */
export function fitRows(list: LlmModel[], baseCounts: Record<string, number>, outputTokens: number): FitRow[] {
  const rows = list.map((model) => {
    const base = baseCounts[model.tokenizer ?? 'o200k_base'] ?? 0;
    const promptTokens = estimateTokens(model, base);
    const out = Math.max(0, outputTokens);
    const { pct, level, total } = contextFit(promptTokens, out, model);
    return { model, promptTokens, total, pct, level, outputTooLong: model.maxOutput != null && out > model.maxOutput };
  });
  // known context windows first, catalog order otherwise (stable sort)
  return rows.sort((a, b) => Number(a.pct == null) - Number(b.pct == null));
}
