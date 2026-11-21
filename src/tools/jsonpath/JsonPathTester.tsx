import { ToolShell } from '@/components/ToolShell';
import { Panel, SplitPanels } from '@/components/Panels';
import { CodeInput } from '@/components/CodeInput';
import { OutputPanel } from '@/components/OutputPanel';
import { ErrorBox } from '@/components/ErrorBox';
import { useToolState } from '@/lib/useToolState';
import { useDebounced } from '@/lib/useDebounced';
import { EXAMPLES, query } from './logic';

const SAMPLE = JSON.stringify({ store: { book: [
  { category: 'reference', author: 'Nigel Rees', title: 'Sayings of the Century', price: 8.95 },
  { category: 'fiction', author: 'Evelyn Waugh', title: 'Sword of Honour', price: 12.99 },
  { category: 'fiction', author: 'Herman Melville', title: 'Moby Dick', isbn: '0-553-21311-3', price: 8.99 },
  { category: 'fiction', author: 'J. R. R. Tolkien', title: 'The Lord of the Rings', isbn: '0-395-19395-8', price: 22.99 },
], bicycle: { color: 'red', price: 19.95 } } }, null, 2);

export default function JsonPathTester() {
  const [s, set, api] = useToolState('jsonpath', { json: '', expr: '$.store.book[?(@.price < 10)].title', showPaths: true }, ['json']);
  const json = useDebounced(s.json);
  const r = json.trim() ? query(json, s.expr) : null;
  const matches = r?.ok ? r.value : [];
  const output = r?.ok ? JSON.stringify(matches.map((m) => m.value), null, 2) : '';
  return (
    <ToolShell onSample={() => set({ json: SAMPLE })} onClear={() => set({ json: '' })} output={output} share={api}>
      <div className="flex flex-col gap-2">
        <input aria-label="JSONPath expression" className="input font-mono" spellCheck={false} value={s.expr} onChange={(e) => set({ expr: e.target.value })} />
        <div className="flex flex-wrap gap-1">
          {EXAMPLES.map(([e, l]) => <button key={e} type="button" className="btn btn-sm" title={e} onClick={() => set({ expr: e })}>{l}</button>)}
        </div>
      </div>
      {r && !r.ok && <ErrorBox error={r.error} />}
      <SplitPanels>
        <Panel title="JSON"><CodeInput language="json" label="JSON document" value={s.json} onChange={(t) => set({ json: t })} minHeight="24rem" /></Panel>
        <div className="flex min-w-0 flex-col gap-2">
          <OutputPanel title={`Matches (${matches.length})`} value={output} />
          {matches.length > 0 && (
            <details open={s.showPaths} onToggle={(e) => set({ showPaths: (e.target as HTMLDetailsElement).open })} className="text-sm">
              <summary className="cursor-pointer">Paths</summary>
              <ul className="mt-1 font-mono text-xs">{matches.slice(0, 500).map((m, i) => <li key={i}>{m.path}</li>)}</ul>
            </details>
          )}
        </div>
      </SplitPanels>
    </ToolShell>
  );
}
