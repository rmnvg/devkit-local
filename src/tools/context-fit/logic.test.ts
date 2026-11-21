import type { LlmModel } from '@/lib/llm';
import { fitRows } from './logic';

const mk = (o: Partial<LlmModel>): LlmModel => ({
  id: 'm', provider: 'openai', displayName: 'M', contextWindow: 1000, maxOutput: 100, inputPerMTok: 1, outputPerMTok: 1,
  cachedInputPerMTok: null, tokenizer: 'o200k_base', tokenEstimateFactor: 1, exactTokenCount: true, ...o,
});

describe('context fit', () => {
  it('uses the right base count and factor', () => {
    const [a, b] = fitRows([mk({ tokenizer: 'cl100k_base' }), mk({ id: 'c', tokenizer: null, tokenEstimateFactor: 1.5 })], { o200k_base: 100, cl100k_base: 120 }, 0);
    expect(a!.promptTokens).toBe(120);
    expect(b!.promptTokens).toBe(150);
  });
  it('flags output over max output and over-context', () => {
    const [r] = fitRows([mk({})], { o200k_base: 950 }, 200);
    expect(r!.outputTooLong).toBe(true);
    expect(r!.level).toBe('over');
    expect(r!.pct).toBeCloseTo(115);
  });
  it('unknown context window', () => {
    expect(fitRows([mk({ contextWindow: null })], { o200k_base: 1 }, 0)[0]!.level).toBe('unknown');
  });
  it('missing counts default to zero, negative output to zero', () => {
    const [r] = fitRows([mk({})], {}, -10);
    expect(r!.total).toBe(0);
  });
});

it('lists models with unknown context windows last', () => {
  const rows = fitRows([mk({ id: 'u', contextWindow: null }), mk({ id: 'k' })], { o200k_base: 1 }, 0);
  expect(rows.map((r) => r.model.id)).toEqual(['k', 'u']);
});
