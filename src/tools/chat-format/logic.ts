/**
 * Convert chat message arrays between OpenAI Chat Completions, Anthropic Messages and
 * Gemini generateContent formats, via a small canonical model.
 */
export type Provider = 'openai' | 'anthropic' | 'gemini';
export type Result<T> = { ok: true; value: T } | { ok: false; error: string };

export type Part =
  | { type: 'text'; text: string }
  | { type: 'image'; url?: string; mediaType?: string; data?: string }
  | { type: 'tool_call'; id: string; name: string; args: unknown }
  | { type: 'tool_result'; id: string; name?: string; content: string; isError?: boolean };

export interface Msg {
  role: 'user' | 'assistant';
  parts: Part[];
}

export interface Conversation {
  system: string | null;
  messages: Msg[];
  warnings: string[];
}

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => !!v && typeof v === 'object' && !Array.isArray(v);
const str = (v: unknown) => (typeof v === 'string' ? v : v == null ? '' : JSON.stringify(v));

function parseDataUri(url: string): { mediaType: string; data: string } | null {
  const m = /^data:([^;,]+);base64,(.*)$/s.exec(url);
  return m ? { mediaType: m[1]!, data: m[2]! } : null;
}
function imagePart(url: string): Part {
  const d = parseDataUri(url);
  return d ? { type: 'image', ...d } : { type: 'image', url };
}

/** Append, merging into the previous message when the role repeats. */
function push(msgs: Msg[], role: Msg['role'], parts: Part[]) {
  if (!parts.length) return;
  const last = msgs[msgs.length - 1];
  if (last && last.role === role) last.parts.push(...parts);
  else msgs.push({ role, parts });
}

// ---------------- detection ----------------
export function detect(v: unknown): Provider {
  if (isObj(v) && (Array.isArray(v.contents) || 'systemInstruction' in v || 'system_instruction' in v)) return 'gemini';
  const msgs = Array.isArray(v) ? v : isObj(v) && Array.isArray(v.messages) ? v.messages : [];
  if (isObj(v) && 'system' in v) return 'anthropic';
  for (const m of msgs) {
    if (!isObj(m)) continue;
    if (m.role === 'system' || m.role === 'developer' || m.role === 'tool' || 'tool_calls' in m) return 'openai';
    if (m.role === 'model' || Array.isArray(m.parts)) return 'gemini';
    if (Array.isArray(m.content) && m.content.some((b) => isObj(b) && ['tool_use', 'tool_result', 'image'].includes(String(b.type)))) return 'anthropic';
    if (Array.isArray(m.content) && m.content.some((b) => isObj(b) && b.type === 'image_url')) return 'openai';
  }
  return 'openai';
}

