import SparkMD5 from 'spark-md5';
import { bytesToBase64, bytesToHex } from '@/lib/encoding';

export const ALGORITHMS = ['MD5', 'SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'] as const;
export type Algorithm = (typeof ALGORITHMS)[number];

export async function digest(alg: Algorithm, data: Uint8Array): Promise<Uint8Array> {
  if (alg === 'MD5') {
    const s = new SparkMD5.ArrayBuffer();
    s.append(data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer);
    return hexToBytesUnsafe(s.end());
  }
  return new Uint8Array(await crypto.subtle.digest(alg, data as BufferSource));
}

function hexToBytesUnsafe(h: string): Uint8Array {
  return Uint8Array.from(h.match(/../g)!.map((x) => parseInt(x, 16)));
}

export type OutputEncoding = 'hex' | 'HEX' | 'base64';

export function encodeDigest(b: Uint8Array, enc: OutputEncoding): string {
  if (enc === 'base64') return bytesToBase64(b);
  const h = bytesToHex(b);
  return enc === 'HEX' ? h.toUpperCase() : h;
}

export async function hashAll(data: Uint8Array, enc: OutputEncoding): Promise<Record<Algorithm, string>> {
  const out = {} as Record<Algorithm, string>;
  for (const a of ALGORITHMS) out[a] = encodeDigest(await digest(a, data), enc);
  return out;
}

/** Constant-time-ish comparison of an expected hash against computed values (case/space-insensitive hex). */
export function matchHash(expected: string, hashes: Record<Algorithm, string>): Algorithm | null {
  const e = expected.trim().replace(/\s+/g, '');
  if (!e) return null;
  for (const a of ALGORITHMS) {
    const h = hashes[a];
    if (h.toLowerCase() === e.toLowerCase() || h === e) return a;
  }
  return null;
}
