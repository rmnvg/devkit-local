import { useMemo } from 'react';
import { ToolShell } from '@/components/ToolShell';
import { ErrorBox } from '@/components/ErrorBox';
import { useToolState } from '@/lib/useToolState';
import { allTimeZones, isValidTimeZone } from '@/tools/timestamp/logic';
import { explainCron, PRESETS } from './logic';

const LOCAL_TZ = Intl.DateTimeFormat().resolvedOptions().timeZone;

export default function Cron() {
  const [s, set, api] = useToolState('cron', { expr: '', tz: LOCAL_TZ, count: 10 }, ['expr']);
  const zones = useMemo(allTimeZones, []);
  const tz = isValidTimeZone(s.tz) ? s.tz : 'UTC';
  const r = s.expr.trim() ? explainCron(s.expr, { count: s.count, tz }) : null;
  const fmt = new Intl.DateTimeFormat(undefined, { timeZone: tz, dateStyle: 'full', timeStyle: 'long' });
  const output = r?.ok ? `${r.value.description}\n\n${r.value.next.map((d) => fmt.format(d)).join('\n')}` : '';
  return (
    <ToolShell onSample={() => set({ expr: '*/15 9-17 * * 1-5' })} onClear={() => set({ expr: '' })} output={output} share={api}>
      <div className="flex flex-col gap-2">
        <input aria-label="Cron expression" className="input font-mono text-lg" spellCheck={false} value={s.expr} placeholder="*/15 9-17 * * 1-5" onChange={(e) => set({ expr: e.target.value })} />
        <div className="flex flex-wrap gap-1">{PRESETS.map(([e, l]) => <button key={e} type="button" className="btn btn-sm" title={e} onClick={() => set({ expr: e })}>{l}</button>)}</div>
      </div>
      {r && !r.ok && <ErrorBox error={r.error} />}
      {r?.ok && (
        <>
          <p data-testid="output" className="rounded-md border border-sky-300 bg-sky-50 p-3 text-lg font-medium text-sky-950 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-100">“{r.value.description}”</p>
          <div className="grid gap-4 lg:grid-cols-2">
            <table className="data-table">
              <thead><tr><th>Field</th><th>Value</th></tr></thead>
              <tbody>{r.value.fields.map((f) => <tr key={f.name}><td>{f.name}</td><td className="font-mono">{f.value}</td></tr>)}</tbody>
            </table>
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-end gap-2">
                <label className="field-label flex-1">Time zone
                  <input className="input font-mono" list="cron-tz" value={s.tz} onChange={(e) => set({ tz: e.target.value })} aria-invalid={!isValidTimeZone(s.tz)} />
                  <datalist id="cron-tz">{zones.map((z) => <option key={z} value={z} />)}</datalist>
                </label>
                <label className="field-label">Runs
                  <select className="select" value={s.count} onChange={(e) => set({ count: Number(e.target.value) })}>{[5, 10, 20, 50].map((n) => <option key={n}>{n}</option>)}</select>
                </label>
              </div>
              <ol className="list-decimal pl-6 font-mono text-sm">{r.value.next.map((d) => <li key={d.getTime()}>{fmt.format(d)}</li>)}</ol>
            </div>
          </div>
        </>
      )}
    </ToolShell>
  );
}
