import { useTokenCount } from '@/lib/tokenizer';
import { estimateTokens, getModel, models } from '@/lib/llm';
import { EstimateBadge } from './ModelSelect';

/** Token count of `text` for a model (exact or ≈), computed in the tokenizer worker. */
export function useModelTokens(text: string, modelId: string) {
  const model = getModel(modelId) ?? models[0]!;
  const tok = useTokenCount(text, model.tokenizer ?? 'o200k_base');
  const count = tok.result ? estimateTokens(model, tok.result.count) : null;
  return { model, count, loading: tok.status === 'loading' };
}

export function TokenBadge({ text, modelId, label = 'tokens' }: { text: string; modelId: string; label?: string }) {
  const { model, count } = useModelTokens(text, modelId);
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400">
      <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">{count == null ? '…' : count.toLocaleString()}</span> {label}
      {!model.exactTokenCount && <EstimateBadge provider={model.provider} />}
    </span>
  );
}
