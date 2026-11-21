import { useState } from 'react';
import { ToolShell } from '@/components/ToolShell';
import { Panel } from '@/components/Panels';
import { ErrorBox, WarningBox } from '@/components/ErrorBox';
import { FileDrop } from '@/components/FileDrop';
import { useToolState } from '@/lib/useToolState';
import { useDebounced } from '@/lib/useDebounced';
import { columnStats, filterRows, parseCsv, sortRows, toCsv } from './logic';

const SAMPLE = `model,provider,context_window,input_per_mtok,output_per_mtok
GPT-6.1 Terra,openai,1050000,1,5
Claude Sonnet 5.5,anthropic,1000000,2,10
Gemini 3.5 Flash-Lite,google,1048576,0.3,2.5
GPT-4o mini,openai,128000,0.15,0.6
Claude Haiku 5.5,anthropic,1000000,0.1,0.5
Gemini 4 Neon,google,1000000,3,15`;
const PAGE = 500;

export default function CsvViewer() {
  const [s, set, api] = useToolState('csv-viewer', { text: '', delimiter: 'auto', header: true }, ['text']);
  const [sort, setSort] = useState<{ col: number; dir: 'asc' | 'desc' } | null>(null);
  const [q, setQ] = useState('');
  const [statsCol, setStatsCol] = useState<number | null>(null);
  const [limit, setLimit] = useState(PAGE);
  const text = useDebounced(s.text, 300);
  const r = text.trim() ? parseCsv(text, s.delimiter, s.header) : null;
  const t = r?.ok ? r.value : null;
  let rows = t ? filterRows(t.rows, q) : [];
  if (t && sort) rows = sortRows(rows, sort.col, sort.dir);
  const output = t ? toCsv(t.columns, rows, t.delimiter) : '';

  return (
    <ToolShell onSample={() => set({ text: SAMPLE })} onClear={() => set({ text: '' })} output={output} share={api}
      toolbar={
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <select aria-label="Delimiter" className="select" value={s.delimiter} onChange={(e) => set({ delimiter: e.target.value })}>
            <option value="auto">Auto-detect</option><option value=",">Comma</option><option value=";">Semicolon</option><option value={'\t'}>Tab</option><option value="|">Pipe</option>
          </select>
          <label className="flex items-center gap-1"><input type="checkbox" checked={s.header} onChange={(e) => set({ header: e.target.checked })} /> First row is header</label>
        </div>
      }>
      <div className="grid gap-3 lg:grid-cols-[2fr_1fr]">
        <textarea aria-label="CSV text" spellCheck={false} className="code-box min-h-28 w-full resize-y" value={s.text} onChange={(e) => set({ text: e.target.value })} placeholder="Paste CSV or TSV…" />
        <FileDrop accept=".csv,.tsv,.txt,text/csv" onFile={(f) => set({ text: new TextDecoder().decode(f.bytes) })} label="Open a CSV file" />
      </div>
      {r && !r.ok && <ErrorBox error={r.error} />}
      {t?.warnings.map((w) => <WarningBox key={w}>{w}</WarningBox>)}
      {t && (
        <Panel title={`${rows.length.toLocaleString()} of ${t.rows.length.toLocaleString()} rows · ${t.columns.length} columns`} actions={<input aria-label="Filter rows" className="input w-56" placeholder="Filter…" value={q} onChange={(e) => setQ(e.target.value)} />}>
          {statsCol !== null && (() => {
            const st = columnStats(rows, statsCol);
            return <p className="text-sm text-slate-600 dark:text-slate-400"><strong>{t.columns[statsCol]}</strong>: {st.filled} filled, {st.unique} unique{st.numeric ? `, min ${st.min}, max ${st.max}` : ''}</p>;
          })()}
          <div className="max-h-[65vh] overflow-auto rounded-md border border-slate-200 dark:border-slate-800">
            <table className="data-table" data-testid="output">
              <thead className="sticky top-0 bg-white dark:bg-slate-950">
                <tr>
                  <th className="w-12 text-slate-500 dark:text-slate-400">#</th>
                  {t.columns.map((c, i) => (
                    <th key={i} aria-sort={sort?.col === i ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}>
                      <button type="button" className="inline-flex items-center gap-1 whitespace-nowrap hover:text-sky-600" onClick={() => { setStatsCol(i); setSort((cur) => ({ col: i, dir: cur?.col === i && cur.dir === 'asc' ? 'desc' : 'asc' })); }}>
                        {c}<span aria-hidden className="text-[10px]">{sort?.col === i ? (sort.dir === 'asc' ? '▲' : '▼') : '↕'}</span>
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="font-mono text-[13px]">
                {rows.slice(0, limit).map((row, ri) => (
                  <tr key={ri}><td className="text-slate-500 dark:text-slate-400">{ri + 1}</td>{row.map((c, ci) => <td key={ci} className="max-w-xs truncate" title={c}>{c}</td>)}</tr>
                ))}
              </tbody>
            </table>
          </div>
          {rows.length > limit && <button type="button" className="btn self-start" onClick={() => setLimit((l) => l + PAGE)}>Show {Math.min(PAGE, rows.length - limit)} more</button>}
        </Panel>
      )}
    </ToolShell>
  );
}
