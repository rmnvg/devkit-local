import { ToolShell } from '@/components/ToolShell';
import { Panel, SplitPanels } from '@/components/Panels';
import { OutputPanel } from '@/components/OutputPanel';
import { ErrorBox } from '@/components/ErrorBox';
import { Tabs } from '@/components/Tabs';
import { useToolState } from '@/lib/useToolState';
import { useDebounced } from '@/lib/useDebounced';
import { diffText, lineStats, unifiedDiff, type Granularity, type Part } from './logic';

const A = `server:\n  port: 8080\n  host: 0.0.0.0\nlogging:\n  level: info\nfeatures:\n  - search\n  - export\n`;
const B = `server:\n  port: 9090\n  host: 0.0.0.0\n  timeout: 30s\nlogging:\n  level: debug\nfeatures:\n  - search\n`;

function Side({ parts, label }: { parts: Part[]; label: string }) {
  return (
    <div role="region" aria-label={label} className="code-box min-h-40 max-h-[60vh] overflow-auto whitespace-pre-wrap break-words">
      {parts.map((p, i) => p.type === 'same' ? <span key={i}>{p.value}</span>
        : p.type === 'removed' ? <del key={i} className="bg-red-200 text-red-950 dark:bg-red-900/70 dark:text-red-100">{p.value}</del>
        : <ins key={i} className="bg-emerald-200 text-emerald-950 no-underline dark:bg-emerald-900/70 dark:text-emerald-100">{p.value}</ins>)}
    </div>
  );
}

export default function TextDiff() {
  const [s, set, api] = useToolState('text-diff', { a: '', b: '', view: 'split' as 'split' | 'unified', granularity: 'lines' as Granularity, ignoreWhitespace: false, ignoreCase: false }, ['a', 'b']);
  const a = useDebounced(s.a);
  const b = useDebounced(s.b);
  const patch = unifiedDiff(a, b, { ignoreWhitespace: s.ignoreWhitespace, context: 3 });
  const st = lineStats(patch);
  const r = diffText(a, b, s.granularity, s.ignoreCase);
  return (
    <ToolShell onSample={() => set({ a: A, b: B })} onClear={() => set({ a: '', b: '' })} output={patch} share={api}
      toolbar={
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Tabs label="View" value={s.view} onChange={(view) => set({ view })} options={[{ value: 'split', label: 'Side by side' }, { value: 'unified', label: 'Unified patch' }]} />
          {s.view === 'split' && <select aria-label="Granularity" className="select" value={s.granularity} onChange={(e) => set({ granularity: e.target.value as Granularity })}><option value="lines">Lines</option><option value="words">Words</option><option value="chars">Characters</option></select>}
          {s.view === 'split' ? <label className="flex items-center gap-1"><input type="checkbox" checked={s.ignoreCase} onChange={(e) => set({ ignoreCase: e.target.checked })} /> Ignore case</label>
            : <label className="flex items-center gap-1"><input type="checkbox" checked={s.ignoreWhitespace} onChange={(e) => set({ ignoreWhitespace: e.target.checked })} /> Ignore whitespace</label>}
          <button type="button" className="btn" onClick={() => set({ a: s.b, b: s.a })}>Swap</button>
        </div>
      }>
      <SplitPanels>
        <Panel title="Original"><textarea aria-label="Original text" spellCheck={false} className="code-box min-h-48 w-full resize-y" value={s.a} onChange={(e) => set({ a: e.target.value })} /></Panel>
        <Panel title="Modified"><textarea aria-label="Modified text" spellCheck={false} className="code-box min-h-48 w-full resize-y" value={s.b} onChange={(e) => set({ b: e.target.value })} /></Panel>
      </SplitPanels>
      <p className="text-sm"><span className="text-emerald-700 dark:text-emerald-300">+{st.added} added</span> · <span className="text-red-700 dark:text-red-300">−{st.removed} removed</span> lines</p>
      {'error' in r ? <ErrorBox error={r.error} /> : s.view === 'split' ? (
        <SplitPanels>
          <Panel title="Original (removals)"><Side parts={r.left} label="Original with removals" /></Panel>
          <Panel title="Modified (additions)"><Side parts={r.right} label="Modified with additions" /></Panel>
        </SplitPanels>
      ) : <OutputPanel title="Unified diff" value={patch} />}
      {s.view === 'split' && <pre data-testid="output" className="sr-only">{patch}</pre>}
    </ToolShell>
  );
}
