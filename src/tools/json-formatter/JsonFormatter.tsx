import { useEffect, useState } from 'react';
import { wrap, type Remote } from 'comlink';
import { ToolShell } from '@/components/ToolShell';
import { Panel, SplitPanels } from '@/components/Panels';
import { CodeInput } from '@/components/CodeInput';
import { OutputPanel } from '@/components/OutputPanel';
import { Tabs } from '@/components/Tabs';
import { JsonTree } from '@/components/JsonTree';
import { useToolState } from '@/lib/useToolState';
import { useDebounced } from '@/lib/useDebounced';
import type { JsonWorkerApi } from '@/workers/json.worker';
import { formatJson, type FormatResult, type Indent } from './logic';

const WORKER_THRESHOLD = 512 * 1024;
let remote: Remote<JsonWorkerApi> | null = null;
function worker() {
  remote ??= wrap<JsonWorkerApi>(new Worker(new URL('../../workers/json.worker.ts', import.meta.url), { type: 'module' }));
  return remote;
}

const SAMPLE = `{"name":"devkit-local","version":"0.1.0","private":true,"tools":[{"slug":"token-counter","category":"ai","isNew":true},{"slug":"jwt-decoder","category":"auth","sensitive":true}],"limits":{"maxShareBytes":8192,"debounceMs":200},"maintainers":null}`;

export default function JsonFormatter() {
  const [s, set, api] = useToolState('json-formatter', { text: '', indent: '2' as Indent, sortKeys: false, view: 'text' as 'text' | 'tree' }, ['text']);
  const text = useDebounced(s.text, s.text.length > WORKER_THRESHOLD ? 400 : 150);
  const [result, setResult] = useState<FormatResult>({ ok: true, value: '', parsed: undefined });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (text.length > WORKER_THRESHOLD) {
      setBusy(true);
      worker().format(text, s.indent, s.sortKeys).then((r) => {
        if (!cancelled) {
          setResult(r);
          setBusy(false);
        }
      });
    } else {
      setResult(formatJson(text, s.indent, s.sortKeys));
    }
    return () => {
      cancelled = true;
    };
  }, [text, s.indent, s.sortKeys]);

  const output = result.ok ? result.value : '';

  return (
    <ToolShell
      onSample={() => set({ text: SAMPLE })}
      onClear={() => set({ text: '' })}
      output={output}
      onRun={() => result.ok && output && set({ text: output })}
      share={api}
      toolbar={
        <>
          <label className="flex items-center gap-2 text-sm">
            Indent
            <select className="select" value={s.indent} onChange={(e) => set({ indent: e.target.value as Indent })}>
              <option value="2">2 spaces</option>
              <option value="4">4 spaces</option>
              <option value="tab">Tabs</option>
              <option value="min">Minify</option>
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={s.sortKeys} onChange={(e) => set({ sortKeys: e.target.checked })} />
            Sort keys
          </label>
          <button type="button" className="btn" disabled={!result.ok || !output} onClick={() => set({ text: output })} title="Ctrl/⌘ Enter">
            Replace input with output
          </button>
        </>
      }
    >
      <SplitPanels>
        <Panel title="Input JSON">
          <CodeInput language="json" label="Input JSON" value={s.text} onChange={(t) => set({ text: t })} placeholder="Paste JSON…" minHeight="24rem" />
          {!result.ok && (
            <div role="alert" className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300">
              <p className="font-medium">
                {result.error.message} — line {result.error.line}, column {result.error.column}
              </p>
              <pre className="mt-2 overflow-x-auto font-mono text-xs">{result.error.excerpt}</pre>
            </div>
          )}
          {result.ok && s.text.trim() && <p className="text-sm text-emerald-700 dark:text-emerald-400">✓ Valid JSON{busy ? ' (processing…)' : ''}</p>}
        </Panel>
        <div className="flex min-w-0 flex-col gap-2">
          <Tabs label="Output view" value={s.view} onChange={(view) => set({ view })} options={[{ value: 'text', label: 'Text' }, { value: 'tree', label: 'Tree' }]} />
          {s.view === 'tree' && result.ok && result.parsed !== undefined ? (
            <>
              <JsonTree value={result.parsed} />
              <p className="text-xs text-slate-500">Click a key to copy its path.</p>
              <pre data-testid="output" className="sr-only">{output}</pre>
            </>
          ) : (
            <OutputPanel title="Formatted" value={output} />
          )}
        </div>
      </SplitPanels>
    </ToolShell>
  );
}
