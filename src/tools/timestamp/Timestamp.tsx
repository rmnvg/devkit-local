import { useEffect, useMemo, useState } from 'react';
import { ToolShell } from '@/components/ToolShell';
import { ErrorBox } from '@/components/ErrorBox';
import { CopyButton } from '@/components/CopyButton';
import { useToolState } from '@/lib/useToolState';
import { allTimeZones, humanInZone, isValidTimeZone, isoInZone, parseTimestamp, relative } from './logic';

const LOCAL_TZ = Intl.DateTimeFormat().resolvedOptions().timeZone;

function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

export default function Timestamp() {
  const [s, set, api] = useToolState('timestamp', { input: '', zone: 'Asia/Tokyo' }, ['input']);
  const now = useNow();
  const zones = useMemo(allTimeZones, []);
  const parsed = s.input.trim() ? parseTimestamp(s.input) : null;
  const zone = isValidTimeZone(s.zone) ? s.zone : 'UTC';

  const rows: [string, string][] = parsed?.ok
    ? [
        ['Unix seconds', String(Math.floor(parsed.value.ms / 1000))],
        ['Unix milliseconds', String(Math.round(parsed.value.ms))],
        ['ISO 8601 (UTC)', new Date(parsed.value.ms).toISOString()],
        [`Local (${LOCAL_TZ})`, isoInZone(parsed.value.ms, LOCAL_TZ)],
        ['Local, readable', humanInZone(parsed.value.ms, LOCAL_TZ)],
        ['UTC, readable', humanInZone(parsed.value.ms, 'UTC')],
        [zone, isoInZone(parsed.value.ms, zone)],
        [`${zone}, readable`, humanInZone(parsed.value.ms, zone)],
        ['Relative', relative(parsed.value.ms, now)],
      ]
    : [];
  const output = rows.map(([k, v]) => `${k}: ${v}`).join('\n');

  return (
    <ToolShell
      onSample={() => set({ input: '1795000000' })}
      onClear={() => set({ input: '' })}
      output={output}
      share={api}
    >
      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <div className="flex flex-col gap-3">
          <div className="rounded-md border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
            <div className="text-xs text-slate-500">Current Unix time</div>
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-2xl font-semibold tabular-nums" aria-live="off">{Math.floor(now / 1000)}</span>
              <CopyButton text={String(Math.floor(now / 1000))} />
            </div>
            <div className="font-mono text-xs text-slate-500">{new Date(now).toISOString()}</div>
          </div>
          <label className="field-label">
            Timestamp or date
            <div className="flex gap-2">
              <input
                className="input flex-1 font-mono"
                spellCheck={false}
                value={s.input}
                placeholder="1795000000, 1795000000000 or 2026-11-21T10:00:00Z"
                onChange={(e) => set({ input: e.target.value })}
              />
              <button type="button" className="btn" onClick={() => set({ input: String(Math.floor(Date.now() / 1000)) })}>Now</button>
            </div>
          </label>
          {parsed?.ok && <p className="text-sm text-slate-600 dark:text-slate-400">Detected: <strong>{parsed.value.detected}</strong></p>}
          {parsed && !parsed.ok && <ErrorBox error={parsed.error} />}
          <label className="field-label">
            Extra time zone
            <input className="input font-mono" list="tz-list" value={s.zone} onChange={(e) => set({ zone: e.target.value })} aria-invalid={!isValidTimeZone(s.zone)} />
            <datalist id="tz-list">{zones.map((z) => <option key={z} value={z} />)}</datalist>
            {!isValidTimeZone(s.zone) && <span className="text-xs text-red-600 dark:text-red-400">Unknown time zone; showing UTC.</span>}
          </label>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table" data-testid="output">
            <tbody>
              {rows.length === 0 && (
                <tr><td className="text-slate-500">Enter a timestamp to see conversions.</td></tr>
              )}
              {rows.map(([k, v]) => (
                <tr key={k}>
                  <th scope="row" className="w-48 whitespace-nowrap font-normal text-slate-500">{k}</th>
                  <td className="break-all font-mono text-[13px]">{v}</td>
                  <td className="w-16 text-right"><CopyButton text={v} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </ToolShell>
  );
}
