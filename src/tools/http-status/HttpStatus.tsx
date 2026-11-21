import { ToolShell } from '@/components/ToolShell';
import { useToolState } from '@/lib/useToolState';
import { CLASSES, searchStatuses } from './data';

const COLOR: Record<number, string> = {
  1: 'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200',
  2: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200',
  3: 'bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-200',
  4: 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200',
  5: 'bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-200',
};

export default function HttpStatus() {
  const [s, set, api] = useToolState('http-status', { q: '' }, []);
  const list = searchStatuses(s.q);
  const output = list.map((x) => `${x.code} ${x.name}`).join('\n');
  return (
    <ToolShell onSample={() => set({ q: '429' })} onClear={() => set({ q: '' })} output={output} share={api}>
      <input aria-label="Search status codes" className="input max-w-md" placeholder="Search: 404, 4xx, rate limit, redirect…" value={s.q} onChange={(e) => set({ q: e.target.value })} />
      <div data-testid="output" className="flex flex-col gap-6">
        {[1, 2, 3, 4, 5].map((c) => {
          const items = list.filter((x) => Math.floor(x.code / 100) === c);
          if (!items.length) return null;
          return (
            <section key={c} aria-label={CLASSES[c]}>
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{c}xx {CLASSES[c]}</h2>
              <ul className="grid gap-2 md:grid-cols-2">
                {items.map((x) => (
                  <li key={x.code} className="flex gap-3 rounded-md border border-slate-200 p-3 dark:border-slate-800">
                    <span className={`h-fit rounded px-2 py-0.5 font-mono text-sm font-semibold ${COLOR[c]}`}>{x.code}</span>
                    <div>
                      <div className="font-medium">{x.name}</div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">{x.description}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{x.spec}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
        {list.length === 0 && <p className="text-slate-500 dark:text-slate-400">No status codes match.</p>}
      </div>
    </ToolShell>
  );
}
