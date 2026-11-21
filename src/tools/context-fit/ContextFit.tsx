import { ToolShell } from '@/components/ToolShell';
import { Panel } from '@/components/Panels';
import { PlainTextarea } from '@/components/CodeInput';
import { EstimateBadge } from '@/components/ModelSelect';
import { models } from '@/lib/llm';
import { useTokenCount } from '@/lib/tokenizer';
import { useToolState } from '@/lib/useToolState';
import { SAMPLE_PROMPT } from '@/tools/token-counter/samples';
import { fitRows } from './logic';

const BAR: Record<string, string> = {
  ok: 'bg-emerald-500',
  warn: 'bg-amber-500',
  over: 'bg-red-500',
  unknown: 'bg-slate-400',
};

export default function ContextFit() {
  const [s, set, api] = useToolState('context-fit', { text: '', outputTokens: 4000 }, ['text']);
  const o200 = useTokenCount(s.text, 'o200k_base');
  const cl100 = useTokenCount(s.text, 'cl100k_base');
  const rows = fitRows(models, { o200k_base: o200.result?.count ?? 0, cl100k_base: cl100.result?.count ?? 0 }, s.outputTokens);
  const summary = rows.map((r) => `${r.model.displayName}: ${r.pct == null ? 'unknown' : r.pct.toFixed(1) + '%'}`).join('\n');

  return (
    <ToolShell
      onSample={() => set({ text: SAMPLE_PROMPT.repeat(40), outputTokens: 4000 })}
      onClear={() => set({ text: '' })}
      output={summary}
      share={api}
    >
      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <Panel title="Prompt">
          <PlainTextarea label="Prompt text" value={s.text} onChange={(text) => set({ text })} placeholder="Paste your full prompt (system + context + messages)…" minHeight="22rem" />
          <label className="field-label">
            Expected output tokens
            <input className="input w-40 font-mono" type="number" min={0} value={s.outputTokens} onChange={(e) => set({ outputTokens: Math.max(0, Number(e.target.value) || 0) })} />
          </label>
        </Panel>
        <Panel title="Context window usage">
          <ul className="flex flex-col gap-2" data-testid="output">
            {rows.map((r) => (
              <li key={r.model.id} className="text-sm">
                <div className="mb-0.5 flex flex-wrap items-center justify-between gap-2">
                  <span className="flex items-center gap-2">
                    {r.model.displayName}
                    {!r.model.exactTokenCount && <EstimateBadge provider={r.model.provider} />}
                  </span>
                  <span className="font-mono text-xs tabular-nums text-slate-600 dark:text-slate-400">
                    {r.total.toLocaleString()} / {r.model.contextWindow ? r.model.contextWindow.toLocaleString() : 'unknown'}
                    {r.pct != null && ` · ${r.pct.toFixed(1)}%`}
                  </span>
                </div>
                <div
                  className="h-2.5 overflow-hidden rounded bg-slate-200 dark:bg-slate-800"
                  role="meter"
                  aria-label={`${r.model.displayName} context usage`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={r.pct == null ? undefined : Math.min(100, Math.round(r.pct))}
                >
                  <div className={`h-full ${BAR[r.level]}`} style={{ width: `${r.pct == null ? 0 : Math.min(100, Math.max(r.pct, r.total > 0 ? 0.5 : 0))}%` }} />
                </div>
                {r.level === 'over' && <p className="mt-0.5 text-xs text-red-600 dark:text-red-400">Does not fit — over by {(r.total - r.model.contextWindow!).toLocaleString()} tokens.</p>}
                {r.outputTooLong && <p className="mt-0.5 text-xs text-amber-700 dark:text-amber-300">Expected output exceeds this model’s max output ({r.model.maxOutput!.toLocaleString()}).</p>}
              </li>
            ))}
          </ul>
          <p className="text-xs text-slate-500">Green &lt; 75%, amber 75–100%, red = does not fit. Grey = context window unknown.</p>
        </Panel>
      </div>
    </ToolShell>
  );
}