// ---------------- parsers ----------------
function parseOpenAI(v: unknown): Result<Conversation> {
  const list = Array.isArray(v) ? v : isObj(v) && Array.isArray(v.messages) ? v.messages : null;
  if (!list) return { ok: false, error: 'Expected an array of messages or an object with "messages".' };
  const conv: Conversation = { system: null, messages: [], warnings: [] };
  const names = new Map<string, string>();
  const systems: string[] = [];
  list.forEach((m, i) => {
    if (!isObj(m)) return conv.warnings.push(`Message ${i + 1} is not an object; skipped.`);
    const role = m.role;
    const contentParts = (): Part[] => {
      const c = m.content;
      if (typeof c === 'string') return c ? [{ type: 'text', text: c }] : [];
      if (!Array.isArray(c)) return [];
      const out: Part[] = [];
      for (const b of c) {
        if (!isObj(b)) continue;
        if (b.type === 'text') out.push({ type: 'text', text: str(b.text) });
        else if (b.type === 'image_url') out.push(imagePart(str(isObj(b.image_url) ? b.image_url.url : b.image_url)));
        else conv.warnings.push(`Message ${i + 1}: "${String(b.type)}" content is not supported and was dropped.`);
      }
      return out;
    };
    if (role === 'system' || role === 'developer') {
      if (conv.messages.length) conv.warnings.push(`Message ${i + 1}: a system message mid-conversation was moved to the top-level system prompt.`);
      systems.push(contentParts().map((p) => (p.type === 'text' ? p.text : '')).join('\n'));
    } else if (role === 'user') {
      push(conv.messages, 'user', contentParts());
    } else if (role === 'assistant') {
      const parts = contentParts();
      const calls = Array.isArray(m.tool_calls) ? m.tool_calls : [];
      for (const tc of calls) {
        if (!isObj(tc) || !isObj(tc.function)) continue;
        const id = str(tc.id) || `call_${names.size + 1}`;
        const name = str(tc.function.name);
        let args: unknown = tc.function.arguments;
        if (typeof args === 'string') {
          try {
            args = args.trim() ? JSON.parse(args) : {};
          } catch {
            conv.warnings.push(`Tool call ${id}: arguments are not valid JSON; kept as a string.`);
          }
        }
        names.set(id, name);
        parts.push({ type: 'tool_call', id, name, args });
      }
      if (isObj(m.function_call)) {
        const id = `call_${names.size + 1}`;
        const name = str(m.function_call.name);
        names.set(id, name);
        let args: unknown = m.function_call.arguments;
        try { args = JSON.parse(str(args) || '{}'); } catch { /* keep string */ }
        parts.push({ type: 'tool_call', id, name, args });
      }
      push(conv.messages, 'assistant', parts);
    } else if (role === 'tool') {
      const id = str(m.tool_call_id);
      push(conv.messages, 'user', [{ type: 'tool_result', id, name: names.get(id), content: typeof m.content === 'string' ? m.content : contentParts().map((p) => (p.type === 'text' ? p.text : '')).join('') }]);
    } else if (role === 'function') {
      const name = str(m.name);
      const id = [...names].reverse().find(([, n]) => n === name)?.[0] ?? `call_${name}`;
      push(conv.messages, 'user', [{ type: 'tool_result', id, name, content: str(m.content) }]);
    } else {
      conv.warnings.push(`Message ${i + 1}: unknown role "${String(role)}"; skipped.`);
    }
  });
  conv.system = systems.length ? systems.join('\n\n') : null;
  return { ok: true, value: conv };
}

function parseAnthropic(v: unknown): Result<Conversation> {
  const list = Array.isArray(v) ? v : isObj(v) && Array.isArray(v.messages) ? v.messages : null;
  if (!list) return { ok: false, error: 'Expected an object with "messages" (and optional "system").' };
  const conv: Conversation = { system: null, messages: [], warnings: [] };
  if (isObj(v)) {
    if (typeof v.system === 'string') conv.system = v.system || null;
    else if (Array.isArray(v.system)) conv.system = v.system.map((b) => (isObj(b) ? str(b.text) : '')).join('\n') || null;
  }
  const blocks = (c: unknown, i: number): Part[] => {
    if (typeof c === 'string') return c ? [{ type: 'text', text: c }] : [];
    if (!Array.isArray(c)) return [];
    const out: Part[] = [];
    for (const b of c) {
      if (!isObj(b)) continue;
      switch (b.type) {
        case 'text': out.push({ type: 'text', text: str(b.text) }); break;
        case 'image': {
          const s = isObj(b.source) ? b.source : {};
          if (s.type === 'base64') out.push({ type: 'image', mediaType: str(s.media_type), data: str(s.data) });
          else if (s.type === 'url') out.push({ type: 'image', url: str(s.url) });
          else conv.warnings.push(`Message ${i + 1}: image source "${String(s.type)}" is not supported.`);
          break;
        }
        case 'tool_use': out.push({ type: 'tool_call', id: str(b.id), name: str(b.name), args: b.input ?? {} }); break;
        case 'tool_result': {
          const content = typeof b.content === 'string' ? b.content : Array.isArray(b.content) ? b.content.map((x) => (isObj(x) && x.type === 'text' ? str(x.text) : '')).join('') : '';
          out.push({ type: 'tool_result', id: str(b.tool_use_id), content, isError: b.is_error === true || undefined });
          break;
        }
        case 'thinking':
        case 'redacted_thinking':
          conv.warnings.push(`Message ${i + 1}: ${String(b.type)} blocks are Anthropic-specific and were dropped.`);
          break;
        default:
          conv.warnings.push(`Message ${i + 1}: "${String(b.type)}" blocks are not supported and were dropped.`);
      }
    }
    return out;
  };
  const names = new Map<string, string>();
  list.forEach((m, i) => {
    if (!isObj(m) || (m.role !== 'user' && m.role !== 'assistant')) {
      conv.warnings.push(`Message ${i + 1}: role must be "user" or "assistant"; skipped.`);
      return;
    }
    const parts = blocks(m.content, i);
    for (const p of parts) {
      if (p.type === 'tool_call') names.set(p.id, p.name);
      if (p.type === 'tool_result') p.name = names.get(p.id);
    }
    push(conv.messages, m.role, parts);
  });
  return { ok: true, value: conv };
}

