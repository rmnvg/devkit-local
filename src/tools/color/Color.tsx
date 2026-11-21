import { ToolShell } from '@/components/ToolShell';
import { CopyButton } from '@/components/CopyButton';
import { ErrorBox } from '@/components/ErrorBox';
import { useToolState } from '@/lib/useToolState';
import { contrastRatio, parseColor, suggestForeground, toHex, toHslString, toOklchString, toRgbString, wcag, type Rgba, type Result } from './logic';

/** Resolve CSS named colors using the browser, then parse. */
function resolve(input: string): Result<Rgba> {
  const direct = parseColor(input);
  if (direct.ok || !/^[a-z]+$/i.test(input.trim())) return direct;
  try {
    const ctx = document.createElement('canvas').getContext('2d');
    if (!ctx) return direct;
    ctx.fillStyle = '#010203';
    ctx.fillStyle = input.trim();
    if (ctx.fillStyle === '#010203' && input.trim().toLowerCase() !== '#010203') return { ok: false, error: `“${input}” is not a CSS color name.` };
    return parseColor(String(ctx.fillStyle));
  } catch {
    return direct;
  }
}

function Swatch({ c, label }: { c: Rgba; label: string }) {
  return <span aria-label={label} role="img" className="inline-block h-10 w-10 shrink-0 rounded-md border border-slate-300 dark:border-slate-700" style={{ background: toRgbString(c) }} />;
}

function Formats({ c }: { c: Rgba }) {
  const rows: [string, string][] = [['HEX', toHex(c)], ['RGB', toRgbString(c)], ['HSL', toHslString(c)], ['OKLCH', toOklchString(c)]];
  return (
    <table className="data-table">
      <tbody className="font-mono text-[13px]">
        {rows.map(([k, v]) => <tr key={k}><th scope="row" className="w-16 font-sans font-normal text-slate-500 dark:text-slate-400">{k}</th><td>{v}</td><td className="w-16 text-right"><CopyButton text={v} /></td></tr>)}
      </tbody>
    </table>
  );
}

const Badge = ({ pass, label }: { pass: boolean; label: string }) => (
  <span className={`rounded px-2 py-0.5 text-xs font-semibold ${pass ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-900/50 dark:text-emerald-200' : 'bg-red-100 text-red-900 dark:bg-red-900/50 dark:text-red-200'}`}>{pass ? '✓' : '✗'} {label}</span>
);

export default function Color() {
  const [s, set, api] = useToolState('color', { fg: '#1e90ff', bg: '#ffffff' }, []);
  const fg = resolve(s.fg);
  const bg = resolve(s.bg);
  const ratio = fg.ok && bg.ok ? contrastRatio(fg.value, bg.value) : null;
  const w = ratio ? wcag(ratio) : null;
  const fix = fg.ok && bg.ok && w && !w.aaNormal ? suggestForeground(fg.value, bg.value) : null;
  const output = fg.ok ? `${toHex(fg.value)}\n${toRgbString(fg.value)}\n${toHslString(fg.value)}\n${toOklchString(fg.value)}` : '';

  const input = (key: 'fg' | 'bg', label: string, r: Result<Rgba>) => (
    <div className="flex flex-col gap-2">
      <label className="field-label">{label}
        <div className="flex items-center gap-2">
          {r.ok && <Swatch c={r.value} label={`${label} swatch`} />}
          <input className="input flex-1 font-mono" spellCheck={false} value={s[key]} onChange={(e) => set({ [key]: e.target.value })} />
          <input type="color" aria-label={`${label} picker`} className="h-10 w-12 cursor-pointer rounded border border-slate-300 bg-transparent dark:border-slate-700" value={r.ok ? toHex({ ...r.value, a: 1 }) : '#000000'} onChange={(e) => set({ [key]: e.target.value })} />
        </div>
      </label>
      {r.ok ? <Formats c={r.value} /> : <ErrorBox error={r.error} />}
    </div>
  );

  return (
    <ToolShell onSample={() => set({ fg: 'hsl(210 80% 60%)', bg: '#0f172a' })} onClear={() => set({ fg: '#000000', bg: '#ffffff' })} output={output} share={api}>
      <div className="grid gap-6 lg:grid-cols-2">
        {input('fg', 'Foreground / color', fg)}
        {input('bg', 'Background', bg)}
      </div>
      {ratio !== null && fg.ok && bg.ok && w && (
        <section aria-label="Contrast" className="flex flex-col gap-3 rounded-md border border-slate-200 p-4 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Contrast ratio</div>
              <div data-testid="output" className="font-mono text-3xl font-semibold">{ratio.toFixed(2)}:1</div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge pass={w.aaNormal} label="AA text" /><Badge pass={w.aaLarge} label="AA large" /><Badge pass={w.aaaNormal} label="AAA text" /><Badge pass={w.aaaLarge} label="AAA large" /><Badge pass={w.ui} label="UI components" />
            </div>
          </div>
          <div className="rounded-md p-4" style={{ background: toRgbString(bg.value), color: toRgbString(fg.value) }}>
            <p className="text-2xl font-semibold">Large heading text</p>
            <p>Normal body text at 16px. The quick brown fox jumps over the lazy dog.</p>
          </div>
          {fix && (
            <p className="flex items-center gap-2 text-sm">
              <Swatch c={fix} label="Suggested color" /> Nearest color passing AA: <code className="font-mono">{toHex(fix)}</code>
              <button type="button" className="btn btn-sm" onClick={() => set({ fg: toHex(fix) })}>Use it</button>
            </p>
          )}
        </section>
      )}
    </ToolShell>
  );
}
