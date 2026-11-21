import { useRef, useState } from 'react';

export interface LoadedFile {
  name: string;
  type: string;
  size: number;
  bytes: Uint8Array;
}

/** File picker with drag-and-drop. Files are read locally with FileReader APIs; nothing is uploaded. */
export function FileDrop({ onFile, label = 'Choose a file or drop it here', accept, maxBytes = 50 * 1024 * 1024 }: { onFile: (f: LoadedFile) => void; label?: string; accept?: string; maxBytes?: number }) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const read = async (f: File | undefined) => {
    if (!f) return;
    if (f.size > maxBytes) return setError(`File is larger than ${Math.round(maxBytes / 1024 / 1024)} MB.`);
    setError(null);
    onFile({ name: f.name, type: f.type, size: f.size, bytes: new Uint8Array(await f.arrayBuffer()) });
  };
  return (
    <div>
      <button
        type="button"
        onClick={() => input.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); void read(e.dataTransfer.files[0]); }}
        className={`flex w-full flex-col items-center justify-center gap-1 rounded-md border-2 border-dashed px-4 py-6 text-sm ${over ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/40' : 'border-slate-300 dark:border-slate-700'} text-slate-600 hover:border-sky-500 dark:text-slate-400`}
      >
        <span aria-hidden className="text-xl">⇪</span>
        {label}
        <span className="text-xs text-slate-500 dark:text-slate-400">Read locally — never uploaded</span>
      </button>
      <input ref={input} type="file" accept={accept} className="hidden" aria-label={label} onChange={(e) => void read(e.target.files?.[0])} />
      {error && <p role="alert" className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

export function downloadBytes(bytes: Uint8Array, name: string, type = 'application/octet-stream') {
  const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
