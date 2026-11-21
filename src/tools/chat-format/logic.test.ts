import { convertChat, detect, parseOpenAI, type Provider } from './logic';
import { SAMPLE_OPENAI } from './samples';

const conv = (v: unknown, from: Provider | 'auto', to: Provider) => {
  const r = convertChat(JSON.stringify(v), from, to);
  if (!r.ok) throw new Error(r.error);
  return { out: JSON.parse(r.value.output) as Record<string, unknown> & unknown[], ...r.value };
};

describe('detect', () => {
  it('detects each provider', () => {
    expect(detect(SAMPLE_OPENAI)).toBe('openai');
    expect(detect({ system: 'x', messages: [] })).toBe('anthropic');
    expect(detect({ messages: [{ role: 'assistant', content: [{ type: 'tool_use' }] }] })).toBe('anthropic');
    expect(detect({ contents: [] })).toBe('gemini');
  });
});

describe('OpenAI → Anthropic', () => {
  const { out, warnings } = conv(SAMPLE_OPENAI, 'auto', 'anthropic');
  it('hoists system, converts images, tool calls and results', () => {
    expect(out.system).toBe('You are a weather assistant. Use tools when needed.');
    const msgs = out.messages as { role: string; content: unknown }[];
    expect(msgs.map((m) => m.role)).toEqual(['user', 'assistant', 'user', 'assistant']);
    expect(msgs[0]!.content).toEqual([
      { type: 'text', text: 'What should I wear in Paris today?' },
      { type: 'image', source: { type: 'base64', media_type: 'image/png', data: 'iVBORw0KGgo=' } },
    ]);
    expect(msgs[1]!.content).toEqual([{ type: 'tool_use', id: 'call_abc123', name: 'get_weather', input: { city: 'Paris', unit: 'celsius' } }]);
    expect(msgs[2]!.content).toEqual([{ type: 'tool_result', tool_use_id: 'call_abc123', content: '{"temp":12,"conditions":"light rain"}' }]);
    expect(warnings).toEqual([]);
  });
});

describe('OpenAI → Gemini', () => {
  const { out } = conv(SAMPLE_OPENAI, 'openai', 'gemini');
  it('maps roles, inlineData and function call/response with names', () => {
    expect(out.systemInstruction).toEqual({ parts: [{ text: 'You are a weather assistant. Use tools when needed.' }] });
    const contents = out.contents as { role: string; parts: unknown[] }[];
    expect(contents.map((c) => c.role)).toEqual(['user', 'model', 'user', 'model']);
    expect(contents[0]!.parts[1]).toEqual({ inlineData: { mimeType: 'image/png', data: 'iVBORw0KGgo=' } });
    expect(contents[1]!.parts[0]).toEqual({ functionCall: { name: 'get_weather', args: { city: 'Paris', unit: 'celsius' } } });
    expect(contents[2]!.parts[0]).toEqual({ functionResponse: { name: 'get_weather', response: { temp: 12, conditions: 'light rain' } } });
  });
});

describe('round trips', () => {
  it('OpenAI → Anthropic → OpenAI preserves content', () => {
    const a = conv(SAMPLE_OPENAI, 'openai', 'anthropic').out;
    const back = conv(a, 'anthropic', 'openai').out as unknown[];
    expect(back).toEqual(SAMPLE_OPENAI);
  });
  it('OpenAI → Gemini → OpenAI keeps structure (ids regenerated)', () => {
    const g = conv(SAMPLE_OPENAI, 'openai', 'gemini').out;
    const back = conv(g, 'gemini', 'openai').out as { role: string; tool_calls?: { id: string }[]; tool_call_id?: string }[];
    expect(back.map((m) => m.role)).toEqual(['system', 'user', 'assistant', 'tool', 'assistant']);
    expect(back[3]!.tool_call_id).toBe(back[2]!.tool_calls![0]!.id);
  });
});

describe('edge cases', () => {
  it('merges consecutive same-role messages and warns on mid-conversation system', () => {
    const r = parseOpenAI([{ role: 'user', content: 'a' }, { role: 'user', content: 'b' }, { role: 'system', content: 's' }]);
    expect(r.ok && r.value.messages).toHaveLength(1);
    expect(r.ok && r.value.warnings[0]).toMatch(/moved to the top-level/);
  });
  it('warns on dropped Anthropic thinking and invalid tool args', () => {
    const w = conv({ messages: [{ role: 'user', content: 'hi' }, { role: 'assistant', content: [{ type: 'thinking', thinking: '…' }, { type: 'text', text: 'ok' }] }] }, 'anthropic', 'openai').warnings;
    expect(w.join(' ')).toMatch(/thinking/);
    const w2 = conv([{ role: 'assistant', tool_calls: [{ id: 'x', type: 'function', function: { name: 'f', arguments: '{bad' } }] }], 'openai', 'anthropic').warnings;
    expect(w2.join(' ')).toMatch(/not valid JSON/);
  });
  it('Gemini string results map back to plain text', () => {
    const g = { contents: [{ role: 'model', parts: [{ functionCall: { name: 'f', args: {} } }] }, { role: 'user', parts: [{ functionResponse: { name: 'f', response: { result: 'done' } } }] }] };
    const out = conv(g, 'gemini', 'anthropic').out;
    const msgs = out.messages as { content: { content?: string; tool_use_id?: string; id?: string }[] }[];
    expect(msgs[1]!.content[0]!.content).toBe('done');
    expect(msgs[1]!.content[0]!.tool_use_id).toBe(msgs[0]!.content[0]!.id);
  });
  it('bad input', () => {
    expect(convertChat('', 'auto', 'openai')).toMatchObject({ ok: false });
    expect(convertChat('{x', 'auto', 'openai')).toMatchObject({ ok: false, error: /Invalid JSON/ });
    expect(convertChat('{"foo":1}', 'anthropic', 'openai')).toMatchObject({ ok: false, error: /messages/ });
  });
});
