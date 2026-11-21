// @vitest-environment node
import { digest, encodeDigest, hashAll, matchHash } from './logic';

const enc = (s: string) => new TextEncoder().encode(s);

describe('hashes', () => {
  it('matches known vectors for "abc"', async () => {
    const h = await hashAll(enc('abc'), 'hex');
    expect(h.MD5).toBe('900150983cd24fb0d6963f7d28e17f72');
    expect(h['SHA-1']).toBe('a9993e364706816aba3e25717850c26c9cd0d89d');
    expect(h['SHA-256']).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
    expect(h['SHA-512'].startsWith('ddaf35a193617aba')).toBe(true);
  });
  it('empty input and encodings', async () => {
    expect(encodeDigest(await digest('MD5', enc('')), 'hex')).toBe('d41d8cd98f00b204e9800998ecf8427e');
    expect(encodeDigest(await digest('SHA-256', enc('')), 'base64')).toBe('47DEQpj8HBSa+/TImW+5JCeuQeRkm5NMpJWZG3hSuFU=');
    expect(encodeDigest(new Uint8Array([171]), 'HEX')).toBe('AB');
  });
  it('unicode is hashed as UTF-8', async () => {
    const fromText = encodeDigest(await digest('MD5', enc('é')), 'hex');
    expect(fromText).toBe(encodeDigest(await digest('MD5', new Uint8Array([0xc3, 0xa9])), 'hex'));
    expect(fromText).not.toBe(encodeDigest(await digest('MD5', new Uint8Array([0xe9])), 'hex'));
  });
  it('finds which algorithm matches an expected hash', async () => {
    const h = await hashAll(enc('abc'), 'hex');
    expect(matchHash(' A9993E364706816ABA3E25717850C26C9CD0D89D ', h)).toBe('SHA-1');
    expect(matchHash('deadbeef', h)).toBeNull();
  });
});
