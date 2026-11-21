import { useEffect, useState } from 'react';
import { ToolShell } from '@/components/ToolShell';
import { Panel, SplitPanels } from '@/components/Panels';
import { CopyButton } from '@/components/CopyButton';
import { FileDrop, formatBytes, type LoadedFile } from '@/components/FileDrop';
import { useToolState } from '@/lib/useToolState';
import { useDebounced } from '@/lib/useDebounced';
import { ALGORITHMS, hashAll, matchHash, type Algorithm, type OutputEncoding } from './logic';

export default function Hash() {
  const [s, set, api] = useToolState('hash', { text: '', encoding: 'hex' as OutputEncoding, expected: '' }, ['text', 'expected']);
  const [file, setFile] = useState<LoadedFile | null>(null);
  const [hashes, setHashes] = useState<Record<Algorithm, string> | null>(null);
  const text = useDebounced(s.text, 150);

  useEffect(() => {
    let cancelled = false;
    const data = file ? file.bytes : new TextEncoder().encode(text);
    if (!file && !text) { setHashes(null); return; }
    void hashAll(data, s.encoding).then((h) => !cancelled && setHashes(h));
    return () => { cancelled = true; };
  }, [text, file, s.encoding]);

  const match = hashes && s.expected.trim() ? matchHash(s.expected, hashes) : null;
  const output = hashes ? ALGORITHMS.map((a) => `${a}: ${hashes[a]}`).join('\n') : '';

  return (
    <ToolShell onSample={() => { setFile(null); set({ text: 'The quick brown fox jumps over the lazy dog' }); }} onClear={() => { setFile(null); set({ text: '', expected: '' }); }} output={output} share={api}
      toolbar={
        <label className="flex items-center gap-2 text-sm">Output
          <select className="select" value={s.encoding} onChange={(e) => set({ encoding: e.target.value as OutputEncoding })}>
            <option value="hex">hex</option><option value="HEX">HEX</option><option value="base64">base64</option>
          </select>
        </label>
      }
    >
      <SplitPanels>
        <Panel title="Input">
          <textarea aria-label="Text to hash" spellCheck={false} className="code-box min-h-40 w-full resize-y" value={s.text} onChange={(e) => { setFile(null); set({ text: e.target.value }); }} placeholder="Text (hashed as UTF-8)…" />
          <FileDrop onFile={(f) => { setFile(f); set({ text: '' }); }} label="Or hash a file" maxBytes={500 * 1024 * 1024} />
          {file && <p className="text-sm text-slate-600 dark:text-slate-400">{file.name} · {formatBytes(file.size)}</p>}
          <label className="field-label">
            Verify against an expected checksum
            <input className="input font-mono" spellCheck={false} value={s.expected} onChange={(e) => set({ expected: e.target.value })} placeholder="Paste a hash to compare" />
          </label>
          {s.expected.trim() && hashes && (match
            ? <p role="status" className="text-sm font-medium text-emerald-700 dark:text-emerald-400">✓ Matches {match}</p>
            : <p role="alert" className="text-sm font-medium text-red-700 dark:text-red-400">✗ Doesn’t match any algorithm</p>)}
        </Panel>
        <Panel title="Hashes">
          <table className="data-table" data-testid="output">
            <tbody>
              {ALGORITHMS.map((a) => (
                <tr key={a} className={match === a ? 'bg-emerald-50 dark:bg-emerald-950/40' : ''}>
                  <th scope="row" className="w-24 font-normal text-slate-500 dark:text-slate-400">{a}</th>
                  <td className="break-all font-mono text-[13px]">{hashes?.[a] ?? ''}</td>
                  <td className="w-16 text-right"><CopyButton text={hashes?.[a] ?? ''} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-xs text-slate-500 dark:text-slate-400">MD5 and SHA-1 are broken for security purposes; use them only for checksums.</p>
        </Panel>
      </SplitPanels>
    </ToolShell>
  );
}
