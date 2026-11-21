import { models, PROVIDER_LABEL, type Provider } from '@/lib/llm';

const PROVIDERS: Provider[] = ['openai', 'anthropic', 'google'];

export function ModelSelect({ value, onChange, label = 'Model' }: { value: string; onChange: (id: string) => void; label?: string }) {
  return (
    <label className="field-label">
      {label}
      <select className="select" value={value} onChange={(e) => onChange(e.target.value)}>
        {PROVIDERS.map((p) => (
          <optgroup key={p} label={PROVIDER_LABEL[p]}>
            {models.filter((m) => m.provider === p).map((m) => (
              <option key={m.id} value={m.id}>{m.displayName}</option>
            ))}
          </optgroup>
        ))}
      </select>
    </label>
  );
}

export function EstimateBadge({ provider }: { provider: Provider }) {
  const why =
    provider === 'openai'
      ? 'This model is newer than the bundled tokenizer mappings, so the count uses o200k_base and may differ slightly.'
      : `${PROVIDER_LABEL[provider]} does not publish its tokenizer. Exact counts need the provider's API, which would send your text off-device. This is a tiktoken count scaled by a per-model factor.`;
  return (
    <span
      tabIndex={0}
      title={why}
      aria-label={`Estimate. ${why}`}
      className="cursor-help rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-900 dark:bg-amber-900/40 dark:text-amber-200"
    >
      ≈ estimate
    </span>
  );
}

export function Stat({ label, value, testId, extra }: { label: string; value: string | number; testId?: string; extra?: React.ReactNode }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-900">
      <div className="text-xs text-slate-500 dark:text-slate-400">{label}</div>
      <div className="flex items-center gap-2">
        <span data-testid={testId} className="font-mono text-xl font-semibold tabular-nums">{typeof value === 'number' ? value.toLocaleString() : value}</span>
        {extra}
      </div>
    </div>
  );
}
