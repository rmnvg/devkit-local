import { compactVerify, importJWK, importSPKI, importX509, type JWK } from 'jose';
import { base64UrlDecodeText, formatDuration } from '@/lib/encoding';

export type Result<T> = { ok: true; value: T } | { ok: false; error: string };

export interface TimeClaim {
  claim: 'exp' | 'iat' | 'nbf';
  seconds: number;
  iso: string;
  relative: string;
}

export interface DecodedJwt {
  header: Record<string, unknown>;
  payload: unknown;
  signature: string;
  parts: [string, string, string];
  times: TimeClaim[];
  warnings: string[];
  expired: boolean;
}

function parseJsonPart(part: string, name: string): Result<unknown> {
  let text: string;
  try {
    text = base64UrlDecodeText(part);
  } catch {
    return { ok: false, error: `The ${name} is not valid base64url.` };
  }
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch {
    return { ok: false, error: `The ${name} decodes to text that is not valid JSON.` };
  }
}

export function relativeTime(targetSec: number, nowSec: number): string {
  const diff = targetSec - nowSec;
  if (Math.abs(diff) < 1) return 'now';
  return diff > 0 ? `in ${formatDuration(diff)}` : `${formatDuration(diff)} ago`;
}

export function decodeJwt(token: string, nowMs = Date.now()): Result<DecodedJwt> {
  const t = token.trim().replace(/^Bearer\s+/i, '');
  if (!t) return { ok: false, error: 'Paste a JWT to decode.' };
  const parts = t.split('.');
  if (parts.length === 5) return { ok: false, error: 'This looks like an encrypted JWE (5 parts). Only signed JWTs (JWS) can be decoded without the key.' };
  if (parts.length !== 3) return { ok: false, error: `A JWT has 3 parts separated by dots; this has ${parts.length}.` };
  const [h, p, sig] = parts as [string, string, string];

  const header = parseJsonPart(h, 'header');
  if (!header.ok) return header;
  if (!header.value || typeof header.value !== 'object' || Array.isArray(header.value)) {
    return { ok: false, error: 'The header must be a JSON object.' };
  }
  const payload = parseJsonPart(p, 'payload');
  if (!payload.ok) return payload;

  const hdr = header.value as Record<string, unknown>;
  const warnings: string[] = [];
  const nowSec = nowMs / 1000;
  const times: TimeClaim[] = [];
  let expired = false;

  const alg = typeof hdr.alg === 'string' ? hdr.alg : undefined;
  if (!alg) warnings.push('Header has no "alg".');
  else if (alg.toLowerCase() === 'none') warnings.push('alg is "none": this token is unsigned and must never be trusted.');
  if (alg && alg.toLowerCase() !== 'none' && !sig) warnings.push('Signature is empty.');

  const claims = payload.value;
  if (claims && typeof claims === 'object' && !Array.isArray(claims)) {
    const c = claims as Record<string, unknown>;
    for (const claim of ['exp', 'iat', 'nbf'] as const) {
      const v = c[claim];
      if (v === undefined) continue;
      if (typeof v !== 'number' || !Number.isFinite(v)) {
        warnings.push(`"${claim}" should be a number of seconds since the epoch.`);
        continue;
      }
      const d = new Date(v * 1000);
      times.push({ claim, seconds: v, iso: isNaN(d.getTime()) ? 'invalid date' : d.toISOString(), relative: relativeTime(v, nowSec) });
      if (v > 1e11) warnings.push(`"${claim}" looks like milliseconds; JWT times are in seconds.`);
    }
    if (typeof c.exp === 'number') {
      if (c.exp < nowSec) {
        expired = true;
        warnings.push(`Token expired ${formatDuration(nowSec - c.exp)} ago.`);
      }
    } else if (c.exp === undefined) {
      warnings.push('No "exp" claim: this token never expires.');
    }
    if (typeof c.nbf === 'number' && c.nbf > nowSec) warnings.push(`Token is not valid yet (nbf is ${relativeTime(c.nbf, nowSec)}).`);
  } else {
    warnings.push('Payload is not a JSON object, so standard claims can’t be checked.');
  }

  return { ok: true, value: { header: hdr, payload: claims, signature: sig, parts: [h, p, sig], times, warnings, expired } };
}

export type KeyKind = 'secret' | 'jwk' | 'spki' | 'x509';

export function detectKeyKind(alg: string, key: string): KeyKind {
  const k = key.trim();
  if (k.startsWith('{')) return 'jwk';
  if (k.includes('BEGIN CERTIFICATE')) return 'x509';
  if (k.includes('BEGIN PUBLIC KEY')) return 'spki';
  if (/^HS/i.test(alg)) return 'secret';
  return 'spki';
}

/** Verify only the signature (expiry is reported separately by decodeJwt). */
export async function verifyJwt(token: string, key: string, secretIsBase64 = false): Promise<Result<true>> {
  const t = token.trim().replace(/^Bearer\s+/i, '');
  const decoded = decodeJwt(t);
  if (!decoded.ok) return decoded;
  const alg = decoded.value.header.alg;
  if (typeof alg !== 'string' || alg.toLowerCase() === 'none') return { ok: false, error: 'Cannot verify a token without a signing algorithm.' };
  if (!key.trim()) return { ok: false, error: /^HS/i.test(alg) ? 'Enter the shared secret.' : 'Enter a public key (PEM), certificate or JWK.' };
  try {
    const kind = detectKeyKind(alg, key);
    let k: CryptoKey | Uint8Array;
    if (kind === 'secret') {
      k = secretIsBase64 ? Uint8Array.from(atob(key.trim().replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0)) : new TextEncoder().encode(key);
    } else if (kind === 'jwk') {
      let jwk: JWK;
      try {
        jwk = JSON.parse(key) as JWK;
      } catch {
        return { ok: false, error: 'The JWK is not valid JSON.' };
      }
      if (Array.isArray((jwk as { keys?: unknown }).keys)) {
        const keys = (jwk as unknown as { keys: JWK[] }).keys;
        const kid = decoded.value.header.kid;
        const match = keys.find((x) => x.kid === kid) ?? keys[0];
        if (!match) return { ok: false, error: 'The JWK set is empty.' };
        jwk = match;
      }
      const imported = await importJWK(jwk, alg);
      k = imported as CryptoKey | Uint8Array;
    } else if (kind === 'x509') {
      k = await importX509(key.trim(), alg);
    } else {
      k = await importSPKI(key.trim(), alg);
    }
    await compactVerify(t, k, { algorithms: [alg] });
    return { ok: true, value: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (/signature verification failed/i.test(msg)) return { ok: false, error: 'Invalid signature: the key does not match this token.' };
    return { ok: false, error: `Could not verify: ${msg}` };
  }
}
