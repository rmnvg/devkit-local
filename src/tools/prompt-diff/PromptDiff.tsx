import { ToolShell } from '@/components/ToolShell';
import { Panel, SplitPanels } from '@/components/Panels';
import { ErrorBox } from '@/components/ErrorBox';
import { ModelSelect } from '@/components/ModelSelect';
import { useModelTokens } from '@/components/TokenBadge';
import { EstimateBadge } from '@/components/ModelSelect';
import { useToolState } from '@/lib/useToolState';
import { useDebounced } from '@/lib/useDebounced';
import { models } from '@/lib/llm';
import { diffPrompts, formatDelta, toUnified, type Granularity, type Part } from './logic';

const A = `You are a helpful assistant for Acme Cloud.
Answer the user's question using the context below.
If you don't know, say so.`;
const B = `You are a concise, friendly support assistant for Acme Cloud.
Answer the user's question using only the context below, in at most 3 sentences.
If the answer is not in the context, say "I don't know" and link to the docs.`;

function Side({ parts, side }: { parts: Part[]; side: 'left' | 'right' }) {
  return (
    <div className="code-box min-h-40 max-h-[60vh] overflow-auto whitespace-pre-wrap break-words" role="region" aria-label={side === 'left' ? 'Original with removals' : 'Revised with additions'}>
      {parts.map((p, i) =>
        p.type === 'same' ? <span key={i}>{p.value}</span>
        : p.type === 'removed' ? <del key={i} className="rounded-sm bg-red-200 text-red-950 dark:bg-red-900/70 dark:text-red-100">{p.value}</del>
        : <ins key={i} className="rounded-sm bg-emerald-200 text-emerald-950 no-underline dark:bg-emerald-900/70 dark:text-emerald-100">{p.value}</ins>,
      )}
    </div>
  );
}

export default function PromptDiff() {
  const [s, set, api] = useToolState('prompt-diff', { a: '', b: '', granularity: 'words' as Granularity, ignoreCase: false, model: models[0]!.id }, ['a', 'b']);
  const a = useDebounced(s.a);
  const b = useDebounced(s.b);
  const r = diffPrompts(a, b, s.granularity, s.ignoreCase);
  const ta = useModelTokens(a, s.model);
  const tb = useModelTokens(b, s.model);
  const ok = !('error' in r);

  return (
    <ToolShell
      onSample={() => set({ a: A, b: B })}
      onClear={() => set({ a: '', b: '' })}
      output={ok ? toUnified(r.parts) : ''}
      share={api}
      toolbar={
        <>
          <label className="flex items-center gap-2 text-sm">
            Compare by
            <select className="select" value={s.granularity} onChange={(e) => set({ granularity: e.target.value as Granularity })}>
              <option value="words">Words</option>
              <option value="lines">Lines</option>
              <option value="chars">Characters</option>
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={s.ignoreCase} onChange={(e) => set({ ignoreCase: e.target.checked })} /> Ignore case
          </label>
          <button type="button" className="btn" onClick={() => set({ a: s.b, b: s.a })}>Swap</button>
        </>
      }
    >
      <SplitPanels>
        <Panel title="Original">
          <textarea aria-label="Original prompt" spellCheck={false} className="code-box min-h-40 w-full resize-y" value={s.a} onChange={(e) => set({ a: e.target.value })} placeholder="Original prompt…" />
        </Panel>
        <Panel title="Revised">
          <textarea aria-label="Revised prompt" spellCheck={false} className="code-box min-h-40 w-full resize-y" value={s.b} onChange={(e) => set({ b: e.target.value })} placeholder="Revised prompt…" />
        </Panel>
      </SplitPanels>

      <div className="flex flex-wrap items-end gap-4 rounded-md border border-slate-200 p-3 dark:border-slate-800">
        <ModelSelect value={s.model} onChange={(model) => set({ model })} />
        <div className="text-sm">
          <div className="text-xs text-slate-500 dark:text-slate-400">Tokens</div>
          <span className="font-mono">{ta.count?.toLocaleString() ?? '…'} → {tb.count?.toLocaleString() ?? '…'}</span>{' '}
          {ta.count != null && tb.count != null && (
            <strong data-testid="output" className={tb.count > ta.count ? 'text-amber-700 dark:text-amber-300' : 'text-emerald-700 dark:text-emerald-300'}>{formatDelta(ta.count, tb.count)}</strong>
          )}
          {!ta.model.exactTokenCount && <span className="ml-2"><EstimateBadge provider={ta.model.provider} /></span>}
        </div>
        {ok && (
          <div className="text-sm">
            <div className="text-xs text-slate-500 dark:text-slate-400">Changes ({s.granularity})</div>
            <span className="text-emerald-700 dark:text-emerald-300">+{r.added}</span> / <span className="text-red-700 dark:text-red-300">−{r.removed}</span>
            {r.identical && a && <span className="ml-2 text-slate-500 dark:text-slate-400">identical</span>}
          </div>
        )}
      </div>

      {!ok ? <ErrorBox error={r.error} /> : (
        <SplitPanels>
          <Panel title="Original (removals)"><Side parts={r.left} side="left" /></Panel>
          <Panel title="Revised (additions)"><Side parts={r.right} side="right" /></Panel>
        </SplitPanels>
      )}
    </ToolShell>
  );
}
