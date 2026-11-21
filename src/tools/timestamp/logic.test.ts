import { parseTimestamp, isoInZone, tzOffsetMinutes, formatOffset, relative, isValidTimeZone, humanInZone } from './logic';

describe('parseTimestamp', () => {
  const T = 1_795_000_000; // 2026-11-18T...Z
  it.each([
    [String(T), 'seconds', T * 1000],
    [String(T * 1000), 'milliseconds', T * 1000],
    [String(T * 1_000_000), 'microseconds', T * 1000],
    [String(BigInt(T) * 1_000_000_000n), 'nanoseconds', T * 1000],
    ['1795000000.5', 'seconds', T * 1000 + 500],
    ['1,795,000,000', 'seconds', T * 1000],
    ['0', 'seconds', 0],
    ['-86400', 'seconds', -86_400_000],
  ])('%s → %s', (input, unit, ms) => {
    expect(parseTimestamp(input)).toEqual({ ok: true, value: { ms, detected: unit } });
  });
  it('parses ISO strings', () => {
    expect(parseTimestamp('2026-11-21T10:00:00Z')).toEqual({ ok: true, value: { ms: Date.UTC(2026, 10, 21, 10), detected: 'date string' } });
    expect(parseTimestamp('2026-11-21T10:00:00+05:30').ok && (parseTimestamp('2026-11-21T10:00:00+05:30') as { value: { ms: number } }).value.ms).toBe(Date.UTC(2026, 10, 21, 4, 30));
  });
  it('rejects junk and out-of-range values', () => {
    expect(parseTimestamp('')).toMatchObject({ ok: false });
    expect(parseTimestamp('not a date')).toMatchObject({ ok: false, error: /ISO 8601/ });
    expect(parseTimestamp('9'.repeat(25))).toMatchObject({ ok: false, error: /range/ });
  });
});

describe('time zones', () => {
  const ms = Date.UTC(2026, 0, 15, 12, 0, 0, 250); // winter
  const summer = Date.UTC(2026, 6, 15, 12);
  it('offsets including DST and half-hour zones', () => {
    expect(tzOffsetMinutes(ms, 'UTC')).toBe(0);
    expect(tzOffsetMinutes(ms, 'America/New_York')).toBe(-300);
    expect(tzOffsetMinutes(summer, 'America/New_York')).toBe(-240);
    expect(tzOffsetMinutes(ms, 'Asia/Kolkata')).toBe(330);
  });
  it('ISO in zone', () => {
    expect(isoInZone(ms, 'UTC')).toBe('2026-01-15T12:00:00.250+00:00');
    expect(isoInZone(ms, 'Asia/Kolkata')).toBe('2026-01-15T17:30:00.250+05:30');
    expect(isoInZone(ms, 'America/New_York')).toBe('2026-01-15T07:00:00.250-05:00');
  });
  it('human format and validation', () => {
    expect(humanInZone(ms, 'UTC', 'en-US')).toMatch(/Thursday, January 15, 2026/);
    expect(isValidTimeZone('Europe/Paris')).toBe(true);
    expect(isValidTimeZone('Mars/Olympus')).toBe(false);
    expect(formatOffset(-90)).toBe('-01:30');
  });
  it('relative', () => {
    expect(relative(1000, 1000)).toBe('now');
    expect(relative(0, 90_000)).toBe('1m 30s ago');
    expect(relative(3_600_000, 0)).toBe('in 1h');
  });
});
