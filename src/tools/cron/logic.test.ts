import { explainCron } from './logic';

const from = new Date('2026-11-21T10:07:30Z');

describe('cron', () => {
  it('describes and lists next runs (UTC)', () => {
    const r = explainCron('*/15 9-17 * * 1-5', { count: 3, tz: 'UTC', from });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.description).toBe('Every 15 minutes, between 09:00 and 17:59, Monday through Friday');
    // 2026-11-21 is a Saturday → next run is Monday 09:00
    expect(r.value.next.map((d) => d.toISOString())).toEqual(['2026-11-23T09:00:00.000Z', '2026-11-23T09:15:00.000Z', '2026-11-23T09:30:00.000Z']);
    expect(r.value.fields.map((f) => f.name)).toEqual(['Minute', 'Hour', 'Day of month', 'Month', 'Day of week']);
  });
  it('supports aliases, seconds and time zones', () => {
    const d = explainCron('@daily', { count: 1, tz: 'UTC', from });
    expect(d.ok && d.value.next[0]!.toISOString()).toBe('2026-11-22T00:00:00.000Z');
    const s = explainCron('*/10 * * * * *', { count: 2, tz: 'UTC', from });
    expect(s.ok && s.value.next.map((x) => x.toISOString())).toEqual(['2026-11-21T10:07:40.000Z', '2026-11-21T10:07:50.000Z']);
    const k = explainCron('0 9 * * *', { count: 1, tz: 'Asia/Kolkata', from });
    expect(k.ok && k.value.next[0]!.toISOString()).toBe('2026-11-22T03:30:00.000Z');
  });
  it('rejects bad expressions', () => {
    expect(explainCron('', { count: 1 })).toMatchObject({ ok: false });
    expect(explainCron('* * *', { count: 1 })).toMatchObject({ ok: false, error: /Expected 5 fields/ });
    expect(explainCron('61 * * * *', { count: 1 })).toMatchObject({ ok: false });
    expect(explainCron('@reboot', { count: 1 })).toMatchObject({ ok: false, error: /startup/ });
  });
});
