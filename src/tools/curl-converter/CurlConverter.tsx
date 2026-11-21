import { ToolShell } from '@/components/ToolShell';
import { Panel, SplitPanels } from '@/components/Panels';
import { OutputPanel } from '@/components/OutputPanel';
import { ErrorBox, WarningBox } from '@/components/ErrorBox';
import { Tabs } from '@/components/Tabs';
import { useToolState } from '@/lib/useToolState';
import { useDebounced } from '@/lib/useDebounced';
import { parseCurl, toAxios, toFetch, toPython } from './logic';

type Target = 'fetch' | 'axios' | 'python';
const GEN = { fetch: toFetch, axios: toAxios, python: toPython };
const SAMPLE = `curl -sS -X POST 'https://api.example.com/v1/messages' \\
  -H 'Content-Type: application/json' \\
  -H 'Authorization: Bearer $API_KEY' \\
  -d '{"model":"example-model","max_tokens":256,"messages":[{"role":"user","content":"Hello"}]}'`;

export default function CurlConverter() {
  const [s, set, api] = useToolState('curl-converter', { cmd: '', target: 'fetch' as Target }, ['cmd']);
  const cmd = useDebounced(s.cmd);
  const r = cmd.trim() ? parseCurl(cmd) : null;
  const output = r?.ok ? GEN[s.target](r.value) : '';
  return (
    <ToolShell onSample={() => set({ cmd: SAMPLE })} onClear={() => set({ cmd: '' })} output={output} share={api}>
      <SplitPanels>
        <Panel title="curl command">
          <textarea aria-label="curl command" spellCheck={false} className="code-box min-h-64 w-full resize-y" value={s.cmd} onChange={(e) => set({ cmd: e.target.value })} placeholder="curl https://…  (paste from DevTools → Copy as cURL)" />
          {r && !r.ok && <ErrorBox error={r.error} />}
          {r?.ok && r.value.warnings.map((w) => <WarningBox key={w}>{w}</WarningBox>)}
          {r?.ok && (
            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
              <dt className="text-slate-500 dark:text-slate-400">Method</dt><dd className="font-mono">{r.value.method}</dd>
              <dt className="text-slate-500 dark:text-slate-400">URL</dt><dd className="break-all font-mono">{r.value.url}</dd>
              <dt className="text-slate-500 dark:text-slate-400">Headers</dt><dd>{r.value.headers.length}</dd>
            </dl>
          )}
        </Panel>
        <div className="flex min-w-0 flex-col gap-2">
          <Tabs label="Target" value={s.target} onChange={(target) => set({ target })} options={[{ value: 'fetch', label: 'fetch' }, { value: 'axios', label: 'axios' }, { value: 'python', label: 'Python requests' }]} />
          <OutputPanel title="Code" value={output} />
        </div>
      </SplitPanels>
    </ToolShell>
  );
}
