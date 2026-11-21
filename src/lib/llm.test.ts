import { CatalogSchema, catalog, costPerRequest, costTable, contextFit, estimateTokens, formatUsd, type LlmModel } from './llm';
import raw from '@/data/llm-models.json';

const base: LlmModel = {
  id: 'm', provider: 'openai', displayName: 'M', contextWindow: 1000, maxOutput: 100,
  inputPerMTok: 2, outputPerMTok: 10, cachedInputPerMTok: 0.5, tokenizer: 'o200k_base',
  tokenEstimateFactor: 1, exactTokenCount: true,
};

describe('llm-models.json', () => {
  it('matches the schema', () => {
    const r = CatalogSchema.safeParse(raw);
    if (!r.success) console.error(r.error.issues);
    expect(r.success).toBe(true);
  });
  it('has unique ids and all three providers', () => {
    const ids = catalog.models.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(catalog.models.map((m) => m.provider))).toEqual(new Set(['openai', 'anthropic', 'google']));
  });
  it('every null value is explained in notes', () => {
    for (const m of catalog.models) {
      const hasNull = [m.contextWindow, m.maxOutput, m.inputPerMTok, m.outputPerMTok, m.cachedInputPerMTok].some((v) => v === null);
      if (hasNull) expect(m.notes, m.id).toMatch(/TODO/);
    }
  });
  it('rejects malformed data', () => {
    expect(CatalogSchema.safeParse({ ...raw, models: [{ id: 'x' }] }).success).toBe(false);
    expect(CatalogSchema.safeParse({ ...raw, lastUpdated: 'yesterday' }).success).toBe(false);
  });
});

describe('cost', () => {
  const input = { inputTokens: 1_000_000, outputTokens: 500_000, cachedInputTokens: 0, requestsPerDay: 10 };
  it('computes per request/day/month', () => {
    const [row] = costTable([base], input);
    expect(row!.perRequest).toBeCloseTo(2 + 5);
    expect(row!.perDay).toBeCloseTo(70);
    expect(row!.perMonth).toBeCloseTo(2100);
  });
  it('bills cached input at the cache rate', () => {
    expect(costPerRequest(base, { ...input, cachedInputTokens: 400_000 }).cost).toBeCloseTo(0.6 * 2 + 0.4 * 0.5 + 5);
  });
  it('clamps cached tokens to input and falls back to input rate when unknown', () => {
    const noCache = { ...base, cachedInputPerMTok: null };
    const r = costPerRequest(noCache, { ...input, cachedInputTokens: 5_000_000 });
    expect(r.cost).toBeCloseTo(7);
    expect(r.cacheFallback).toBe(true);
  });
  it('returns null when prices are unknown', () => {
    expect(costPerRequest({ ...base, inputPerMTok: null }, input).cost).toBeNull();
  });
  it('treats negatives as zero', () => {
    expect(costPerRequest(base, { inputTokens: -5, outputTokens: -5, cachedInputTokens: -1, requestsPerDay: -1 }).cost).toBe(0);
  });
  it('formats USD', () => {
    expect(formatUsd(null)).toBe('—');
    expect(formatUsd(0)).toBe('$0');
    expect(formatUsd(0.000123)).toBe('$0.00012');
    expect(formatUsd(1234.5)).toBe('$1,234.50');
  });
});

describe('tokens and context fit', () => {
  it('applies the estimate factor only without a tokenizer', () => {
    expect(estimateTokens(base, 100)).toBe(100);
    expect(estimateTokens({ ...base, tokenizer: null, tokenEstimateFactor: 1.2 }, 100)).toBe(120);
  });
  it('classifies fit levels', () => {
    expect(contextFit(500, 0, base).level).toBe('ok');
    expect(contextFit(700, 100, base).level).toBe('warn');
    expect(contextFit(1000, 1, base).level).toBe('over');
    expect(contextFit(10, 0, { ...base, contextWindow: null }).level).toBe('unknown');
  });
});
