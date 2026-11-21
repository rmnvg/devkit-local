import { parseCurl, tokenize, toAxios, toFetch, toPython } from './logic';

const ok = (cmd: string) => {
  const r = parseCurl(cmd);
  if (!r.ok) throw new Error(r.error);
  return r.value;
};

describe('tokenize', () => {
  it('handles quotes, escapes and continuations', () => {
    expect(tokenize(`curl 'a b' "c \\"d\\"" e\\ f \\\n  $'x\\ny'`)).toEqual({ ok: true, value: ['curl', 'a b', 'c "d"', 'e f', 'x\ny'] });
    expect(tokenize(`curl 'open`)).toMatchObject({ ok: false });
  });
});

describe('parseCurl', () => {
  it('parses a JSON POST', () => {
    const r = ok(`curl -X POST https://api.example.com/v1/items -H 'Content-Type: application/json' -H "Authorization: Bearer tok" -d '{"name":"x","n":1}'`);
    expect(r).toMatchObject({ method: 'POST', url: 'https://api.example.com/v1/items', body: '{"name":"x","n":1}' });
    expect(r.headers).toEqual([['Content-Type', 'application/json'], ['Authorization', 'Bearer tok']]);
  });
  it('infers POST from data and adds form content type', () => {
    const r = ok('curl example.com/login -d user=ada -d pass=x');
    expect(r).toMatchObject({ method: 'POST', url: 'http://example.com/login', body: 'user=ada&pass=x' });
    expect(r.headers).toContainEqual(['Content-Type', 'application/x-www-form-urlencoded']);
  });
  it('-G moves data to the query string; --json sets headers; -u sets basic auth', () => {
    expect(ok('curl -G https://x.io/s -d q=1 --data-urlencode "t=a b"')).toMatchObject({ method: 'GET', url: 'https://x.io/s?q=1&t=a%20b', body: null });
    const j = ok(`curl --json '{"a":1}' https://x.io`);
    expect(j.headers).toEqual([['Content-Type', 'application/json'], ['Accept', 'application/json']]);
    expect(ok('curl -u ada:secret https://x.io').headers).toContainEqual(['Authorization', `Basic ${btoa('ada:secret')}`]);
  });
  it('supports attached values, multipart forms and flags', () => {
    const r = ok('curl -XPUT --url=https://x.io -F name=ada -F avatar=@me.png -kL -s');
    expect(r).toMatchObject({ method: 'PUT', url: 'https://x.io', form: [['name', 'ada'], ['avatar', '@me.png']], insecure: true, followRedirects: true });
    expect(r.warnings.join(' ')).toMatch(/uploads a file/);
    expect(ok('curl -sSLXDELETE https://x.io')).toMatchObject({ method: 'DELETE', followRedirects: true, warnings: [] });
  });
  it('errors', () => {
    expect(parseCurl('')).toMatchObject({ ok: false });
    expect(parseCurl('wget x')).toMatchObject({ ok: false, error: /start with "curl"/ });
    expect(parseCurl('curl -H')).toMatchObject({ ok: false, error: /needs a value/ });
    expect(parseCurl('curl -s')).toMatchObject({ ok: false, error: /No URL/ });
  });
});

describe('generators', () => {
  const r = ok(`curl https://api.example.com/v1/items -H 'Content-Type: application/json' -H 'Accept: application/json' -d '{"name":"x","tags":["a"],"ok":true,"n":null}'`);
  it('fetch', () => {
    const code = toFetch(r);
    expect(code).toContain('await fetch("https://api.example.com/v1/items", {');
    expect(code).toContain('method: "POST"');
    expect(code).toContain('body: JSON.stringify({');
    expect(code).toContain('await res.json()');
  });
  it('axios', () => {
    expect(toAxios(r)).toContain('data: {\n    "name": "x",');
  });
  it('python uses json= and Python literals', () => {
    const code = toPython(r);
    expect(code).toContain('response = requests.post(\n    "https://api.example.com/v1/items",\n    headers=headers,\n    json=payload,');
    expect(code).toContain('"ok": True');
    expect(code).toContain('"n": None');
    expect(code).not.toMatch(/Content-Type/);
  });
  it('python custom methods and auth', () => {
    const code = toPython(ok('curl -X PROPFIND -u a:b https://x.io -k'));
    expect(code).toContain('requests.request(\n    "PROPFIND",\n    "https://x.io",');
    expect(code).toContain('auth=("a", "b")');
    expect(code).toContain('verify=False');
  });
});
