import type { SqlLanguage } from 'sql-formatter';
import { ToolShell } from '@/components/ToolShell';
import { Panel, SplitPanels } from '@/components/Panels';
import { OutputPanel } from '@/components/OutputPanel';
import { ErrorBox } from '@/components/ErrorBox';
import { useToolState } from '@/lib/useToolState';
import { useDebounced } from '@/lib/useDebounced';
import { DIALECTS, formatSql, minifySql } from './logic';

const SAMPLE = `select u.id, u.email, count(o.id) as orders, sum(o.total) as revenue from users u left join orders o on o.user_id = u.id and o.status in ('paid','shipped') where u.created_at >= now() - interval '30 days' group by u.id, u.email having count(o.id) > 2 order by revenue desc limit 20;`;

export default function SqlFormatter() {
  const [s, set, api] = useToolState('sql-formatter', { sql: '', language: 'postgresql' as SqlLanguage, keywordCase: 'upper' as 'preserve' | 'upper' | 'lower', tabWidth: 2, minify: false }, ['sql']);
  const sql = useDebounced(s.sql);
  const r = s.minify ? { ok: true as const, value: minifySql(sql) } : formatSql(sql, { language: s.language, keywordCase: s.keywordCase, tabWidth: s.tabWidth, linesBetweenQueries: 1 });
  const output = r.ok ? r.value : '';
  return (
    <ToolShell onSample={() => set({ sql: SAMPLE })} onClear={() => set({ sql: '' })} output={output} share={api}
      toolbar={
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <select aria-label="Dialect" className="select" value={s.language} onChange={(e) => set({ language: e.target.value as SqlLanguage })}>{DIALECTS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}</select>
          <select aria-label="Keyword case" className="select" value={s.keywordCase} onChange={(e) => set({ keywordCase: e.target.value as 'upper' })}><option value="upper">UPPER keywords</option><option value="lower">lower keywords</option><option value="preserve">Preserve case</option></select>
          <select aria-label="Indent" className="select" value={s.tabWidth} onChange={(e) => set({ tabWidth: Number(e.target.value) })}><option value={2}>2 spaces</option><option value={4}>4 spaces</option></select>
          <label className="flex items-center gap-1"><input type="checkbox" checked={s.minify} onChange={(e) => set({ minify: e.target.checked })} /> Minify</label>
        </div>
      }>
      <SplitPanels>
        <Panel title="SQL">
          <textarea aria-label="SQL input" spellCheck={false} className="code-box min-h-80 w-full resize-y" value={s.sql} onChange={(e) => set({ sql: e.target.value })} placeholder="Paste SQL…" />
          {!r.ok && <ErrorBox error={r.error} />}
        </Panel>
        <OutputPanel title={s.minify ? 'Minified' : 'Formatted'} value={output} />
      </SplitPanels>
    </ToolShell>
  );
}
