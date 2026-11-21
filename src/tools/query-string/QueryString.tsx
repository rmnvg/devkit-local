import { ToolShell } from '@/components/ToolShell';
import { Panel, SplitPanels } from '@/components/Panels';
import { OutputPanel } from '@/components/OutputPanel';
import { ErrorBox } from '@/components/ErrorBox';
import { useToolState } from '@/lib/useToolState';
import { buildUrl, parseQuery, toObject } from './logic';

const SAMPLE = 'https://shop.example.com/search?q=wireless+headphones&category=audio&price[min]=50&price[max]=200&brand[]=sony&brand[]=bose&utm_source=newsletter&utm_campaign=black%20friday#results';

export default function QueryString() {
  const [s, set, api] = useToolState('query-string', { url: '', brackets: true }, ['url']);
  const r = s.url.trim() ? parseQuery(s.url) : null;
  const p = r?.ok ? r.value : null;
  const update = (i: number, k: string, v: string) => {
    if (!p) return;
    const params = p.params.map((x, j) => (j === i ? ([k, v] as [string, string]) : x));
    set({ url: buildUrl({ ...p, params }) });
  };
  const remove = (i: number) => p && set({ url: buildUrl({ ...p, params: p.params.filter((_, j) => j !== i) }) });
  const add = () => p && set({ url: buildUrl({ ...p, params: [...p.params, ['key', 'value']] }) });
  const json = p ? JSON.stringify(toObject(p.params, s.brackets), null, 2) : '';

  return (
    <ToolShell onSample={() => set({ url: SAMPLE })} onClear={() => set({ url: '' })} output={json} share={api}>
      <textarea aria-label="URL or query string" spellCheck={false} className="code-box min-h-20 w-full resize-y" value={s.url} onChange={(e) => set({ url: e.target.value })} placeholder="https://example.com/path?a=1&b=2 or a=1&b=2" />
      {r && !r.ok && <ErrorBox error={r.error} />}
      {p && (
        <SplitPanels>
          <Panel title={`Parameters (${p.params.length})`} actions={<button type="button" className="btn btn-sm" onClick={add}>+ Add</button>}>
            {p.base && <p className="break-all text-sm"><span className="text-slate-500 dark:text-slate-400">Base:</span> <code>{p.base}</code></p>}
            <table className="data-table">
              <thead><tr><th>Key</th><th>Value (decoded)</th><th className="w-8"></th></tr></thead>
              <tbody>
                {p.params.map(([k, v], i) => (
                  <tr key={i}>
                    <td><input aria-label={`Key ${i + 1}`} className="input w-full font-mono" value={k} onChange={(e) => update(i, e.target.value, v)} /></td>
                    <td><input aria-label={`Value ${i + 1}`} className="input w-full font-mono" value={v} onChange={(e) => update(i, k, e.target.value)} /></td>
                    <td><button type="button" className="btn btn-ghost btn-sm" aria-label={`Remove ${k}`} onClick={() => remove(i)}>✕</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {p.hash && <p className="text-sm"><span className="text-slate-500 dark:text-slate-400">Fragment:</span> <code>#{p.hash}</code></p>}
          </Panel>
          <div className="flex min-w-0 flex-col gap-2">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={s.brackets} onChange={(e) => set({ brackets: e.target.checked })} /> Nest bracket keys (a[b]=1)</label>
            <OutputPanel title="As JSON" value={json} />
          </div>
        </SplitPanels>
      )}
    </ToolShell>
  );
}