function parseGemini(v: unknown): Result<Conversation> {
  const contents = isObj(v) && Array.isArray(v.contents) ? v.contents : Array.isArray(v) ? v : null;
  if (!contents) return { ok: false, error: 'Expected an object with "contents" (and optional "systemInstruction").' };
  const conv: Conversation = { system: null, messages: [], warnings: [] };
  const si = isObj(v) ? (v.systemInstruction ?? v.system_instruction) : undefined;
  if (isObj(si) && Array.isArray(si.parts)) conv.system = si.parts.map((p) => (isObj(p) ? str(p.text) : '')).join('\n') || null;
  else if (typeof si === 'string') conv.system = si || null;
  let n = 0;
  const pending = new Map<string, string[]>(); // name -> ids of calls awaiting responses
  contents.forEach((c, i) => {
    if (!isObj(c)) return;
    const role = c.role === 'model' ? 'assistant' : 'user';
    const parts: Part[] = [];
    for (const p of Array.isArray(c.parts) ? c.parts : []) {
      if (!isObj(p)) continue;
      const inline = (p.inlineData ?? p.inline_data) as Obj | undefined;
      const file = (p.fileData ?? p.file_data) as Obj | undefined;
      const fc = (p.functionCall ?? p.function_call) as Obj | undefined;
      const fr = (p.functionResponse ?? p.function_response) as Obj | undefined;
      if (typeof p.text === 'string') {
        if (p.thought === true) conv.warnings.push(`Content ${i + 1}: thought parts were dropped.`);
        else parts.push({ type: 'text', text: p.text });
      } else if (isObj(inline)) parts.push({ type: 'image', mediaType: str(inline.mimeType ?? inline.mime_type), data: str(inline.data) });
      else if (isObj(file)) parts.push({ type: 'image', url: str(file.fileUri ?? file.file_uri), mediaType: str(file.mimeType ?? file.mime_type) || undefined });
      else if (isObj(fc)) {
        const name = str(fc.name);
        const id = str(fc.id) || `call_${++n}`;
        pending.set(name, [...(pending.get(name) ?? []), id]);
        parts.push({ type: 'tool_call', id, name, args: fc.args ?? {} });
      } else if (isObj(fr)) {
        const name = str(fr.name);
        const queue = pending.get(name) ?? [];
        const id = str(fr.id) || queue.shift() || `call_${++n}`;
        const resp = fr.response;
        const content = isObj(resp) && Object.keys(resp).length === 1 && typeof (resp.result ?? resp.content ?? resp.output) === 'string' ? str(resp.result ?? resp.content ?? resp.output) : JSON.stringify(resp ?? {});
        parts.push({ type: 'tool_result', id, name, content });
      } else conv.warnings.push(`Content ${i + 1}: unsupported part ${JSON.stringify(Object.keys(p))} dropped.`);
    }
    push(conv.messages, role, parts);
  });
  return { ok: true, value: conv };
}

// ---------------- serializers ----------------
function toOpenAI(c: Conversation): unknown {
  const out: Obj[] = [];
  if (c.system) out.push({ role: 'system', content: c.system });
  for (const m of c.messages) {
    if (m.role === 'user') {
      for (const p of m.parts) if (p.type === 'tool_result') out.push({ role: 'tool', tool_call_id: p.id, content: p.content });
      const rest = m.parts.filter((p) => p.type === 'text' || p.type === 'image');
      if (!rest.length) continue;
      if (rest.length === 1 && rest[0]!.type === 'text') out.push({ role: 'user', content: rest[0]!.text });
      else out.push({ role: 'user', content: rest.map((p) => (p.type === 'text' ? { type: 'text', text: p.text } : { type: 'image_url', image_url: { url: p.type === 'image' ? (p.url ?? `data:${p.mediaType};base64,${p.data}`) : '' } })) });
    } else {
      const text = m.parts.filter((p) => p.type === 'text').map((p) => (p as { text: string }).text).join('');
      const calls = m.parts.filter((p): p is Extract<Part, { type: 'tool_call' }> => p.type === 'tool_call');
      if (m.parts.some((p) => p.type === 'image')) c.warnings.push('OpenAI assistant messages cannot contain images; dropped.');
      const msg: Obj = { role: 'assistant', content: text || null };
      if (calls.length) msg.tool_calls = calls.map((t) => ({ id: t.id, type: 'function', function: { name: t.name, arguments: typeof t.args === 'string' ? t.args : JSON.stringify(t.args) } }));
      out.push(msg);
    }
  }
  return out;
}

