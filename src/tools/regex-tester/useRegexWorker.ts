import { useEffect, useRef, useState } from 'react';
import type { RegexRun, Result } from './logic';

const TIMEOUT_MS = 1500;

type State = { status: 'idle' | 'running' } | { status: 'done'; result: Result<RegexRun> } | { status: 'timeout' };

/** Runs the regex in a worker; kills it if a pattern backtracks for too long. */
export function useRegexWorker(pattern: string, flags: string, text: string, replacement: string | null): State {
  const workerRef = useRef<Worker | null>(null);
  const idRef = useRef(0);
  const [state, setState] = useState<State>({ status: 'idle' });

  useEffect(() => () => workerRef.current?.terminate(), []);

  useEffect(() => {
    const id = ++idRef.current;
    let worker = workerRef.current;
    if (!worker) {
      worker = new Worker(new URL('../../workers/regex.worker.ts', import.meta.url), { type: 'module' });
      workerRef.current = worker;
    }
    setState((s) => (s.status === 'done' ? s : { status: 'running' }));
    const timer = setTimeout(() => {
      worker.terminate();
      workerRef.current = null;
      if (idRef.current === id) setState({ status: 'timeout' });
    }, TIMEOUT_MS);
    worker.onmessage = (e: MessageEvent<{ id: number; result: Result<RegexRun> }>) => {
      if (e.data.id !== idRef.current) return;
      clearTimeout(timer);
      setState({ status: 'done', result: e.data.result });
    };
    worker.postMessage({ id, pattern, flags, text, replacement });
    return () => clearTimeout(timer);
  }, [pattern, flags, text, replacement]);

  return state;
}
