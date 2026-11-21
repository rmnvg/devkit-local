import { useState } from 'react';
import { ToolShell } from '@/components/ToolShell';
import { CopyButton } from '@/components/CopyButton';
import { WarningBox } from '@/components/ErrorBox';
import { FileDrop, formatBytes, type LoadedFile } from '@/components/FileDrop';
import { useToolState } from '@/lib/useToolState';
import { toDataUri } from '@/tools/base64/logic';
import { base64Size, mediaTypeFor, snippets } from './logic';

const SAMPLE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#0b0f17"/><path d="M20 22 10 32l10 10M44 22l10 10-10 10M36 16l-8 32" fill="none" stroke="#38bdf8" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

export default function ImageBase64() {
  const [, , api] = useToolState('image-base64', {}, []);
  const [file, setFile] = useState<LoadedFile | null>(null);
  const [dims, setDims] = useState<{ w: number; h: number } | null>(null);
  const uri = file ? toDataUri(file.bytes, mediaTypeFor(file.name, file.type)) : '';
  const snips = file ? snippets(uri, file.name, dims?.w, dims?.h) : null;
  const load = (f: LoadedFile) => { setDims(null); setFile(f); };
  return (
    <ToolShell onSample={() => load({ name: 'devkit-logo.svg', type: 'image/svg+xml', size: SAMPLE_SVG.length, bytes: new TextEncoder().encode(SAMPLE_SVG) })} onClear={() => setFile(null)} output={uri} share={api}>
      <FileDrop accept="image/*" onFile={load} label="Choose an image or drop it here" maxBytes={10 * 1024 * 1024} />
      {file && (
        <div className="grid gap-4 lg:grid-cols-[1fr_2fr]">
          <div className="flex flex-col gap-2">
            <img src={uri} alt="Preview" className="max-h-64 self-start rounded border border-slate-200 bg-[repeating-conic-gradient(#e2e8f0_0_25%,transparent_0_50%)] bg-[length:16px_16px] dark:border-slate-800" onLoad={(e) => setDims({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })} />
            <p className="text-sm text-slate-600 dark:text-slate-400">{file.name} · {dims ? `${dims.w}×${dims.h} · ` : ''}{formatBytes(file.size)} → {formatBytes(base64Size(file.size))} as Base64</p>
            {file.size > 20 * 1024 && <WarningBox>Inlining images over ~20 KB usually hurts performance; a normal file is cached separately.</WarningBox>}
          </div>
          <div className="flex flex-col gap-3" data-testid="output">
            {snips && Object.entries(snips).map(([k, v]) => (
              <div key={k}>
                <div className="mb-1 flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{k}<CopyButton text={v} /></div>
                <pre className="code-box max-h-24 overflow-auto break-all whitespace-pre-wrap text-xs">{v}</pre>
              </div>
            ))}
          </div>
        </div>
      )}
    </ToolShell>
  );
}
