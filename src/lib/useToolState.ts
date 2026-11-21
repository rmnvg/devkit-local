/**
 * Tool state hook. Initial state comes from (in order): the share-link hash, remembered
 * inputs (opt-in), saved per-tool settings, then defaults.
 *
 * Keys listed in `inputKeys` are user input; everything else is a setting. Settings are
 * always saved; inputs only when "Remember inputs" is on.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { decodeState, encodeState, pickShareable } from './urlState';

export type ShareResult = { ok: true; url: string } | { ok: false; error: string };
import { getToolInput, getToolSettings, setToolInput, setToolSettings } from './storage';

function split<S extends Record<string, unknown>>(state: S, inputKeys: readonly (keyof S)[]) {
  const inputs: Partial<S> = {};
  const settings: Partial<S> = {};
  for (const k of Object.keys(state) as (keyof S)[]) {
    if (inputKeys.includes(k)) inputs[k] = state[k];
    else settings[k] = state[k];
  }
  return { inputs, settings };
}

/** Keep only keys that exist in defaults and have the same primitive type. */
function sanitize<S extends Record<string, unknown>>(defaults: S, value: unknown): Partial<S> {
  if (!value || typeof value !== 'object') return {};
  const out: Partial<S> = {};
  for (const k of Object.keys(defaults) as (keyof S)[]) {
    const v = (value as Record<string, unknown>)[k as string];
    if (v !== undefined && typeof v === typeof defaults[k]) out[k] = v as S[keyof S];
  }
  return out;
}

export interface ToolStateApi {
  shareLink: (includeInputs: boolean) => ShareResult;
  hasInputKeys: boolean;
  /** true when the initial state came from a share link */
  fromLink: boolean;
}

export function useToolState<S extends Record<string, unknown>>(
  slug: string,
  defaults: S,
  inputKeys: readonly (keyof S)[],
): [S, (patch: Partial<S> | ((s: S) => Partial<S>)) => void, ToolStateApi] {
  const fromLink = useRef(false);
  const [state, setFull] = useState<S>(() => {
    let linked: Partial<S> = {};
    if (typeof window !== 'undefined' && window.location.hash.includes('s=')) {
      const d = decodeState(window.location.hash);
      if (d.ok) {
        linked = sanitize(defaults, d.value);
        fromLink.current = true;
      }
    }
    return {
      ...defaults,
      ...sanitize(defaults, getToolSettings(slug)),
      ...sanitize(defaults, getToolInput(slug)),
      ...linked,
    };
  });

  // Drop the hash after reading it so later edits don't look "shared".
  useEffect(() => {
    if (fromLink.current && window.location.hash) {
      history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  }, []);

  useEffect(() => {
    const { inputs, settings } = split(state, inputKeys);
    setToolSettings(slug, settings);
    setToolInput(slug, inputs);
    // inputKeys is a static list per tool
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, state]);

  const setState = useCallback((patch: Partial<S> | ((s: S) => Partial<S>)) => {
    setFull((s) => ({ ...s, ...(typeof patch === 'function' ? patch(s) : patch) }));
  }, []);

  const stateRef = useRef(state);
  stateRef.current = state;

  const shareLink = useCallback(
    (includeInputs: boolean): ShareResult => {
      const enc = encodeState(pickShareable(stateRef.current, inputKeys, includeInputs));
      if (!enc.ok) return enc;
      return { ok: true, url: window.location.origin + window.location.pathname + enc.hash };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return [state, setState, { shareLink, hasInputKeys: inputKeys.length > 0, fromLink: fromLink.current }];
}
