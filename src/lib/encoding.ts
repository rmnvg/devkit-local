/** Small encoding helpers shared by tools. */
export function base64UrlToBytes(input: string): Uint8Array {
  let s = input.replace(/-/g, '+').replace(/_/g, '/').replace(/\s/g, '');
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(s)) throw new Error('Invalid base64url characters');
  s = s.replace(/=+$/, '');
  if (s.length % 4 === 1) throw new Error('Invalid base64url length');
  s += '='.repeat((4 - (s.length % 4)) % 4);
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export function base64UrlDecodeText(input: string): string {
  return new TextDecoder('utf-8', { fatal: true }).decode(base64UrlToBytes(input));
}

export function bytesToBase64Url(bytes: Uint8Array): string {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** "3d 4h", "5m 2s" style duration. */
export function formatDuration(totalSeconds: number): string {
  let s = Math.floor(Math.abs(totalSeconds));
  const units: [string, number][] = [['y', 31536000], ['d', 86400], ['h', 3600], ['m', 60], ['s', 1]];
  const parts: string[] = [];
  for (const [u, size] of units) {
    if (s >= size) {
      parts.push(`${Math.floor(s / size)}${u}`);
      s %= size;
    }
    if (parts.length === 2) break;
  }
  return parts.length ? parts.join(' ') : '0s';
}
