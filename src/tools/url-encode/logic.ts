export type Mode = 'component' | 'uri' | 'form';
export type Result<T> = { ok: true; value: T } | { ok: false; error: string };

export function encode(text: string, mode: Mode): Result<string> {
  try {
    if (mode === 'uri') return { ok: true, value: encodeURI(text) };
    const c = encodeURIComponent(text);
    return { ok: true, value: mode === 'form' ? c.replace(/%20/g, '+') : c };
  } catch {
    return { ok: false, error: 'The text contains an unpaired surrogate (a broken emoji or character) and cannot be encoded.' };
  }
}

export function decode(text: string, mode: Mode): Result<string> {
  const s = mode === 'form' ? text.replace(/\+/g, ' ') : text;
  try {
    return { ok: true, value: mode === 'uri' ? decodeURI(s) : decodeURIComponent(s) };
  } catch {
    const bad = /%(?![0-9a-fA-F]{2})/.exec(s);
    return { ok: false, error: bad ? `Malformed escape "%" at position ${bad.index + 1}: it must be followed by two hex digits.` : 'Malformed percent-encoding: the bytes are not valid UTF-8.' };
  }
}

/** Decode repeatedly until stable (handles double-encoded strings). */
export function decodeFully(text: string, mode: Mode, max = 5): Result<{ value: string; rounds: number }> {
  let cur = text;
  for (let i = 0; i < max; i++) {
    const r = decode(cur, mode);
    if (!r.ok) return i === 0 ? r : { ok: true, value: { value: cur, rounds: i } };
    if (r.value === cur) return { ok: true, value: { value: cur, rounds: i } };
    cur = r.value;
  }
  return { ok: true, value: { value: cur, rounds: max } };
}
