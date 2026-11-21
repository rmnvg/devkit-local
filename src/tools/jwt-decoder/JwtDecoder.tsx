import { useEffect, useState } from 'react';
import { ToolShell } from '@/components/ToolShell';
import { Panel, SplitPanels } from '@/components/Panels';
import { ErrorBox, WarningBox } from '@/components/ErrorBox';
import { CopyButton } from '@/components/CopyButton';
import { useToolState } from '@/lib/useToolState';
import { useDebounced } from '@/lib/useDebounced';
import { decodeJwt, verifyJwt } from './logic';
import { SAMPLE_JWT, SAMPLE_SECRET } from './samples';

const SEG = ['text-rose-600 dark:text-rose-400', 'text-violet-600 dark:text-violet-400', 'text-sky-600 dark:text-sky-400'];

type VerifyState = { status: 'idle' } | { status: 'ok' } | { status: 'fail'; error: string };

export default function JwtDecoder() {
  const [s, set, api] = useToolState('jwt-decoder', { token: '', key: '', keyBase64: false }, ['token', 'key']);
  const decoded = decodeJwt(s.token);
  const [verify, setVerify] = useState<VerifyState>({ status: 'idle' });
  const dToken = useDebounced(s.token);
  const dKey = useDebounced(s.key);

  useEffect(() => {
    let cancelled = false;
    if (!dKey.trim() || !dToken.trim()) {
      setVerify({ status: 'idle' });
      return;
    }
    verifyJwt(dToken, dKey, s.keyBase64).then((r) => {
      if (!cancelled) setVerify(r.ok ? { status: 'ok' } : { status: 'fail', error: r.error });
    });
    return () => {
      cancelled = true;
    };
  }, [dToken, dKey, s.keyBase64]);

  const headerJson = decoded.ok ? JSON.stringify(decoded.value.header, null, 2) : '';
  const payloadJson = decoded.ok ? JSON.stringify(decoded.value.payload, null, 2) : '';
  const alg = decoded.ok ? String(decoded.value.header.alg ?? '') : '';
  const isHmac = /^HS/i.test(alg);

  return (
    <ToolShell
      onSample={() => set({ token: SAMPLE_JWT, key: SAMPLE_SECRET, keyBase64: false })}
      onClear={() => set({ token: '', key: '' })}
      output={payloadJson}
      share={api}
    >
      <SplitPanels>
        <Panel title="Encoded token">
          <textarea
            aria-label="JWT"
            data-testid="input"
            spellCheck={false}
            className="code-box min-h-40 w-full resize-y"
            placeholder="eyJhbGciOi…"
            value={s.token}
            onChange={(e) => set({ token: e.target.value })}
          />
          {decoded.ok && (
            <div role="region" className="code-box break-all" aria-label="Token segments">
              {decoded.value.parts.map((p, i) => (
                <span key={i}>
                  {i > 0 && <span className="text-slate-500 dark:text-slate-400">.</span>}
                  <span className={SEG[i]}>{p}</span>
                </span>
              ))}
            </div>
          )}
          {s.token.trim() && !decoded.ok && <ErrorBox error={decoded.error} />}

          <h3 className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Verify signature (optional)</h3>
          <textarea
            aria-label={isHmac ? 'Shared secret' : 'Public key, certificate or JWK'}
            spellCheck={false}
            className="code-box min-h-24 w-full resize-y"
            placeholder={isHmac ? 'Shared secret' : 'Public key (PEM), X.509 certificate, JWK or JWKS'}
            value={s.key}
            onChange={(e) => set({ key: e.target.value })}
          />
          {isHmac && (
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={s.keyBase64} onChange={(e) => set({ keyBase64: e.target.checked })} />
              Secret is base64 encoded
            </label>
          )}
          {verify.status === 'ok' && (
            <div role="status" className="rounded-md border border-emerald-400 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
              ✓ Signature verified ({alg})
            </div>
          )}
          {verify.status === 'fail' && <ErrorBox error={verify.error} />}
        </Panel>

        <Panel title="Decoded">
          {decoded.ok ? (
            <>
              {decoded.value.warnings.map((w) => <WarningBox key={w}>{w}</WarningBox>)}
              <Section title="Header" json={headerJson} color={SEG[0]!} />
              <Section title="Payload" json={payloadJson} color={SEG[1]!} testId="output" />
              {decoded.value.times.length > 0 && (
                <table className="data-table">
                  <thead><tr><th>Claim</th><th>Date (UTC)</th><th>Local</th><th>Relative</th></tr></thead>
                  <tbody className="font-mono text-[13px]">
                    {decoded.value.times.map((t) => (
                      <tr key={t.claim}>
                        <td>{t.claim}</td>
                        <td>{t.iso}</td>
                        <td>{new Date(t.seconds * 1000).toLocaleString()}</td>
                        <td className={t.claim === 'exp' && decoded.value.expired ? 'text-red-600 dark:text-red-400' : ''}>{t.claim === 'exp' ? (decoded.value.expired ? `expired ${t.relative}` : `expires ${t.relative}`) : t.relative}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          ) : (
            <pre data-testid="output" className="code-box min-h-40 text-slate-500 dark:text-slate-400">Decoded header and payload appear here.</pre>
          )}
        </Panel>
      </SplitPanels>
    </ToolShell>
  );
}

function Section({ title, json, color, testId }: { title: string; json: string; color: string; testId?: string }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <h3 className={`text-xs font-semibold uppercase tracking-wide ${color}`}>{title}</h3>
        <CopyButton text={json} />
      </div>
      <pre data-testid={testId} className="code-box max-h-96 overflow-auto">{json}</pre>
    </div>
  );
}
