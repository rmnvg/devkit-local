import { parseVector, similarity, describeCosine } from './logic';

describe('parseVector', () => {
  it('accepts JSON arrays, plain lists and API shapes', () => {
    expect(parseVector('[1, 2.5, -3e-2]')).toEqual({ ok: true, value: [1, 2.5, -0.03] });
    expect(parseVector('1 2\n3,4;5')).toEqual({ ok: true, value: [1, 2, 3, 4, 5] });
    expect(parseVector('{"data":[{"embedding":[0.1,0.2]}]}')).toEqual({ ok: true, value: [0.1, 0.2] });
    expect(parseVector('{"embedding":[1]}')).toEqual({ ok: true, value: [1] });
    expect(parseVector('[1, 2, 3,]')).toEqual({ ok: true, value: [1, 2, 3] });
  });
  it('rejects bad input', () => {
    expect(parseVector('')).toMatchObject({ ok: false, error: /empty/ });
    expect(parseVector('1, two, 3')).toMatchObject({ ok: false, error: /"two" \(item 2\)/ });
    expect(parseVector('[1, "x"]')).toMatchObject({ ok: false, error: /item 2/ });
    expect(parseVector('[[1],[2]]')).toMatchObject({ ok: false, error: /nested/ });
    expect(parseVector('{"a":1}')).toMatchObject({ ok: false });
  });
});

describe('similarity', () => {
  it('computes cosine, dot, norms', () => {
    const r = similarity([1, 0], [1, 1]);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.cosine).toBeCloseTo(Math.SQRT1_2);
    expect(r.value.angleDeg).toBeCloseTo(45);
    expect(r.value.dot).toBe(1);
    expect(r.value.normB).toBeCloseTo(Math.SQRT2);
    expect(r.value.euclidean).toBe(1);
    expect(r.value.normalized).toBe(false);
  });
  it('identical, opposite and zero vectors', () => {
    expect(similarity([0.6, 0.8], [0.6, 0.8]).ok && (similarity([0.6, 0.8], [0.6, 0.8]) as { value: { cosine: number; normalized: boolean } }).value).toMatchObject({ cosine: 1, normalized: true });
    expect((similarity([1, 2], [-1, -2]) as { value: { cosine: number } }).value.cosine).toBeCloseTo(-1);
    expect((similarity([0, 0], [1, 2]) as { value: { cosine: null } }).value.cosine).toBeNull();
  });
  it('rejects mismatched dimensions', () => {
    expect(similarity([1, 2], [1])).toMatchObject({ ok: false, error: /A has 2 values, vector B has 1/ });
  });
  it('describes scores', () => {
    expect(describeCosine(0.95)).toBe('very similar');
    expect(describeCosine(-0.2)).toBe('opposite direction');
  });
});
