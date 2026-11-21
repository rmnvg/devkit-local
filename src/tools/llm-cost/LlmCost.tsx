import { useState } from 'react';
import { ToolShell } from '@/components/ToolShell';
import { WarningBox } from '@/components/ErrorBox';
import { catalog, costTable, formatUsd, models, PROVIDER_LABEL, type Provider } from '@/lib/llm';
import { useToolState } from '@/lib/useToolState';
import { cheapestIds, parseCount, sortRows, type SortDir, type SortKey } from './logic';

const PROVIDERS: Provider[] = ['openai', 'anthropic', 'google'];

const DEFAULTS = {
  inputTokens: 0,
  outputTokens: 0,
  cachedInputTokens: 0,
  requestsPerDay: 1000,
  providers: 'openai,anthropic,google',
};

function NumberField({ label, value, onChange, hint }: { label: string; value: number; onChange: (n: number) => void; hint?: string }) {
  const [text, setText] = useState(String(value));
  const [lastValue, setLastValue] = useState(value);
  if (value !== lastValue) {
    setLastValue(value);
    setText(String(value));
  }
  const parsed = parseCount(text);
  return (
    <label className="field-label">
      {label}
      <input
        className="input font-mono"
        inputMode="numeric"
        value={text}
        aria-invalid={parsed == null}
        onChange={(e) => {
          setText(e.target.value);
          const n = parseCount(e.target.value);
          if (n != null) {
            setLastValue(n);
            onChange(n);
          }
        }}
      />
      {parsed == null ? <span className="text-xs text-red-600 dark:text-red-400">Enter a number like 1200, 12k or 1.5M.</span> : hint && <span className="text-xs text-slate-500">{hint}</span>}
    </label>
  );
}

export default function LlmCost() {
  const [s, set, api] = useToolState('llm-cost', DEFAULTS, []);
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({ key: 'perRequest', dir: 'asc' });
  const enabled = new Set(s.providers.split(',').filter(Boolean));
  const list = models.filter((m) => enabled.has(m.provider));
  const rows = sortRows(costTable(list, s), sort.key, sort.dir);
  const cheapest = cheapestIds(rows);
  const anyFallback = rows.some((r) => r.cacheFallback);

  const toggleProvider = (p: Provider) => {
    const next = new Set(enabled);
    if (next.has(p)) next.delete(p);
    else next.add(p);
    set({ providers: PROVIDERS.filter((x) => next.has(x)).join(',') });
  };
  const header = (k: SortKey, label: string, right = false) => (
    <th aria-sort={sort.key === k ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'} className={right ? 'text-right' : ''}>
      <button
        type="button"
        className="inline-flex items-center gap-1 hover:text-sky-600"
        onClick={() => setSort((cur) => ({ key: k, dir: cur.key === k && cur.dir === 'asc' ? 'desc' : 'asc' }))}
      >
        {label}
        <span aria-hidden className="text-[10px]">{sort.key === k ? (sort.dir === 'asc' ? '▲' : '▼') : '↕'}</span>
      </button>
    </th>
  );

  const csv = [
    'model,provider,input_per_mtok,output_per_mtok,per_request,per_day,per_month',
    ...rows.map((r) => [r.model.id, r.model.provider, r.model.inputPerMTok ?? '', r.model.outputPerMTok ?? '', r.perRequest ?? '', r.perDay ?? '', r.perMonth ?? ''].join(',')),
  ].join('\n');

  return (
    <ToolShell
      onSample={() => set({ inputTokens: 3200, outputTokens: 600, cachedInputTokens: 2000, requestsPerDay: 5000 })}
      onClear={() => set(DEFAULTS)}
      output={csv}
      share={api}
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <NumberField label="Input tokens / request" value={s.inputTokens} onChange={(n) => set({ inputTokens: n })} />
        <NumberField label="Output tokens / request" value={s.outputTokens} onChange={(n) => set({ outputTokens: n })} />
        <NumberField label="Cached input tokens" value={s.cachedInputTokens} onChange={(n) => set({ cachedInputTokens: n })} hint="Part of the input served from prompt cache." />
        <NumberField label="Requests / day" value={s.requestsPerDay} onChange={(n) => set({ requestsPerDay: n })} hint="Monthly = 30 days." />
      </div>

      <fieldset className="flex flex-wrap gap-4 text-sm">
        <legend className="sr-only">Providers</legend>
        {PROVIDERS.map((p) => (
          <label key={p} className="flex items-center gap-2">
            <input type="checkbox" checked={enabled.has(p)} onChange={() => toggleProvider(p)} />
            {PROVIDER_LABEL[p]}
          </label>
        ))}
      </fieldset>

      {s.cachedInputTokens > s.inputTokens && <WarningBox>Cached tokens exceed input tokens; only {s.inputTokens.toLocaleString()} are counted as cached.</WarningBox>}

      <div className="overflow-x-auto rounded-md border border-slate-200 dark:border-slate-800">
        <table className="data-table" data-testid="output">
          <thead>
            <tr>
              {header('model', 'Model')}
              {header('provider', 'Provider')}
              {header('context', 'Context', true)}
              {header('input', 'In $/MTok', true)}
              {header('output', 'Out $/MTok', true)}
              <th className="text-right">Cache $/MTok</th>
              {header('perRequest', 'Per request', true)}
              <th className="text-right">Per day</th>
              {header('perMonth', 'Per month', true)}
            </tr>
          </thead>
          <tbody className="font-mono text-[13px] tabular-nums">
            {rows.map((r) => {
              const best = cheapest.has(r.model.id);
              return (
                <tr key={r.model.id} className={best ? 'bg-emerald-50 dark:bg-emerald-950/40' : ''}>
                  <td className="font-sans">
                    <span title={r.model.notes}>{r.model.displayName}</span>
                    {best && <span className="ml-2 rounded bg-emerald-600 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-white">cheapest</span>}
                    {r.model.notes && <span className="ml-1 cursor-help text-slate-400" title={r.model.notes} aria-label={r.model.notes}>ⓘ</span>}
                  </td>
                  <td className="font-sans text-slate-500">{r.model.provider}</td>
                  <td className="text-right">{r.model.contextWindow ? `${Math.round(r.model.contextWindow / 1000).toLocaleString()}K` : '—'}</td>
                  <td className="text-right">{r.model.inputPerMTok ?? '—'}</td>
                  <td className="text-right">{r.model.outputPerMTok ?? '—'}</td>
                  <td className="text-right">{r.model.cachedInputPerMTok ?? '—'}{r.cacheFallback && '*'}</td>
                  <td className="text-right">{formatUsd(r.perRequest)}</td>
                  <td className="text-right">{formatUsd(r.perDay)}</td>
                  <td className="text-right font-semibold">{formatUsd(r.perMonth)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-1 text-xs text-slate-500 dark:text-slate-400">
        {anyFallback && <p>* Cache rate not published in our data; cached tokens billed at the full input rate.</p>}
        <p>
          Prices last updated <strong>{catalog.lastUpdated}</strong> (standard tier, USD). Always check the official pages:{' '}
          <a className="underline" href={catalog.sources.openai} target="_blank" rel="noreferrer">OpenAI</a>,{' '}
          <a className="underline" href={catalog.sources.anthropic} target="_blank" rel="noreferrer">Anthropic</a>,{' '}
          <a className="underline" href={catalog.sources.google} target="_blank" rel="noreferrer">Google</a>.
        </p>
      </div>
    </ToolShell>
  );
}
