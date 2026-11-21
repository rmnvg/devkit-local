import { useEffect, useState } from 'react';
import { ToolShell } from '@/components/ToolShell';
import { Panel, SplitPanels } from '@/components/Panels';
import { CopyButton } from '@/components/CopyButton';
import { ErrorBox } from '@/components/ErrorBox';
import { useToolState } from '@/lib/useToolState';
import { useDebounced } from '@/lib/useDebounced';
import { computeHmac, verify, type HmacAlg, type HmacOut, type KeyEncoding, type Result } from './logic';

export default function Hmac() {
  const [s, set, api] = useToolState('hmac', { message: '', key: '', keyEnc: 'utf8' as KeyEncoding, alg: 'SHA-256' as HmacAlg, expected: '' }, ['message', 'key', 'expected']);
  const [r, setR] = useState<Result<HmacOut> | null>(null);
  const message = useDebounced(s.message, 150);
  const key = useDebounced(s.key, 150);
  useEffect(() => {
    let cancelled = false;
    if (!key) { setR(null); return; }
    void computeHmac(s.alg, key, s.keyEnc, message).then((x) => !cancelled && setR(x));
    return () => { cancelled = true; };
  }, [message, key, s.keyEnc, s.alg]);
  const out = r?.ok ? r.value : null;

  return (
    <ToolShell
      onSample={() => set({ message: '{"event":"payment.succeeded","id":"evt_123","amount":4200}', key: 'whsec_demo_secret', keyEnc: 'utf8', alg: 'SHA-256' })}
      onClear={() => set({ message: '', key: '', expected: '' })}
      output={out?.hex ?? ''}
      share={api}
    >
      <SplitPanels>
        <Panel title="Input">
          <label className="field-label">Message
            <textarea spellCheck={false} className="code-box min-h-32 w-full resize-y" value={s.message} onChange={(e) => set({ message: e.target.value })} placeholder="Raw request body or message…" />
          </label>
          <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
            <label className="field-label">Secret key
              <input className="input font-mono" spellCheck={false} autoComplete="off" value={s.key} onChange={(e) => set({ key: e.target.value })} />
            </label>
            <label className="field-label">Key format
              <select className="select" value={s.keyEnc} onChange={(e) => set({ keyEnc: e.target.value as KeyEncoding })}><option value="utf8">Text</option><option value="hex">Hex</option><option value="base64">Base64</option></select>
            </label>
            <label className="field-label">Algorithm
              <select className="select" value={s.alg} onChange={(e) => set({ alg: e.target.value as HmacAlg })}>{(['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'] as const).map((a) => <option key={a}>{a}</option>)}</select>
            </label>
          </div>
          {r && !r.ok && <ErrorBox error={r.error} />}
          <label className="field-label">Verify a signature (hex, base64, or “sha256=…”)
            <input className="input font-mono" spellCheck={false} value={s.expected} onChange={(e) => set({ expected: e.target.value })} />
          </label>
          {s.expected.trim() && out && (verify(s.expected, out)
            ? <p role="status" className="text-sm font-medium text-emerald-700 dark:text-emerald-400">✓ Signature matches</p>
            : <p role="alert" className="text-sm font-medium text-red-700 dark:text-red-400">✗ Signature does not match</p>)}
        </Panel>
        <Panel title="Signature">
          <table className="data-table">
            <tbody className="font-mono text-[13px]">
              {(['hex', 'base64', 'base64url'] as const).map((k) => (
                <tr key={k}>
                  <th scope="row" className="w-24 font-sans font-normal text-slate-500 dark:text-slate-400">{k}</th>
                  <td className="break-all" data-testid={k === 'hex' ? 'output' : undefined}>{out?.[k] ?? ''}</td>
                  <td className="w-16 text-right"><CopyButton text={out?.[k] ?? ''} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-xs text-slate-500 dark:text-slate-400">Webhook providers sign the exact raw body. Re-serializing JSON (spacing, key order) changes the signature.</p>
        </Panel>
      </SplitPanels>
    </ToolShell>
  );
}
