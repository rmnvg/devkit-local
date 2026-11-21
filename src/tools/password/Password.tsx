import { useState } from 'react';
import { ToolShell } from '@/components/ToolShell';
import { Panel, SplitPanels } from '@/components/Panels';
import { OutputPanel } from '@/components/OutputPanel';
import { ErrorBox } from '@/components/ErrorBox';
import { useToolState } from '@/lib/useToolState';
import { entropyBits, generatePassword, randomToken, strengthLabel } from './logic';

export default function Password() {
  const [s, set, api] = useToolState('password', { length: 20, lower: true, upper: true, digits: true, symbols: true, excludeAmbiguous: false, requireEach: true, count: 5, tokenBytes: 32, tokenEnc: 'base64url' as 'hex' | 'base64url' }, []);
  const [out, setOut] = useState('');
  const [tokens, setTokens] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const bits = entropyBits(s);

  const gen = () => {
    const list: string[] = [];
    for (let i = 0; i < Math.min(100, Math.max(1, s.count)); i++) {
      const r = generatePassword(s);
      if (!r.ok) { setErr(r.error); setOut(''); return; }
      list.push(r.value);
    }
    setErr(null);
    setOut(list.join('\n'));
  };

  return (
    <ToolShell onSample={gen} onClear={() => { setOut(''); setTokens(''); }} output={out} onRun={gen} share={api}>
      <SplitPanels>
        <Panel title="Password options">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="field-label">Length: {s.length}
              <input type="range" min={4} max={128} value={s.length} onChange={(e) => set({ length: Number(e.target.value) })} />
            </label>
            <label className="field-label">How many
              <input className="input font-mono" type="number" min={1} max={100} value={s.count} onChange={(e) => set({ count: Math.floor(Number(e.target.value)) || 1 })} />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {([['lower', 'Lowercase a–z'], ['upper', 'Uppercase A–Z'], ['digits', 'Digits 0–9'], ['symbols', 'Symbols !@#…'], ['excludeAmbiguous', 'Exclude look-alikes (Il1O0)'], ['requireEach', 'At least one of each']] as const).map(([k, l]) => (
              <label key={k} className="flex items-center gap-2"><input type="checkbox" checked={s[k]} onChange={(e) => set({ [k]: e.target.checked })} />{l}</label>
            ))}
          </div>
          <p className="text-sm">Entropy: <strong>{bits} bits</strong> ({strengthLabel(bits)})</p>
          <button type="button" className="btn btn-primary self-start" onClick={gen}>Generate passwords</button>
          {err && <ErrorBox error={err} />}

          <h3 className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Random secret / API key</h3>
          <div className="flex flex-wrap items-end gap-2">
            <label className="field-label">Bytes
              <select className="select" value={s.tokenBytes} onChange={(e) => set({ tokenBytes: Number(e.target.value) })}>{[16, 24, 32, 48, 64].map((n) => <option key={n} value={n}>{n} ({n * 8} bits)</option>)}</select>
            </label>
            <label className="field-label">Encoding
              <select className="select" value={s.tokenEnc} onChange={(e) => set({ tokenEnc: e.target.value as 'hex' | 'base64url' })}><option value="base64url">base64url</option><option value="hex">hex</option></select>
            </label>
            <button type="button" className="btn" onClick={() => setTokens(Array.from({ length: 5 }, () => randomToken(s.tokenBytes, s.tokenEnc)).join('\n'))}>Generate secrets</button>
          </div>
          {tokens && <OutputPanel title="Secrets" value={tokens} testId="tokens" />}
        </Panel>
        <OutputPanel title="Passwords" value={out} placeholder="Press Generate." />
      </SplitPanels>
      <p className="text-xs text-slate-500 dark:text-slate-400">Uses <code>crypto.getRandomValues</code> with rejection sampling (no modulo bias). Generated values are never stored or included in share links.</p>
    </ToolShell>
  );
}
