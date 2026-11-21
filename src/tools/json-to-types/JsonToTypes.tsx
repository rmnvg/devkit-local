import { ToolShell } from '@/components/ToolShell';
import { Panel, SplitPanels } from '@/components/Panels';
import { CodeInput } from '@/components/CodeInput';
import { OutputPanel } from '@/components/OutputPanel';
import { ErrorBox } from '@/components/ErrorBox';
import { Tabs } from '@/components/Tabs';
import { useToolState } from '@/lib/useToolState';
import { useDebounced } from '@/lib/useDebounced';
import { generate, type Target } from './logic';

const SAMPLE = JSON.stringify(
  {
    id: 'chatcmpl-123',
    model: 'gpt-6.1-terra',
    created: 1795000000,
    choices: [
      { index: 0, finish_reason: 'stop', message: { role: 'assistant', content: 'Hello!' } },
      { index: 1, finish_reason: 'tool_calls', message: { role: 'assistant', content: null, tool_calls: [{ id: 'call_1', type: 'function', function: { name: 'get_weather', arguments: '{"city":"Paris"}' } }] } },
    ],
    usage: { prompt_tokens: 12, completion_tokens: 5, total_tokens: 17 },
  },
  null,
  2,
);

const TARGETS: { value: Target; label: string }[] = [
  { value: 'typescript', label: 'TypeScript' },
  { value: 'pydantic', label: 'Pydantic v2' },
  { value: 'go', label: 'Go' },
  { value: 'zod', label: 'Zod' },
];

export default function JsonToTypes() {
  const [s, set, api] = useToolState('json-to-types', { text: '', target: 'typescript' as Target, rootName: 'Root', allOptional: false }, ['text']);
  const text = useDebounced(s.text);
  const r = text.trim() ? generate(text, s.target, { rootName: s.rootName, allOptional: s.allOptional }) : null;
  const output = r?.ok ? r.value : '';
  return (
    <ToolShell
      onSample={() => set({ text: SAMPLE, rootName: 'ChatCompletion' })}
      onClear={() => set({ text: '' })}
      output={output}
      share={api}
      toolbar={
        <>
          <label className="flex items-center gap-2 text-sm">
            Root type name
            <input className="input w-40 font-mono" value={s.rootName} onChange={(e) => set({ rootName: e.target.value })} />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={s.allOptional} onChange={(e) => set({ allOptional: e.target.checked })} />
            Make all fields optional
          </label>
        </>
      }
    >
      <SplitPanels>
        <Panel title="JSON sample">
          <CodeInput language="json" label="JSON sample" value={s.text} onChange={(t) => set({ text: t })} minHeight="24rem" placeholder="Paste a JSON sample (arrays of objects are merged)…" />
          {r && !r.ok && <ErrorBox error={r.error} />}
        </Panel>
        <div className="flex min-w-0 flex-col gap-2">
          <Tabs label="Target language" value={s.target} onChange={(target) => set({ target })} options={TARGETS} />
          <OutputPanel title={TARGETS.find((t) => t.value === s.target)!.label} value={output} />
        </div>
      </SplitPanels>
    </ToolShell>
  );
}
