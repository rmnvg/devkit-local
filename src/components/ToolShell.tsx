import { useEffect, useRef, useState, type ReactNode } from 'react';
import { categoryLabel } from '@/lib/types';
import { toggleFavorite, isFavorite, useStorage } from '@/lib/storage';
import type { ToolStateApi } from '@/lib/useToolState';
import { useToolMeta } from './ToolContext';
import { useCopy } from './CopyButton';
import { useToast } from './Toast';

export interface ToolShellProps {
  children: ReactNode;
  onSample?: () => void;
  onClear?: () => void;
  /** main output text: used by "Copy output" and Ctrl/Cmd+Shift+C */
  output?: string;
  /** Ctrl/Cmd+Enter */
  onRun?: () => void;
  share?: ToolStateApi;
  /** extra toolbar controls */
  toolbar?: ReactNode;
}

export function ToolShell({ children, onSample, onClear, output, onRun, share, toolbar }: ToolShellProps) {
  const meta = useToolMeta();
  const fav = useStorage(() => isFavorite(meta.slug));
  const copy = useCopy();
  const outputRef = useRef(output);
  outputRef.current = output;
  const runRef = useRef(onRun);
  runRef.current = onRun;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.shiftKey && e.key.toLowerCase() === 'c' && outputRef.current) {
        e.preventDefault();
        void copy(outputRef.current, 'Output copied');
      } else if (mod && e.key === 'Enter' && runRef.current) {
        e.preventDefault();
        runRef.current();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [copy]);

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-4">
      <header className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">{meta.name}</h1>
          <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            {categoryLabel(meta.category)}
          </span>
          <button
            type="button"
            aria-pressed={fav}
            aria-label={fav ? 'Remove from favorites' : 'Add to favorites'}
            title={fav ? 'Remove from favorites' : 'Add to favorites'}
            onClick={() => toggleFavorite(meta.slug)}
            className={`rounded p-1 text-xl leading-none ${fav ? 'text-amber-400' : 'text-slate-400 hover:text-amber-400'}`}
          >
            {fav ? '★' : '☆'}
          </button>
        </div>
        <p className="text-slate-600 dark:text-slate-400">{meta.description}</p>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        {onSample && (
          <button type="button" className="btn btn-primary" onClick={onSample}>
            Load sample
          </button>
        )}
        {onClear && (
          <button type="button" className="btn" onClick={onClear}>
            Clear
          </button>
        )}
        {output !== undefined && (
          <button type="button" className="btn" disabled={!output} onClick={() => void copy(output, 'Output copied')}>
            Copy output
          </button>
        )}
        {share && <ShareButton share={share} sensitive={!!meta.sensitive} />}
        {toolbar}
      </div>

      {children}

      <p className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
        <span aria-hidden>🔒</span> Runs locally. Nothing leaves your browser.
      </p>
    </div>
  );
}

function ShareButton({ share, sensitive }: { share: ToolStateApi; sensitive: boolean }) {
  const toast = useToast();
  const copy = useCopy();
  const [open, setOpen] = useState(false);
  const [includeInput, setIncludeInput] = useState(false);

  const doShare = (withInputs: boolean) => {
    const r = share.shareLink(withInputs);
    if (!r.ok) toast(r.error);
    else void copy(r.url, 'Share link copied');
    setOpen(false);
  };

  if (!sensitive || !share.hasInputKeys) {
    return (
      <button type="button" className="btn" onClick={() => doShare(true)}>
        Share link
      </button>
    );
  }
  return (
    <div className="relative">
      <button type="button" className="btn" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        Share link ▾
      </button>
      {open && (
        <div className="absolute left-0 top-full z-20 mt-1 w-72 rounded-md border border-slate-300 bg-white p-3 text-sm shadow-lg dark:border-slate-700 dark:bg-slate-900">
          <p className="mb-2 text-slate-600 dark:text-slate-400">
            This tool handles secrets. By default the link only includes settings.
          </p>
          <label className="mb-3 flex items-center gap-2">
            <input type="checkbox" checked={includeInput} onChange={(e) => setIncludeInput(e.target.checked)} />
            Include input (contains secrets?)
          </label>
          <button type="button" className="btn btn-primary w-full" onClick={() => doShare(includeInput)}>
            Copy link
          </button>
        </div>
      )}
    </div>
  );
}
