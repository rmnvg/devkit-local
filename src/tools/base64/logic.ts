import { base64UrlToBytes, bytesToBase64, bytesToHex } from '@/lib/encoding';

export type Result<T> = { ok: true; value: T } | { ok: false; error: string };

export function encodeText(text: string, urlSafe: boolean, lineWrap = 0): string {
  let b = bytesToBase64(new TextEncoder().encode(text));
  if (urlSafe) b = b.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  if (lineWrap > 0) b = b.match(new RegExp(`.{1,${lineWrap}}`, 'g'))?.join('\n') ?? b;
  return b;
}

export interface Decoded {
  bytes: Uint8Array;
  /** UTF-8 text, or null if the bytes are not valid UTF-8 */
  text: string | null;
  mediaType: string | null;
}

/** Decode standard or URL-safe base64, with or without padding, whitespace or a data: URI prefix. */
export function decode(input: string): Result<Decoded> {
  let s = input.trim();
  if (!s) return { ok: false, error: 'Nothing to decode.' };
  let mediaType: string | null = null;
  const m = /^data:([^;,]*)(;[^,]*)?,/.exec(s);
  if (m) {
    if (!m[2]?.includes('base64')) return { ok: false, error: 'This data URI is not base64-encoded.' };
    mediaType = m[1] || null;
    s = s.slice(m[0].length);
  }
  let bytes: Uint8Array;
  try {
    bytes = base64UrlToBytes(s.replace(/\s+/g, ''));
  } catch {
    const bad = /[^A-Za-z0-9+/=_\-\s]/.exec(s);
    return { ok: false, error: bad ? `Invalid character "${bad[0]}" at position ${bad.index + 1}.` : 'Invalid base64 length or padding.' };
  }
  let text: string | null;
  try {
    text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    text = null;
  }
  return { ok: true, value: { bytes, text, mediaType: mediaType ?? sniffMediaType(bytes) } };
}

const SIGNATURES: [number[], string][] = [
  [[0x89, 0x50, 0x4e, 0x47], 'image/png'],
  [[0xff, 0xd8, 0xff], 'image/jpeg'],
  [[0x47, 0x49, 0x46, 0x38], 'image/gif'],
  [[0x25, 0x50, 0x44, 0x46], 'application/pdf'],
  [[0x50, 0x4b, 0x03, 0x04], 'application/zip'],
  [[0x1f, 0x8b], 'application/gzip'],
];

export function sniffMediaType(b: Uint8Array): string | null {
  for (const [sig, type] of SIGNATURES) if (sig.every((x, i) => b[i] === x)) return type;
  if (b.length > 11 && String.fromCharCode(...b.subarray(0, 4)) === 'RIFF' && String.fromCharCode(...b.subarray(8, 12)) === 'WEBP') return 'image/webp';
  return null;
}

export function hexPreview(b: Uint8Array, max = 256): string {
  const hex = bytesToHex(b.subarray(0, max)).match(/.{1,32}/g) ?? [];
  return hex.map((l) => l.match(/../g)!.join(' ')).join('\n') + (b.length > max ? `\n… ${b.length - max} more bytes` : '');
}

export function toDataUri(bytes: Uint8Array, mediaType: string): string {
  return `data:${mediaType || 'application/octet-stream'};base64,${bytesToBase64(bytes)}`;
}
