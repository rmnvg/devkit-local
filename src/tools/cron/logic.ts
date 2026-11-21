import cronstrue from 'cronstrue';
import { CronExpressionParser } from 'cron-parser';

export type Result<T> = { ok: true; value: T } | { ok: false; error: string };

const ALIASES: Record<string, string> = {
  '@yearly': '0 0 1 1 *', '@annually': '0 0 1 1 *', '@monthly': '0 0 1 * *', '@weekly': '0 0 * * 0',
  '@daily': '0 0 * * *', '@midnight': '0 0 * * *', '@hourly': '0 * * * *',
};

export interface CronInfo {
  expression: string;
  description: string;
  fields: { name: string; value: string }[];
  next: Date[];
}

const FIELD_NAMES_5 = ['Minute', 'Hour', 'Day of month', 'Month', 'Day of week'];
const FIELD_NAMES_6 = ['Second', ...FIELD_NAMES_5];

export function explainCron(input: string, opts: { count: number; tz?: string; from?: Date; use24h?: boolean }): Result<CronInfo> {
  const raw = input.trim().replace(/\s+/g, ' ');
  if (!raw) return { ok: false, error: 'Enter a cron expression, e.g. "*/15 * * * *".' };
  if (raw === '@reboot') return { ok: false, error: '@reboot runs once at startup; it has no schedule.' };
  const expr = ALIASES[raw.toLowerCase()] ?? raw;
  const parts = expr.split(' ');
  if (parts.length < 5 || parts.length > 6) return { ok: false, error: `Expected 5 fields (minute hour day month weekday) or 6 with seconds; got ${parts.length}.` };
  let description: string;
  try {
    description = cronstrue.toString(expr, { use24HourTimeFormat: opts.use24h ?? true, verbose: false, throwExceptionOnParseError: true });
  } catch (e) {
    return { ok: false, error: String(e instanceof Error ? e.message : e).replace(/^Error: /, '') };
  }
  let next: Date[];
  try {
    const it = CronExpressionParser.parse(expr, { currentDate: opts.from ?? new Date(), tz: opts.tz, strict: false });
    next = it.take(Math.max(1, Math.min(50, opts.count))).map((d) => d.toDate());
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
  const names = parts.length === 6 ? FIELD_NAMES_6 : FIELD_NAMES_5;
  return { ok: true, value: { expression: expr, description, fields: parts.map((value, i) => ({ name: names[i]!, value })), next } };
}

export const PRESETS: [string, string][] = [
  ['* * * * *', 'Every minute'],
  ['*/5 * * * *', 'Every 5 minutes'],
  ['0 * * * *', 'Hourly'],
  ['0 9 * * 1-5', 'Weekdays at 9:00'],
  ['30 2 * * 0', 'Sundays at 2:30'],
  ['0 0 1 * *', 'Monthly'],
  ['0 0 * * *', 'Daily at midnight'],
  ['0 */6 * * *', 'Every 6 hours'],
];
