import { formatDuration } from '@/lib/encoding';

export type Result<T> = { ok: true; value: T } | { ok: false; error: string };
export type Unit = 'seconds' | 'milliseconds' | 'microseconds' | 'nanoseconds' | 'date string';

export interface Parsed {
  ms: number;
  detected: Unit;
}

const MAX_MS = 8.64e15; // JS Date range

/** Parse a Unix timestamp (auto-detecting s/ms/µs/ns) or a date string. */
export function parseTimestamp(input: string): Result<Parsed> {
  const s = input.trim().replace(/[_,\s](?=\d)/g, '');
  if (!s) return { ok: false, error: 'Enter a timestamp or date.' };
  if (/^-?\d+(\.\d+)?$/.test(s)) {
    const n = Number(s);
    const abs = Math.abs(n);
    let ms: number;
    let detected: Unit;
    if (abs < 1e11) { ms = n * 1000; detected = 'seconds'; }
    else if (abs < 1e14) { ms = n; detected = 'milliseconds'; }
    else if (abs < 1e17) { ms = n / 1e3; detected = 'microseconds'; }
    else { ms = n / 1e6; detected = 'nanoseconds'; }
    if (Math.abs(ms) > MAX_MS) return { ok: false, error: 'That timestamp is outside the supported date range.' };
    return { ok: true, value: { ms: Math.round(ms * 1000) / 1000, detected } };
  }
  const t = Date.parse(s);
  if (Number.isNaN(t)) return { ok: false, error: 'Could not understand that date. Try ISO 8601 like 2026-11-21T14:30:00Z or a Unix timestamp.' };
  return { ok: true, value: { ms: t, detected: 'date string' } };
}

function parts(ms: number, timeZone: string) {
  const f = new Intl.DateTimeFormat('en-US', {
    timeZone, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
  const p = Object.fromEntries(f.formatToParts(new Date(ms)).map((x) => [x.type, x.value]));
  return p as Record<string, string>;
}

/** Offset of `timeZone` from UTC at instant `ms`, in minutes. */
export function tzOffsetMinutes(ms: number, timeZone: string): number {
  const p = parts(ms, timeZone);
  const asUtc = Date.UTC(+p.year!, +p.month! - 1, +p.day!, +p.hour! % 24, +p.minute!, +p.second!);
  return Math.round((asUtc - Math.floor(ms / 1000) * 1000) / 60000);
}

export function formatOffset(min: number): string {
  const sign = min < 0 ? '-' : '+';
  const a = Math.abs(min);
  return `${sign}${String(Math.floor(a / 60)).padStart(2, '0')}:${String(a % 60).padStart(2, '0')}`;
}

/** ISO 8601 with the zone's offset, e.g. 2026-11-21T09:30:00.000-05:00 */
export function isoInZone(ms: number, timeZone: string): string {
  const p = parts(ms, timeZone);
  const frac = String(((ms % 1000) + 1000) % 1000 | 0).padStart(3, '0');
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}.${frac}${formatOffset(tzOffsetMinutes(ms, timeZone))}`;
}

export function humanInZone(ms: number, timeZone: string, locale?: string): string {
  return new Intl.DateTimeFormat(locale, { timeZone, dateStyle: 'full', timeStyle: 'long' }).format(new Date(ms));
}

export function relative(ms: number, nowMs: number): string {
  const diff = (ms - nowMs) / 1000;
  if (Math.abs(diff) < 1) return 'now';
  return diff > 0 ? `in ${formatDuration(diff)}` : `${formatDuration(diff)} ago`;
}

export function isValidTimeZone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export function allTimeZones(): string[] {
  const intl = Intl as unknown as { supportedValuesOf?: (k: string) => string[] };
  return intl.supportedValuesOf?.('timeZone') ?? ['UTC', 'America/New_York', 'Europe/London', 'Asia/Kolkata', 'Asia/Tokyo'];
}
