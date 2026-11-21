import { decode, encodeText, hexPreview, sniffMediaType, toDataUri } from './logic';

describe('base64', () => {
  it('encodes UTF-8 text, standard and URL-safe', () => {
    expect(encodeText('héllo 🌍', false)).toBe('aMOpbGxvIPCfjI0=');
    expect(encodeText('??>', false)).toBe('Pz8+');
    expect(encodeText('??>', true)).toBe('Pz8-');
    expect(encodeText('a'.repeat(60), false, 76).split('\n')).toHaveLength(2);
  });
  it('decodes both alphabets, missing padding, whitespace and data URIs', () => {
    expect(decode('aMOpbGxvIPCfjI0=')).toMatchObject({ ok: true, value: { text: 'héllo 🌍' } });
    expect(decode('Pz8-')).toMatchObject({ ok: true, value: { text: '??>' } });
    expect(decode('aGk')).toMatchObject({ ok: true, value: { text: 'hi' } });
    expect(decode(' aG\nk= ')).toMatchObject({ ok: true, value: { text: 'hi' } });
    expect(decode('data:text/plain;base64,aGk=')).toMatchObject({ ok: true, value: { text: 'hi', mediaType: 'text/plain' } });
  });
  it('detects binary data', () => {
    const r = decode('iVBORw0KGgo=');
    expect(r.ok && r.value.text).toBeNull();
    expect(r.ok && r.value.mediaType).toBe('image/png');
    expect(sniffMediaType(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))).toBe('image/jpeg');
  });
  it('reports errors', () => {
    expect(decode('')).toMatchObject({ ok: false });
    expect(decode('ab$c')).toMatchObject({ ok: false, error: 'Invalid character "$" at position 3.' });
    expect(decode('a')).toMatchObject({ ok: false, error: /length/ });
    expect(decode('data:text/plain,hello')).toMatchObject({ ok: false, error: /not base64/ });
  });
  it('helpers', () => {
    expect(hexPreview(new Uint8Array([1, 255]))).toBe('01 ff');
    expect(toDataUri(new Uint8Array([104, 105]), 'text/plain')).toBe('data:text/plain;base64,aGk=');
  });
});
