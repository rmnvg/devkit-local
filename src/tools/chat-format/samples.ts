export const SAMPLE_OPENAI = [
  { role: 'system', content: 'You are a weather assistant. Use tools when needed.' },
  { role: 'user', content: [{ type: 'text', text: 'What should I wear in Paris today?' }, { type: 'image_url', image_url: { url: 'data:image/png;base64,iVBORw0KGgo=' } }] },
  { role: 'assistant', content: null, tool_calls: [{ id: 'call_abc123', type: 'function', function: { name: 'get_weather', arguments: '{"city":"Paris","unit":"celsius"}' } }] },
  { role: 'tool', tool_call_id: 'call_abc123', content: '{"temp":12,"conditions":"light rain"}' },
  { role: 'assistant', content: 'It is 12°C with light rain — bring a waterproof jacket.' },
];
