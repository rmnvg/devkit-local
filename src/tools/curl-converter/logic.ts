/** Parse a curl command and generate fetch / axios / Python requests code. */
export type Result<T> = { ok: true; value: T } | { ok: false; error: string };

export interface Request {
  method: string;
  url: string;
  headers: [string, string][];
  /** raw body (string) or multipart fields */
  body: string | null;
  form: [string, string][] | null;
  auth: { user: string; pass: string } | null;
  insecure: boolean;
  followRedirects: boolean;
  warnings: string[];
}

/** Shell-like tokenizer: quotes, $'…' ANSI-C quotes, backslash escapes and line continuations. */
export function tokenize(cmd: string): Result<string[]> {
  const s = cmd.replace(/\\\r?\n/g, ' ').replace(/\^\r?\n/g, ' ');
  const out: string[] = [];
  let cur = '';
  let has = false;
  let i = 0;
  while (i < s.length) {
    const c = s[i]!;
    if (/\s/.test(c)) {
      if (has) out.push(cur);
      cur = '';
      has = false;
      i++;
    } else if (c === "'") {
      const end = s.indexOf("'", i + 1);
      if (end < 0) return { ok: false, error: 'Unclosed single quote.' };
      cur += s.slice(i + 1, end);
      has = true;
      i = end + 1;
    } else if (c === '$' && s[i + 1] === "'") {
      i += 2;
      while (i < s.length && s[i] !== "'") {
        if (s[i] === '\\') {
          const n = s[i + 1]!;
          cur += ({ n: '\n', t: '\t', r: '\r', "'": "'", '\\': '\\', '"': '"' } as Record<string, string>)[n] ?? n;
          i += 2;
        } else cur += s[i++];
      }
      if (i >= s.length) return { ok: false, error: "Unclosed $'…' quote." };
      has = true;
      i++;
    } else if (c === '"') {
      i++;
      while (i < s.length && s[i] !== '"') {
        if (s[i] === '\\' && '"\\$`'.includes(s[i + 1]!)) { cur += s[i + 1]; i += 2; }
        else cur += s[i++];
      }
      if (i >= s.length) return { ok: false, error: 'Unclosed double quote.' };
      has = true;
      i++;
    } else if (c === '\\') {
      cur += s[i + 1] ?? '';
      has = true;
      i += 2;
    } else {
      cur += c;
      has = true;
      i++;
    }
  }
  if (has) out.push(cur);
  return { ok: true, value: out };
}

const VALUE_FLAGS = new Set(['-X', '--request', '-H', '--header', '-d', '--data', '--data-raw', '--data-binary', '--data-ascii', '--data-urlencode', '--json', '-F', '--form', '--form-string', '-u', '--user', '-b', '--cookie', '-A', '--user-agent', '-e', '--referer', '--url', '-o', '--output', '-m', '--max-time', '--connect-timeout', '-x', '--proxy', '-w', '--write-out', '--retry', '-c', '--cookie-jar', '--cacert', '--cert', '--key', '-T', '--upload-file']);
const IGNORED = new Set(['-s', '--silent', '-S', '--show-error', '-v', '--verbose', '--compressed', '-i', '--include', '-#', '--progress-bar', '-f', '--fail', '--http1.1', '--http2', '-N', '--no-buffer']);