function toAnthropic(c: Conversation): unknown {
  const messages = c.messages.map((m) => {
    const parts = m.role === 'user' ? [...m.parts.filter((p) => p.type === 'tool_result'), ...m.parts.filter((p) => p.type !== 'tool_result')] : m.parts;
    if (parts.length === 1 && parts[0]!.type === 'text') return { role: m.role, content: parts[0]!.text };
    return {
      role: m.role,
      content: parts.map((p) => {
        switch (p.type) {
          case 'text': return { type: 'text', text: p.text };
          case 'image': return { type: 'image', source: p.url ? { type: 'url', url: p.url } : { type: 'base64', media_type: p.mediaType, data: p.data } };
          case 'tool_call': return { type: 'tool_use', id: p.id, name: p.name, input: isObj(p.args) ? p.args : { value: p.args } };
          case 'tool_result': return { type: 'tool_result', tool_use_id: p.id, content: p.content, ...(p.isError ? { is_error: true } : {}) };
        }
      }),
    };
  });
  if (messages[0]?.role === 'assistant') c.warnings.push('Anthropic conversations must start with a user message.');
  return c.system ? { system: c.system, messages } : { messages };
}

function toGemini(c: Conversation): unknown {
  const contents = c.messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: m.parts.map((p) => {
      switch (p.type) {
        case 'text': return { text: p.text };
        case 'image':
          if (p.url) {
            c.warnings.push('Gemini fileData needs a file URI uploaded to the Files API or Cloud Storage; plain web URLs may be rejected.');
            return { fileData: { mimeType: p.mediaType || 'image/jpeg', fileUri: p.url } };
          }
          return { inlineData: { mimeType: p.mediaType, data: p.data } };
        case 'tool_call': return { functionCall: { name: p.name, args: isObj(p.args) ? p.args : { value: p.args } } };
        case 'tool_result': {
          if (!p.name) c.warnings.push(`Tool result ${p.id}: no function name found (Gemini requires one).`);
          let response: unknown;
          try {
            const j: unknown = JSON.parse(p.content);
            response = isObj(j) ? j : { result: j };
          } catch {
            response = { result: p.content };
          }
          return { functionResponse: { name: p.name ?? 'unknown', response } };
        }
      }
    }),
  }));
  return c.system ? { systemInstruction: { parts: [{ text: c.system }] }, contents } : { contents };
}

const PARSERS = { openai: parseOpenAI, anthropic: parseAnthropic, gemini: parseGemini };
const WRITERS = { openai: toOpenAI, anthropic: toAnthropic, gemini: toGemini };

export function convertChat(json: string, from: Provider | 'auto', to: Provider): Result<{ output: string; detected: Provider; warnings: string[] }> {
  if (!json.trim()) return { ok: false, error: 'Paste a message array.' };
  let v: unknown;
  try {
    v = JSON.parse(json);
  } catch (e) {
    return { ok: false, error: `Invalid JSON: ${e instanceof Error ? e.message : String(e)}` };
  }
  const detected = from === 'auto' ? detect(v) : from;
  const parsed = PARSERS[detected](v);
  if (!parsed.ok) return parsed;
  const conv = parsed.value;
  const out = WRITERS[to](conv);
  return { ok: true, value: { output: JSON.stringify(out, null, 2), detected, warnings: [...new Set(conv.warnings)] } };
}

export { parseOpenAI, parseAnthropic, parseGemini, toOpenAI, toAnthropic, toGemini };
