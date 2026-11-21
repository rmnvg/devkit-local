import { useEffect, useRef } from 'react';

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);
const MOD = isMac ? '⌘' : 'Ctrl';

const SHORTCUTS: [string, string][] = [
  [`${MOD} K`, 'Open command palette'],
  [`${MOD} Enter`, 'Run / format (where available)'],
  [`${MOD} Shift C`, 'Copy output'],
  ['?', 'Show this list'],
  ['Esc', 'Close dialogs'],
];

export function ShortcutsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal?.();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      aria-labelledby="shortcuts-title"
      className="w-[min(28rem,calc(100vw-2rem))] rounded-lg border border-slate-300 bg-white p-0 text-slate-900 shadow-xl backdrop:bg-black/50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
    >
      <div className="p-5">
        <h2 id="shortcuts-title" className="mb-3 text-lg font-semibold">Keyboard shortcuts</h2>
        <table className="w-full text-sm">
          <tbody>
            {SHORTCUTS.map(([k, d]) => (
              <tr key={k} className="border-t border-slate-200 dark:border-slate-800">
                <td className="py-2 pr-4"><kbd className="kbd">{k}</kbd></td>
                <td className="py-2">{d}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-4 text-right">
          <button type="button" className="btn" onClick={onClose}>Close</button>
        </div>
      </div>
    </dialog>
  );
}
