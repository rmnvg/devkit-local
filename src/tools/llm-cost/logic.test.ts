import { costTable, models, type LlmModel } from '@/lib/llm';
import { cheapestIds, parseCount, sortRows } from './logic';

const mk = (id: string, input: number | null, output: number | null): LlmModel => ({
  id, provider: 'openai', displayName: id, contextWindow: 1000, maxOutput: null, inputPerMTok: input,
  outputPerMTok: output, cachedInputPerMTok: null, tokenizer: null, tokenEstimateFactor: 1, exactTokenCount: false,
});
const q = { inputTokens: 1000, outputTokens: 1000, cachedInputTokens: 0, requestsPerDay: 1 };

describe('llm-cost logic', () => {
  const rows = costTable([mk('b', 2, 2), mk('a', 1, 1), mk('x', null, 1), mk('c', 1, 1)], q);
  it('sorts asc/desc with nulls last', () => {
    expect(sortRows(rows, 'perRequest', 'asc').map((r) => r.model.id)).toEqual(['a', 'c', 'b', 'x']);
    expect(sortRows(rows, 'perRequest', 'desc').map((r) => r.model.id)).toEqual(['b', 'a', 'c', 'x']);
    expect(sortRows(rows, 'model', 'asc')[0]!.model.id).toBe('a');
  });
  it('finds all cheapest models (ties)', () => {
    expect(cheapestIds(rows)).toEqual(new Set(['a', 'c']));
  });
  it('no highlight when all costs are zero or unknown', () => {
    expect(cheapestIds(costTable([mk('a', 1, 1)], { ...q, inputTokens: 0, outputTokens: 0 })).size).toBe(0);
    expect(cheapestIds(costTable([mk('x', null, null)], q)).size).toBe(0);
  });
  it('parses human token counts', () => {
    expect(parseCount('12,000')).toBe(12000);
    expect(parseCount('12k')).toBe(12000);
    expect(parseCount('1.5M')).toBe(1_500_000);
    expect(parseCount(' 42 ')).toBe(42);
    expect(parseCount('abc')).toBeNull();
    expect(parseCount('-5')).toBeNull();
    expect(parseCount('')).toBeNull();
  });
  it('works over the real catalog', () => {
    expect(costTable(models, q)).toHaveLength(models.length);
  });
});
