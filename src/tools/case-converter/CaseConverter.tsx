import { ToolShell } from '@/components/ToolShell';
import { CopyButton } from '@/components/CopyButton';
import { useToolState } from '@/lib/useToolState';
import { CASE_LABELS, convertLines, type CaseName } from './logic';

export default function CaseConverter() {
  const [s, set, api] = useToolState('case-converter', { text: '' }, ['text']);
  const names = Object.keys(CASE_LABELS) as CaseName[];
  const results = names.map((n) => [n, s.text ? convertLines(s.text, n) : ''] as const);
  return (
    <ToolShell onSample={() => set({ text: 'getUserProfile\nHTTP response code\nmax_retry_count' })} onClear={() => set({ text: '' })} output={results.map(([n, v]) => `${CASE_LABELS[n]}:\n${v}`).join('\n\n')} share={api}>
      <textarea aria-label="Text to convert" spellCheck={false} className="code-box min-h-28 w-full resize-y" value={s.text} onChange={(e) => set({ text: e.target.value })} placeholder="Type or paste text; each line is converted separately…" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" data-testid="output">
        {results.map(([n, v]) => (
          <div key={n} className="rounded-md border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-200 px-2 py-1 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
              <span className="font-mono">{CASE_LABELS[n]}</span><CopyButton text={v} />
            </div>
            <pre className="min-h-10 whitespace-pre-wrap break-all p-2 font-mono text-[13px]">{v}</pre>
          </div>
        ))}
      </div>
    </ToolShell>
  );
}
