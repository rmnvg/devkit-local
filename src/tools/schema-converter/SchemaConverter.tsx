import { ToolShell } from '@/components/ToolShell';
import { Panel, SplitPanels } from '@/components/Panels';
import { CodeInput } from '@/components/CodeInput';
import { OutputPanel } from '@/components/OutputPanel';
import { ErrorBox, WarningBox } from '@/components/ErrorBox';
import { useToolState } from '@/lib/useToolState';
import { useDebounced } from '@/lib/useDebounced';
import { convertSchema, type SourceFormat, type TargetFormat } from './logic';

const SOURCES: { value: SourceFormat; label: string }[] = [
  { value: 'auto', label: 'Auto-detect' },
  { value: 'jsonschema', label: 'JSON Schema' },
  { value: 'openai', label: 'OpenAI tool' },
  { value: 'anthropic', label: 'Anthropic tool' },
  { value: 'gemini', label: 'Gemini function declaration' },
  { value: 'sample', label: 'JSON sample (infer schema)' },
];
const TARGETS: { value: TargetFormat; label: string }[] = [
  { value: 'openai', label: 'OpenAI Chat Completions tool' },
  { value: 'openai-responses', label: 'OpenAI Responses tool' },
  { value: 'anthropic', label: 'Anthropic tool' },
  { value: 'gemini', label: 'Gemini function declaration' },
  { value: 'jsonschema', label: 'JSON Schema' },
];

const SAMPLE = JSON.stringify(
  {
    name: 'search_orders',
    description: 'Search a customer’s orders by status and date range.',
    input_schema: {
      type: 'object',
      properties: {
        customer_id: { type: 'string', description: 'Customer ID, e.g. cus_123' },
        status: { type: 'string', enum: ['pending', 'shipped', 'delivered', 'cancelled'] },
        since: { type: 'string', format: 'date', description: 'Only orders on or after this date' },
        limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
      },
      required: ['customer_id'],
      additionalProperties: false,
    },
  },
  null,
  2,
);

export default function SchemaConverter() {
  const [s, set, api] = useToolState('schema-converter', { text: '', from: 'auto' as SourceFormat, to: 'openai' as TargetFormat, name: 'my_tool', description: '', strict: false }, ['text']);
  const text = useDebounced(s.text);
  const r = text.trim() ? convertSchema(text, s.from, s.to, { name: s.name, description: s.description, strict: s.strict }) : null;
  const output = r?.ok ? r.value.output : '';
  const needsName = r?.ok ? r.value.detected === 'sample' || r.value.detected === 'jsonschema' : s.from === 'sample' || s.from === 'jsonschema';

  return (
    <ToolShell
      onSample={() => set({ text: SAMPLE, from: 'auto', to: 'openai' })}
      onClear={() => set({ text: '' })}
      output={output}
      share={api}
      toolbar={
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <label className="flex items-center gap-1">
            From
            <select className="select" value={s.from} onChange={(e) => set({ from: e.target.value as SourceFormat })}>
              {SOURCES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </label>
          <label className="flex items-center gap-1">
            To
            <select className="select" value={s.to} onChange={(e) => set({ to: e.target.value as TargetFormat })}>
              {TARGETS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </label>
          {(s.to === 'openai' || s.to === 'openai-responses') && (
            <label className="flex items-center gap-1" title="All properties required, optional ones nullable, additionalProperties: false">
              <input type="checkbox" checked={s.strict} onChange={(e) => set({ strict: e.target.checked })} /> Strict mode
            </label>
          )}
        </div>
      }
    >
      {needsName && (
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="field-label">Tool name (used when the source has none)<input className="input font-mono" value={s.name} onChange={(e) => set({ name: e.target.value })} /></label>
          <label className="field-label">Description<input className="input" value={s.description} onChange={(e) => set({ description: e.target.value })} /></label>
        </div>
      )}
      <SplitPanels>
        <Panel title={`Input${r?.ok && s.from === 'auto' ? ` (detected: ${SOURCES.find((x) => x.value === r.value.detected)!.label})` : ''}`}>
          <CodeInput language="json" label="Input schema or tool" value={s.text} onChange={(t) => set({ text: t })} minHeight="26rem" placeholder="Paste a tool definition, a JSON Schema, or a JSON sample…" />
          {r && !r.ok && <ErrorBox error={r.error} />}
        </Panel>
        <div className="flex min-w-0 flex-col gap-2">
          {r?.ok && r.value.warnings.length > 0 && (
            <WarningBox><ul className="list-disc pl-4">{r.value.warnings.map((w) => <li key={w}>{w}</li>)}</ul></WarningBox>
          )}
          <OutputPanel title={TARGETS.find((t) => t.value === s.to)!.label} value={output} />
        </div>
      </SplitPanels>
    </ToolShell>
  );
}
