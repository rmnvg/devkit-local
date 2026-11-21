import { useState } from 'react';
import { ToolShell } from '@/components/ToolShell';
import { Panel, SplitPanels } from '@/components/Panels';
import { OutputPanel } from '@/components/OutputPanel';
import { ErrorBox } from '@/components/ErrorBox';
import { useToolState } from '@/lib/useToolState';
import { inspect, ulid, uuidV4, uuidV7, NIL_UUID } from './logic';

type Kind = 'v4' | 'v7' | 'ulid' | 'nil';
const GEN: Record<Kind, () => string> = { v4: () => uuidV4(), v7: () => uuidV7(), ulid: () => ulid(), nil: () => NIL_UUID };

export default function Uuid() {
  const [s, set, api] = useToolState('uuid', { kind: 'v4' as Kind, count: 5, upper: false, hyphens: true, check: '' }, ['check']);
  const make = () => Array.from({ length: Math.min(1000, Math.max(1, s.count)) }, () => {
    let id = GEN[s.kind]();
    if (s.kind !== 'ulid' && !s.hyphens) id = id.replace(/-/g, '');
    return s.upper ? id.toUpperCase() : id;
  }).join('\n');
  const [ids, setIds] = useState('');
  const ins = s.check.trim() ? inspect(s.check) : null;

  return (
    <ToolShell onSample={() => setIds(make())} onClear={() => setIds('')} output={ids} onRun={() => setIds(make())} share={api}>
      <SplitPanels>
        <Panel title="Generate">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="field-label">
              Type
              <select className="select" value={s.kind} onChange={(e) => set({ kind: e.target.value as Kind })}>
                <option value="v4">UUID v4 (random)</option>
                <option value="v7">UUID v7 (time-ordered)</option>
                <option value="ulid">ULID</option>
                <option value="nil">Nil UUID</option>
              </select>
            </label>
            <label className="field-label">
              How many (max 1000)
              <input className="input font-mono" type="number" min={1} max={1000} value={s.count} onChange={(e) => set({ count: Math.floor(Number(e.target.value)) || 1 })} />
            </label>
          </div>
          <div className="flex flex-wrap gap-4 text-sm">
            <label className="flex items-center gap-2"><input type="checkbox" checked={s.upper} onChange={(e) => set({ upper: e.target.checked })} /> Uppercase</label>
            {s.kind !== 'ulid' && <label className="flex items-center gap-2"><input type="checkbox" checked={s.hyphens} onChange={(e) => set({ hyphens: e.target.checked })} /> Hyphens</label>}
          </div>
          <button type="button" className="btn btn-primary self-start" onClick={() => setIds(make())} title="Ctrl/⌘ Enter">Generate</button>

          <h3 className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Inspect an ID</h3>
          <input aria-label="ID to inspect" className="input font-mono" spellCheck={false} value={s.check} placeholder="Paste a UUID or ULID" onChange={(e) => set({ check: e.target.value })} />
          {ins && !ins.ok && <ErrorBox error={ins.error} />}
          {ins?.ok && (
            <table className="data-table">
              <tbody className="font-mono text-[13px]">
                <tr><th scope="row" className="font-sans font-normal">Type</th><td>{ins.value.kind === 'ulid' ? 'ULID' : `UUID version ${ins.value.version}`}</td></tr>
                {ins.value.variant && <tr><th scope="row" className="font-sans font-normal">Variant</th><td>{ins.value.variant}</td></tr>}
                <tr><th scope="row" className="font-sans font-normal">Normalized</th><td>{ins.value.normalized}</td></tr>
                {ins.value.timestampMs !== undefined && <tr><th scope="row" className="font-sans font-normal">Timestamp</th><td>{new Date(ins.value.timestampMs).toISOString()}</td></tr>}
              </tbody>
            </table>
          )}
        </Panel>
        <OutputPanel title="IDs" value={ids} placeholder="Press Generate." />
      </SplitPanels>
    </ToolShell>
  );
}
