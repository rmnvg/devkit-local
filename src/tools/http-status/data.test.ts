import { STATUSES, searchStatuses } from './data';

describe('http status data', () => {
  it('codes are unique, sorted and valid', () => {
    const codes = STATUSES.map((s) => s.code);
    expect(new Set(codes).size).toBe(codes.length);
    expect([...codes].sort((a, b) => a - b)).toEqual(codes);
    expect(codes.every((c) => c >= 100 && c < 600)).toBe(true);
  });
  it('searches by code prefix, class and text', () => {
    expect(searchStatuses('404').map((s) => s.name)).toEqual(['Not Found']);
    expect(searchStatuses('5xx').every((s) => s.code >= 500)).toBe(true);
    expect(searchStatuses('rate limit').map((s) => s.code)).toEqual([429]);
    expect(searchStatuses('41').map((s) => s.code)).toEqual([410, 411, 412, 413, 414, 415, 416, 417, 418]);
    expect(searchStatuses('').length).toBe(STATUSES.length);
    expect(searchStatuses('zzzz')).toEqual([]);
  });
});
