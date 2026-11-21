import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';

const ToastCtx = createContext<(msg: string) => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [msg, setMsg] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const show = useCallback((m: string) => {
    setMsg(m);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setMsg(null), 1800);
  }, []);
  return (
    <ToastCtx.Provider value={show}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center">
        {msg && (
          <div role="status" className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white shadow-lg ring-1 ring-white/10 dark:bg-slate-100 dark:text-slate-900">
            {msg}
          </div>
        )}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  return useContext(ToastCtx);
}
