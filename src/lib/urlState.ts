/**
 * Encode tool state into the URL *hash* (`#s=...`). The hash is never sent to servers, so
 * shared state doesn't end up in request logs.
 *
 * Format: `#s=<lz-string compressToEncodedURIComponent(JSON)>`. lz output is URL-safe.
 */
import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';

export const MAX_HASH_BYTES = 8 * 1024;

export type EncodeResult = { ok: true; hash: string } | { ok: false; error: string };
export type DecodeResult<T> = { ok: true; value: T } | { ok: false; error: string };

export function encodeState(state: unknown): EncodeResult {
  let json: string;
  try {
    json = JSON.stringify(state);
  } catch {
    return { ok: false, error: 'State could not be serialized.' };
  }
  if (json === undefined) return { ok: false, error: 'Nothing to share.' };
  const hash = '#s=' + compressToEncodedURIComponent(json);
  if (hash.length > MAX_HASH_BYTES) {
    return {
      ok: false,
      error: `Too large to share as a link (${(hash.length / 1024).toFixed(1)} KB, limit 8 KB).`,
    };
  }
  return { ok: true, hash };
}

export function decodeState<T = unknown>(hash: string): DecodeResult<T> {
  const m = /(?:^#|&)s=([^&]*)/.exec(hash.startsWith('#') ? hash : '#' + hash);
  if (!m || !m[1]) return { ok: false, error: 'No shared state in this link.' };
  try {
    const json = decompressFromEncodedURIComponent(m[1]);
    if (!json) return { ok: false, error: 'The shared link is corrupted.' };
    return { ok: true, value: JSON.parse(json) as T };
  } catch {
    return { ok: false, error: 'The shared link is corrupted.' };
  }
}

/** Pick the keys to include in a share link. */
export function pickShareable<S extends Record<string, unknown>>(
  state: S,
  inputKeys: readonly (keyof S)[],
  includeInputs: boolean,
): Partial<S> {
  if (includeInputs) return { ...state };
  const out: Partial<S> = {};
  for (const k of Object.keys(state) as (keyof S)[]) {
    if (!inputKeys.includes(k)) out[k] = state[k];
  }
  return out;
}