export function parseCurl(cmd: string): Result<Request> {
  const t = tokenize(cmd.trim());
  if (!t.ok) return t;
  // expand bundled boolean short flags: -sSL → -s -S -L (a value flag may come last: -sXPOST)
  const args = t.value.flatMap((a) => {
    if (!/^-[A-Za-z#]{2,}/.test(a) || VALUE_FLAGS.has(a.slice(0, 2))) return [a];
    const out: string[] = [];
    for (let k = 1; k < a.length; k++) {
      const f = '-' + a[k];
      if (VALUE_FLAGS.has(f)) { out.push(f + a.slice(k + 1)); break; }
      out.push(f);
    }
    return out;
  });
  if (!args.length) return { ok: false, error: 'Paste a curl command.' };
  if (args[0] !== 'curl') return { ok: false, error: 'The command must start with "curl".' };
  const req: Request = { method: '', url: '', headers: [], body: null, form: null, auth: null, insecure: false, followRedirects: false, warnings: [] };
  const data: string[] = [];
  let get = false;
  let head = false;
  for (let i = 1; i < args.length; i++) {
    let a = args[i]!;
    let val: string | undefined;
    const eq = a.startsWith('--') ? a.indexOf('=') : -1;
    if (eq > 0 && VALUE_FLAGS.has(a.slice(0, eq))) { val = a.slice(eq + 1); a = a.slice(0, eq); }
    else if (/^-[A-Za-z]./.test(a) && VALUE_FLAGS.has(a.slice(0, 2))) { val = a.slice(2); a = a.slice(0, 2); }
    if (VALUE_FLAGS.has(a) && val === undefined) {
      val = args[++i];
      if (val === undefined) return { ok: false, error: `${a} needs a value.` };
    }
    switch (a) {
      case '-X': case '--request': req.method = val!.toUpperCase(); break;
      case '-H': case '--header': {
        const idx = val!.indexOf(':');
        if (idx > 0) req.headers.push([val!.slice(0, idx).trim(), val!.slice(idx + 1).trim()]);
        break;
      }
      case '-d': case '--data': case '--data-ascii': case '--data-binary':
        if (val!.startsWith('@')) req.warnings.push(`Body is read from file "${val!.slice(1)}"; replace the placeholder with the file contents.`);
        data.push(a === '--data-binary' ? val! : val!.replace(/[\r\n]/g, ''));
        break;
      case '--data-raw': data.push(val!); break;
      case '--data-urlencode': {
        const e = val!.indexOf('=');
        data.push(e >= 0 ? `${val!.slice(0, e)}=${encodeURIComponent(val!.slice(e + 1))}` : encodeURIComponent(val!));
        break;
      }
      case '--json':
        data.push(val!);
        if (!req.headers.some(([k]) => k.toLowerCase() === 'content-type')) req.headers.push(['Content-Type', 'application/json']);
        if (!req.headers.some(([k]) => k.toLowerCase() === 'accept')) req.headers.push(['Accept', 'application/json']);
        break;
      case '-F': case '--form': case '--form-string': {
        const e = val!.indexOf('=');
        (req.form ??= []).push([val!.slice(0, e), val!.slice(e + 1)]);
        if (val!.slice(e + 1).startsWith('@')) req.warnings.push(`Form field "${val!.slice(0, e)}" uploads a file; the generated code uses a placeholder.`);
        break;
      }
      case '-u': case '--user': {
        const c = val!.indexOf(':');
        req.auth = c >= 0 ? { user: val!.slice(0, c), pass: val!.slice(c + 1) } : { user: val!, pass: '' };
        break;
      }
      case '-b': case '--cookie': req.headers.push(['Cookie', val!]); break;
      case '-A': case '--user-agent': req.headers.push(['User-Agent', val!]); break;
      case '-e': case '--referer': req.headers.push(['Referer', val!]); break;
      case '--url': req.url = val!; break;
      case '-G': case '--get': get = true; break;
      case '-I': case '--head': head = true; break;
      case '-k': case '--insecure': req.insecure = true; break;
      case '-L': case '--location': req.followRedirects = true; break;
      default:
        if (VALUE_FLAGS.has(a)) req.warnings.push(`Option ${a} is not translated.`);
        else if (IGNORED.has(a)) break;
        else if (a.startsWith('-')) req.warnings.push(`Unknown option ${a} ignored.`);
        else if (!req.url) req.url = a;
        else req.warnings.push(`Extra argument "${a}" ignored.`);
    }
  }
  if (!req.url) return { ok: false, error: 'No URL found in the command.' };
  if (!/^[a-z]+:\/\//i.test(req.url)) req.url = 'http://' + req.url;
  if (data.length) {
    if (get) req.url += (req.url.includes('?') ? '&' : '?') + data.join('&');
    else {
      req.body = data.join('&');
      if (!req.headers.some(([k]) => k.toLowerCase() === 'content-type')) req.headers.push(['Content-Type', 'application/x-www-form-urlencoded']);
    }
  }
  req.method ||= head ? 'HEAD' : req.body !== null || req.form ? 'POST' : 'GET';
  if (req.auth) req.headers.push(['Authorization', `Basic ${btoa(`${req.auth.user}:${req.auth.pass}`)}`]);
  return { ok: true, value: req };
}

const q = (s: string) => JSON.stringify(s);
const isJson = (r: Request) => r.headers.some(([k, v]) => k.toLowerCase() === 'content-type' && v.includes('json'));
function jsonBody(r: Request): unknown | undefined {
  if (!r.body || !isJson(r)) return undefined;
  try { return JSON.parse(r.body); } catch { return undefined; }
}
const indent = (s: string, n: number) => s.split('\n').map((l, i) => (i ? ' '.repeat(n) + l : l)).join('\n');

export function toFetch(r: Request): string {
  const lines: string[] = [];
  const opts: string[] = [`  method: ${q(r.method)},`];
  const headers = r.form ? r.headers.filter(([k]) => k.toLowerCase() !== 'content-type') : r.headers;
  if (headers.length) opts.push(`  headers: {\n${headers.map(([k, v]) => `    ${q(k)}: ${q(v)},`).join('\n')}\n  },`);
  if (r.form) {
    lines.push('const form = new FormData();');
    for (const [k, v] of r.form) lines.push(v.startsWith('@') ? `form.append(${q(k)}, fileInput /* ${v.slice(1)} */);` : `form.append(${q(k)}, ${q(v)});`);
    opts.push('  body: form,');
  } else if (r.body !== null) {
    const j = jsonBody(r);
    opts.push(j !== undefined ? `  body: JSON.stringify(${indent(JSON.stringify(j, null, 2), 2)}),` : `  body: ${q(r.body)},`);
  }
  if (!r.followRedirects) opts.push(`  redirect: 'manual',`);
  lines.push(`const res = await fetch(${q(r.url)}, {\n${opts.join('\n')}\n});`, `const data = await res.${r.method === 'HEAD' ? 'headers' : isJsonResponse(r) ? 'json()' : 'text()'};`);
  if (r.insecure) lines.unshift('// Note: --insecure (skip TLS verification) has no fetch equivalent.');
  return lines.join('\n');
}

function isJsonResponse(r: Request) {
  return r.headers.some(([k, v]) => k.toLowerCase() === 'accept' && v.includes('json')) || isJson(r);
}

export function toAxios(r: Request): string {
  const lines = ["import axios from 'axios';", ''];
  const cfg: string[] = [`  method: ${q(r.method.toLowerCase())},`, `  url: ${q(r.url)},`];
  const headers = r.headers.filter(([k]) => !(r.auth && k === 'Authorization') && !(r.form && k.toLowerCase() === 'content-type'));
  if (headers.length) cfg.push(`  headers: {\n${headers.map(([k, v]) => `    ${q(k)}: ${q(v)},`).join('\n')}\n  },`);
  if (r.auth) cfg.push(`  auth: { username: ${q(r.auth.user)}, password: ${q(r.auth.pass)} },`);
  if (r.form) {
    lines.push('const form = new FormData();', ...r.form.map(([k, v]) => (v.startsWith('@') ? `form.append(${q(k)}, fileInput /* ${v.slice(1)} */);` : `form.append(${q(k)}, ${q(v)});`)), '');
    cfg.push('  data: form,');
  } else if (r.body !== null) {
    const j = jsonBody(r);
    cfg.push(`  data: ${j !== undefined ? indent(JSON.stringify(j, null, 2), 2) : q(r.body)},`);
  }
  if (!r.followRedirects) cfg.push('  maxRedirects: 0,');
  lines.push(`const response = await axios({\n${cfg.join('\n')}\n});`, 'console.log(response.data);');
  return lines.join('\n');
}

function py(v: unknown, ind = 0): string {
  const pad = ' '.repeat(ind + 4);
  if (v === null) return 'None';
  if (v === true) return 'True';
  if (v === false) return 'False';
  if (typeof v === 'string') return JSON.stringify(v);
  if (typeof v === 'number') return String(v);
  if (Array.isArray(v)) return v.length ? `[\n${v.map((x) => pad + py(x, ind + 4)).join(',\n')},\n${' '.repeat(ind)}]` : '[]';
  const e = Object.entries(v as object);
  return e.length ? `{\n${e.map(([k, x]) => `${pad}${JSON.stringify(k)}: ${py(x, ind + 4)}`).join(',\n')},\n${' '.repeat(ind)}}` : '{}';
}

export function toPython(r: Request): string {
  const lines = ['import requests', ''];
  const args = [`    ${q(r.url)}`];
  const headers = r.headers.filter(([k]) => !(r.auth && k === 'Authorization') && !(r.form && k.toLowerCase() === 'content-type'));
  const j = jsonBody(r);
  const hdrs = j !== undefined ? headers.filter(([k]) => k.toLowerCase() !== 'content-type') : headers;
  if (hdrs.length) { lines.push(`headers = ${py(Object.fromEntries(hdrs))}`, ''); args.push('    headers=headers'); }
  if (r.form) {
    const files = r.form.filter(([, v]) => v.startsWith('@'));
    const fields = r.form.filter(([, v]) => !v.startsWith('@'));
    if (fields.length) { lines.push(`data = ${py(Object.fromEntries(fields))}`); args.push('    data=data'); }
    if (files.length) { lines.push(`files = {${files.map(([k, v]) => `${q(k)}: open(${q(v.slice(1))}, "rb")`).join(', ')}}`); args.push('    files=files'); }
    lines.push('');
  } else if (j !== undefined) { lines.push(`payload = ${py(j)}`, ''); args.push('    json=payload'); }
  else if (r.body !== null) { lines.push(`data = ${q(r.body)}`, ''); args.push('    data=data'); }
  if (r.auth) args.push(`    auth=(${q(r.auth.user)}, ${q(r.auth.pass)})`);
  if (r.insecure) args.push('    verify=False');
  if (!r.followRedirects && r.method !== 'HEAD') args.push('    allow_redirects=False');
  const known = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'].includes(r.method);
  if (!known) args.unshift(`    ${q(r.method)}`);
  lines.push(`response = requests.${known ? r.method.toLowerCase() : 'request'}(\n${args.join(',\n')},\n)`, 'print(response.status_code)', 'print(response.text)');
  return lines.join('\n');
}
