import { ToolShell } from '@/components/ToolShell';
import { useToolState } from '@/lib/useToolState';
import { parseUa } from './logic';

export default function UserAgent() {
  const [s, set, api] = useToolState('user-agent', { ua: '' }, ['ua']);
  const lines = s.ua.split('\n').map((l) => l.trim()).filter(Boolean).slice(0, 200);
  const rows = lines.map((l) => ({ ua: l, ...parseUa(l) }));
  const output = JSON.stringify(rows, null, 2);
  return (
    <ToolShell onSample={() => set({ ua: navigator.userAgent + '\nMozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1\nMozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; ClaudeBot/1.0; +claudebot@anthropic.com)' })} onClear={() => set({ ua: '' })} output={rows.length ? output : ''} share={api}
      toolbar={<button type="button" className="btn" onClick={() => set({ ua: navigator.userAgent })}>Use my browser</button>}>
      <textarea aria-label="User-agent strings" spellCheck={false} className="code-box min-h-28 w-full resize-y" value={s.ua} onChange={(e) => set({ ua: e.target.value })} placeholder="Paste one user-agent per line (e.g. from server logs)…" />
      <div className="overflow-x-auto">
        <table className="data-table" data-testid="output">
          <thead><tr><th>Browser</th><th>Engine</th><th>OS</th><th>Device</th><th>CPU</th><th>Bot</th></tr></thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} title={r.ua}>
                <td>{r.browser}</td><td>{r.engine}</td><td>{r.os}</td><td>{r.device}</td><td>{r.cpu}</td>
                <td>{r.bot ? <span className="rounded bg-amber-100 px-1.5 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200">{r.bot}</span> : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ToolShell>
  );
}
