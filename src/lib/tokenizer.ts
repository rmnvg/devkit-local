/** Client side of the tokenizer worker plus a debounced React hook. */
import { useEffect, useState } from 'react';
import { wrap, type Remote } from 'comlink';
import type { EncodingName, TokenizerApi } from '@/workers/tokenizer.worker';
import type { TokenizeResult } from '@/tools/token-counter/logic';
import { useDebounced } from './useDebounced';

export type { EncodingName };

let remote: Remote<TokenizerApi> | null = null;

function getRemote(): Remote<TokenizerApi> {
  if (!remote) {
    const worker = new Worker(new URL('../workers/tokenizer.worker.ts', import.meta.url), { type: 'module' });
    remote = wrap<TokenizerApi>(worker);
  }
  return remote;
}

export function chunkInWorker(...args: Parameters<TokenizerApi['chunk']>) {
  return getRemote().chunk(...args);
}

export function tokenizeInWorker(text: string, encoding: EncodingName, maxPieces = 0): Promise<TokenizeResult> {
  return getRemote().tokenize(text, encoding, maxPieces);
}

export type TokenState =
  | { status: 'idle' | 'loading'; result: TokenizeResult | null }
  | { status: 'done'; result: TokenizeResult }
  | { status: 'error'; result: null; error: string };

export function useTokenCount(text: string, encoding: EncodingName, maxPieces = 0): TokenState {
  const debounced = useDebounced(text, 200);
  const [state, setState] = useState<TokenState>({ status: 'idle', result: null });
  useEffect(() => {
    let cancelled = false;
    if (!debounced) {
      setState({ status: 'done', result: { count: 0, pieces: [], truncated: false } });
      return;
    }
    setState((s) => ({ status: 'loading', result: s.result }));
    tokenizeInWorker(debounced, encoding, maxPieces).then(
      (result) => !cancelled && setState({ status: 'done', result }),
      (e: unknown) => !cancelled && setState({ status: 'error', result: null, error: String(e) }),
    );
    return () => {
      cancelled = true;
    };
  }, [debounced, encoding, maxPieces]);
  return state;
}
