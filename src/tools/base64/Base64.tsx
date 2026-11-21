import { useState } from 'react';
import { ToolShell } from '@/components/ToolShell';
import { Panel, SplitPanels } from '@/components/Panels';
import { OutputPanel } from '@/components/OutputPanel';
import { ErrorBox } from '@/components/ErrorBox';
import { Tabs } from '@/components/Tabs';
import { FileDrop, downloadBytes, formatBytes, type LoadedFile } from '@/components/FileDrop';
import { useToolState } from '@/lib/useToolState';
import { useDebounced } from '@/lib/useDebounced';
import { bytesToBase64 } from '@/lib/encoding';
import { decode, encodeText, hexPreview, toDataUri } from './logic';

type Mode = 'encode' | 'decode';

export default function Base64() {
  const [s, set, api] = useToolState('base64', { text: '', mode: 'encode' as Mode, urlSafe: false, wrap: false }, ['text']);
  const [file, setFile] = useState<LoadedFile | null>(null);
  const text = useDebounced(s.text, 150);
  const dec = s.mode === 'decode' && text.trim() ? decode(text) : null;
  const fileB64 = file ? bytesToBase64(file.bytes) : '';
  const output = file && s.mode === 'encode' ? fileB64 : s.mode === 'encode' ? (text ? encodeText(text, s.urlSafe, s.wrap ? 76 : 0) : '') : dec?.ok ? (dec.value.text ?? '') : '';

  return (
    <ToolShell
      onSample={() => { setFile(null); set({ text: s.mode === 'encode' ? 'Hello, devkit-local! 👋 Runs locally.' : 'SGVsbG8sIGRldmtpdC1sb2NhbCEg8J+RiyBSdW5zIGxvY2FsbHku' }); }}
      onClear={() => { setFile(null); set({ text: '' }); }}
      output={output}
      share={api}
      toolbar={
        <>
          <Tabs label="Mode" value={s.mode} onChange={(mode) => { setFile(null); set({ mode, text: output && !file ? output : s.text }); }} options={[{ value: 'encode', label: 'Encode' }, { value: 'decode', label: 'Decode' }]} />
          {s.mode === 'encode' && (
            <>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={s.urlSafe} onChange={(e) => set({ urlSafe: e.target.checked })} /> URL-safe</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={s.wrap} onChange={(e) => set({ wrap: e.target.checked })} /> Wrap at 76 chars (MIME)</label>
            </>
          )}
        </>
      }
    >
      <SplitPanels>
        <Panel title={s.mode === 'encode' ? 'Text or file' : 'Base64'}>
          <textarea aria-label={s.mode === 'encode' ? 'Text to encode' : 'Base64 to decode'} spellCheck={false} className="code-box min-h-48 w-full resize-y" value={s.text} onChange={(e) => { setFile(null); set({ text: e.target.value }); }} placeholder={s.mode === 'encode' ? 'Type text…' : 'Paste Base64, Base64URL or a data: URI…'} />
          {s.mode === 'encode' && <FileDrop onFile={(f) => { setFile(f); set({ text: '' }); }} />}
          {file && <p className="text-sm text-slate-600 dark:text-slate-400">{file.name} · {formatBytes(file.size)} · {file.type || 'unknown type'}</p>}
          {dec && !dec.ok && <ErrorBox error={dec.error} />}
        </Panel>
        <div className="flex min-w-0 flex-col gap-2">
          {s.mode === 'decode' && dec?.ok && dec.value.text === null ? (
            <Panel title={`Binary data (${formatBytes(dec.value.bytes.length)}${dec.value.mediaType ? `, ${dec.value.mediaType}` : ''})`} actions={<button type="button" className="btn btn-sm" onClick={() => downloadBytes(dec.value.bytes, 'decoded' + (dec.value.mediaType?.includes('png') ? '.png' : dec.value.mediaType?.includes('jpeg') ? '.jpg' : '.bin'), dec.value.mediaType ?? undefined)}>Download</button>}>
              {dec.value.mediaType?.startsWith('image/') && <img alt="Decoded preview" className="max-h-64 self-start rounded border border-slate-200 dark:border-slate-800" src={toDataUri(dec.value.bytes, dec.value.mediaType)} />}
              <pre data-testid="output" className="code-box overflow-auto">{hexPreview(dec.value.bytes)}</pre>
            </Panel>
          ) : (
            <OutputPanel title={s.mode === 'encode' ? 'Base64' : 'Decoded text'} value={output} />
          )}
          {file && s.mode === 'encode' && <OutputPanel title="Data URI" value={toDataUri(file.bytes, file.type)} testId="data-uri" />}
        </div>
      </SplitPanels>
    </ToolShell>
  );
}
