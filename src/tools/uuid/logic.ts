/** UUID v4/v7 and ULID generation and inspection. Randomness comes from crypto.getRandomValues. */
const CROCKFORD = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

export type Rng = (n: number) => Uint8Array;
export const cryptoRng: Rng = (n) => crypto.getRandomValues(new Uint8Array(n));

function hex(b: Uint8Array): string {
  return Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
}
function format(h: string): string {
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

export function uuidV4(rng: Rng = cryptoRng): string {
  const b = rng(16);
  b[6] = (b[6]! & 0x0f) | 0x40;
  b[8] = (b[8]! & 0x3f) | 0x80;
  return format(hex(b));
}

/** RFC 9562 UUIDv7: 48-bit Unix ms timestamp + random. */
export function uuidV7(now = Date.now(), rng: Rng = cryptoRng): string {
  const b = rng(16);
  let t = now;
  for (let i = 5; i >= 0; i--) {
    b[i] = t % 256;
    t = Math.floor(t / 256);
  }
  b[6] = (b[6]! & 0x0f) | 0x70;
  b[8] = (b[8]! & 0x3f) | 0x80;
  return format(hex(b));
}

export function ulid(now = Date.now(), rng: Rng = cryptoRng): string {
  let t = now;
  let time = '';
  for (let i = 0; i < 10; i++) {
    time = CROCKFORD[t % 32]! + time;
    t = Math.floor(t / 32);
  }
  const r = rng(16);
  let rand = '';
  for (let i = 0; i < 16; i++) rand += CROCKFORD[r[i]! % 32];
  return time + rand;
}

export const NIL_UUID = '00000000-0000-0000-0000-000000000000';

export interface Inspection {
  kind: 'uuid' | 'ulid';
  version?: number;
  variant?: string;
  timestampMs?: number;
  normalized: string;
}

export type Result<T> = { ok: true; value: T } | { ok: false; error: string };

export function inspect(input: string): Result<Inspection> {
  const s = input.trim().replace(/^urn:uuid:/i, '').replace(/^\{|\}$/g, '');
  if (/^[0-9A-HJKMNP-TV-Z]{26}$/i.test(s)) {
    const up = s.toUpperCase();
    if (CROCKFORD.indexOf(up[0]!) > 7) return { ok: false, error: 'ULID timestamp overflows 48 bits (first character must be 0–7).' };
    let t = 0;
    for (const c of up.slice(0, 10)) t = t * 32 + CROCKFORD.indexOf(c);
    return { ok: true, value: { kind: 'ulid', timestampMs: t, normalized: up } };
  }
  const h = s.replace(/-/g, '').toLowerCase();
  if (!/^[0-9a-f]{32}$/.test(h)) return { ok: false, error: 'Not a UUID (32 hex digits) or ULID (26 Crockford base32 characters).' };
  const version = parseInt(h[12]!, 16);
  const v = parseInt(h[16]!, 16);
  const variant = v >> 3 === 0 ? 'NCS (reserved)' : v >> 2 === 2 ? 'RFC 9562' : v >> 1 === 6 ? 'Microsoft (reserved)' : 'future (reserved)';
  const value: Inspection = { kind: 'uuid', version, variant, normalized: format(h) };
  if (version === 7) value.timestampMs = parseInt(h.slice(0, 12), 16);
  if (version === 1) {
    const ts = BigInt('0x' + h.slice(13, 16) + h.slice(8, 12) + h.slice(0, 8));
    value.timestampMs = Number((ts - 122192928000000000n) / 10000n);
  }
  return { ok: true, value };
}
