import { useEffect, useState } from 'react';
import { ToolShell } from '@/components/ToolShell';
import { ErrorBox } from '@/components/ErrorBox';
import { FileDrop, downloadBytes, formatBytes, type LoadedFile } from '@/components/FileDrop';
import { useToolState } from '@/lib/useToolState';
import { useDebounced } from '@/lib/useDebounced';
import { compressImage, outputName, savings, type OutputFormat } from './logic';

type Out = { blob: Blob; url: string; width: number; height: number };

/** Draws a gradient test image so the sample works without bundling a photo. */
async function sampleImage(): Promise<LoadedFile> {
  const c = document.createElement('canvas');
  c.width = 1600; c.height = 1000;
  const ctx = c.getContext('2d')!;
  const g = ctx.createLinearGradient(0, 0, 1600, 1000);
  g.addColorStop(0, '#0ea5e9'); g.addColorStop(0.5, '#a855f7'); g.addColorStop(1, '#f59e0b');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 1600, 1000);
  for (let i = 0; i < 400; i++) { ctx.fillStyle = `hsla(${(i * 37) % 360} 80% 60% / 0.35)`; ctx.beginPath(); ctx.arc((i * 97) % 1600, (i * 53) % 1000, 10 + (i % 40), 0, 7); ctx.fill(); }
  const blob = await new Promise<Blob>((r) => c.toBlob((b) => r(b!), 'image/png'));
  return { name: 'sample.png', type: 'image/png', size: blob.size, bytes: new Uint8Array(await blob.arrayBuffer()) };
}

export default function ImageCompressor() {
  const [s, set, api] = useToolState('image-compressor', { format: 'image/webp' as OutputFormat, quality: 0.8, maxWidth: 1920, maxHeight: 0 }, []);
  const [file, setFile] = useState<LoadedFile | null>(null);
  const [srcUrl, setSrcUrl] = useState('');
  const [out, setOut] = useState<Out | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const quality = useDebounced(s.quality, 250);

  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(new Blob([file.bytes as BlobPart], { type: file.type }));
    setSrcUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    let cancelled = false;
    let url = '';
    if (!file) { setOut(null); return; }
    compressImage(new Blob([file.bytes as BlobPart], { type: file.type }), { format: s.format, quality, maxWidth: s.maxWidth, maxHeight: s.maxHeight }).then(
      (r) => { if (cancelled) return; url = URL.createObjectURL(r.blob); setErr(null); setOut({ blob: r.blob, url, width: r.width, height: r.height }); },
      (e: unknown) => !cancelled && setErr(e instanceof Error ? e.message : 'Could not read this image.'),
    );
    return () => { cancelled = true; if (url) URL.revokeObjectURL(url); };
  }, [file, s.format, quality, s.maxWidth, s.maxHeight]);

  return (
    <ToolShell onSample={() => void sampleImage().then(setFile)} onClear={() => { setFile(null); setOut(null); }} share={api}>
      <FileDrop accept="image/*" onFile={setFile} label="Choose an image or drop it here" maxBytes={50 * 1024 * 1024} />
      <div className="grid gap-3 sm:grid-cols-4">
        <label className="field-label">Format<select className="select" value={s.format} onChange={(e) => set({ format: e.target.value as OutputFormat })}><option value="image/webp">WebP</option><option value="image/jpeg">JPEG</option><option value="image/png">PNG (lossless)</option></select></label>
        <label className="field-label">Quality: {Math.round(s.quality * 100)}%<input type="range" min={0.1} max={1} step={0.05} value={s.quality} disabled={s.format === 'image/png'} onChange={(e) => set({ quality: Number(e.target.value) })} /></label>
        <label className="field-label">Max width (0 = none)<input className="input" type="number" min={0} value={s.maxWidth} onChange={(e) => set({ maxWidth: Math.max(0, Number(e.target.value) || 0) })} /></label>
        <label className="field-label">Max height (0 = none)<input className="input" type="number" min={0} value={s.maxHeight} onChange={(e) => set({ maxHeight: Math.max(0, Number(e.target.value) || 0) })} /></label>
      </div>
      {err && <ErrorBox error={err} />}
      {file && (
        <div className="grid gap-4 lg:grid-cols-2">
          <figure className="flex flex-col gap-1">
            <img src={srcUrl} alt="Original" className="max-h-80 rounded border border-slate-200 object-contain dark:border-slate-800" />
            <figcaption className="text-sm text-slate-600 dark:text-slate-400">Original · {formatBytes(file.size)}</figcaption>
          </figure>
          <figure className="flex flex-col gap-1">
            {out && <img src={out.url} alt="Compressed" className="max-h-80 rounded border border-slate-200 object-contain dark:border-slate-800" />}
            <figcaption className="flex flex-wrap items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              {out ? <>
                <span data-testid="output">Compressed · {out.width}×{out.height} · {formatBytes(out.blob.size)} · {savings(file.size, out.blob.size)}</span>
                <button type="button" className="btn btn-sm" onClick={() => void out.blob.arrayBuffer().then((b) => downloadBytes(new Uint8Array(b), outputName(file.name, s.format), s.format))}>Download</button>
              </> : 'Compressing…'}
            </figcaption>
          </figure>
        </div>
      )}
    </ToolShell>
  );
}
