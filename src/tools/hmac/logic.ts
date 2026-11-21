import { base64UrlToBytes, bytesToBase64, bytesToHex, hexToBytes } from '@/lib/encoding';

export type HmacAlg = 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512';
export type KeyEncoding = 'utf8' | 'hex' | 'base64';
export type Result<T> = { ok: true; value: T } | { ok: false; error: string };

export function keyBytes(key: string, enc: KeyEncoding): Result<Uint8Array> {
  try {
    if (enc === 'hex') return { ok: true, value: hexToBytes(key) };
    if (enc === 'base64') return { ok: true, value: base64UrlToBytes(key.trim()) };
    return { ok: true, value: new TextEncoder().encode(key) };
  } catch (e) {
    return { ok: false, error: enc === 'hex' ? (e as Error).message : 'Invalid base64 key.' };
  }
}

export async function hmac(alg: HmacAlg, key: Uint8Array, message: Uint8Array): Promise<Uint8Array> {
  if (!key.length) throw new Error('empty key');
  const k = await crypto.subtle.importKey('raw', key as BufferSource, { name: 'HMAC', hash: alg }, false, ['sign']);
  return new Uint8Array(await crypto.subtle.sign('HMAC', k, message as BufferSource));
}

export interface HmacOut {
  hex: string;
  base64: string;
  base64url: string;
}

export async function computeHmac(alg: HmacAlg, key: string, keyEnc: KeyEncoding, message: string): Promise<Result<HmacOut>> {
  const kb = keyBytes(key, keyEnc);
  if (!kb.ok) return kb;
  if (!kb.value.length) return { ok: false, error: 'Enter a secret key.' };
  const sig = await hmac(alg, kb.value, new TextEncoder().encode(message));
  const b64 = bytesToBase64(sig);
  return { ok: true, value: { hex: bytesToHex(sig), base64: b64, base64url: b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '') } };
}

/** Compare an expected signature (any of the three encodings, optional "sha256=" prefix). */
export function verify(expected: string, out: HmacOut): boolean {
  const e = expected.trim().replace(/^sha(1|256|384|512)=/i, '');
  if (!e) return false;
  const candidates = [out.hex, out.base64, out.base64url];
  return candidates.some((c) => timingSafeEqual(c, /^[0-9a-f]+$/i.test(e) ? e.toLowerCase() : e));
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
