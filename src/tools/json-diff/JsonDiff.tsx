import { ToolShell } from '@/components/ToolShell';
import { Panel, SplitPanels } from '@/components/Panels';
import { CodeInput } from '@/components/CodeInput';
import { ErrorBox } from '@/components/ErrorBox';
import { useToolState } from '@/lib/useToolState';
import { useDebounced } from '@/lib/useDebounced';
import { compare, summarizeChanges, type ChangeKind } from './logic';

const L = JSON.stringify({ id: 'user_1', name: 'Ada', roles: ['admin'], settings: { theme: 'dark', beta: false }, logins: 41 }, null, 2);
const R = JSON.stringify({ id: 'user_1', name: 'Ada Lovelace', roles: ['admin', 'billing'], settings: { theme: 'dark', beta: true, locale: 'en-GB' }, logins: '42' }, null, 2);
const STYLE: Record<ChangeKind, string> = {
  added: 'text-emerald-700 dark:text-emerald-300',
  removed: 'text-red-700 dark:text-red-300',
  changed: 'text-amber-700 dark:text-amber-300',
  type: 'text-violet-700 dark:text-violet-300',
};
const SYMBOL: Record<ChangeKind, string> = { added: '+', removed: '−', changed: '~', type: '≠' };

export default function JsonDiff() {
  const [s, set, api] = useToolState('json-diff', { left: '', right: '', idKey: '' }, ['left', 'right']);
  const left = useDebounced(s.left);
  const right = useDebounced(s.right);
  const r = left.trim() && right.trim() ? compare(left, right, s.idKey) : null;
  const changes = r?.ok ? r.value.changes : [];
  return (
    <ToolShell onSample={() => set({ left: L, right: R })} onClear={() => set({ left: '', right: '' })} output={r?.ok ? summarizeChanges(changes) : ''} share={api}
      toolbar={<label className="flex items-center gap-2 text-sm">Match array items by key<input className="input w-28 font-mono" placeholder="e.g. id" value={s.idKey} onChange={(e) => set({ idKey: e.target.value })} /></label>}>
      <SplitPanels>
        <Panel title="Left (before)"><CodeInput language="json" label="Left JSON" value={s.left} onChange={(t) => set({ left: t })} minHeight="18rem" /></Panel>
        <Panel title="Right (after)"><CodeInput language="json" label="Right JSON" value={s.right} onChange={(t) => set({ right: t })} minHeight="18rem" /></Panel>
      </SplitPanels>
      {r && !r.ok && <ErrorBox error={r.error} />}
      {r?.ok && (
        <Panel title={`Differences (${changes.length})`}>
          {changes.length === 0 ? <p data-testid="output" className="text-emerald-700 dark:text-emerald-400">✓ The documents are equivalent (key order ignored).</p> : (
            <div className="overflow-x-auto">
              <table className="data-table" data-testid="output">
                <thead><tr><th></th><th>Path</th><th>Before</th><th>After</th></tr></thead>
                <tbody className="font-mono text-[13px]">
                  {changes.map((c, i) => (
                    <tr key={i}>
                      <td className={`w-6 font-bold ${STYLE[c.kind]}`} title={c.kind}>{SYMBOL[c.kind]}</td>
                      <td className="break-all">{c.path}</td>
                      <td className="break-all text-red-700 dark:text-red-300">{c.kind === 'added' ? '' : JSON.stringify(c.before)}</td>
                      <td className="break-all text-emerald-700 dark:text-emerald-300">{c.kind === 'removed' ? '' : JSON.stringify(c.after)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      )}
    </ToolShell>
  );
}
