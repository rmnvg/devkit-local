import { ToolShell } from '@/components/ToolShell';
import { Panel, SplitPanels } from '@/components/Panels';
import { CodeInput, type CodeLang } from '@/components/CodeInput';
import { OutputPanel } from '@/components/OutputPanel';
import { ErrorBox } from '@/components/ErrorBox';
import { useToolState } from '@/lib/useToolState';
import { useDebounced } from '@/lib/useDebounced';
import { convert, type Format } from './logic';

const FORMATS: { value: Format; label: string }[] = [
  { value: 'json', label: 'JSON' },
  { value: 'yaml', label: 'YAML' },
  { value: 'csv', label: 'CSV' },
  { value: 'xml', label: 'XML' },
];
const LANG: Record<Format, CodeLang> = { json: 'json', yaml: 'yaml', xml: 'xml', csv: 'text' };

const SAMPLE = JSON.stringify(
  [
    { id: 1, name: 'Ada Lovelace', email: 'ada@example.com', address: { city: 'London', country: 'UK' }, active: true },
    { id: 2, name: 'Grace Hopper', email: 'grace@example.com', address: { city: 'Arlington', country: 'US' }, active: false },
  ],
  null,
  2,
);

export default function DataConverter() {
  const [s, set, api] = useToolState(
    'data-converter',
    { text: '', from: 'json' as Format, to: 'yaml' as Format, delimiter: ',', header: true, flatten: true },
    ['text'],
  );
  const text = useDebounced(s.text);
  const r = text.trim() ? convert(text, s.from, s.to, { delimiter: s.delimiter, header: s.header, flatten: s.flatten, indent: 2 }) : null;
  const output = r?.ok ? r.value : '';
  const csvInvolved = s.from === 'csv' || s.to === 'csv';

  const swap = () => set({ from: s.to, to: s.from, text: output || s.text });

  return (
    <ToolShell
      onSample={() => set({ text: SAMPLE, from: 'json', to: 'csv' })}
      onClear={() => set({ text: '' })}
      output={output}
      share={api}
      toolbar={
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <label className="flex items-center gap-1">
            From
            <select className="select" value={s.from} onChange={(e) => set({ from: e.target.value as Format })}>
              {FORMATS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
          </label>
          <button type="button" className="btn btn-ghost" onClick={swap} aria-label="Swap formats" title="Swap (uses output as new input)">⇄</button>
          <label className="flex items-center gap-1">
            To
            <select className="select" value={s.to} onChange={(e) => set({ to: e.target.value as Format })}>
              {FORMATS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
          </label>
          {csvInvolved && (
            <>
              <label className="flex items-center gap-1">
                Delimiter
                <select className="select" value={s.delimiter} onChange={(e) => set({ delimiter: e.target.value })}>
                  <option value=",">Comma</option>
                  <option value=";">Semicolon</option>
                  <option value={'\t'}>Tab</option>
                  <option value="|">Pipe</option>
                </select>
              </label>
              <label className="flex items-center gap-1"><input type="checkbox" checked={s.header} onChange={(e) => set({ header: e.target.checked })} />Header row</label>
              <label className="flex items-center gap-1"><input type="checkbox" checked={s.flatten} onChange={(e) => set({ flatten: e.target.checked })} />Dot-notation nesting</label>
            </>
          )}
        </div>
      }
    >
      <SplitPanels>
        <Panel title={`Input (${s.from.toUpperCase()})`}>
          <CodeInput language={LANG[s.from]} label={`Input ${s.from}`} value={s.text} onChange={(t) => set({ text: t })} minHeight="24rem" placeholder={`Paste ${s.from.toUpperCase()}…`} />
          {r && !r.ok && <ErrorBox error={r.error} />}
        </Panel>
        <OutputPanel title={`Output (${s.to.toUpperCase()})`} value={output} />
      </SplitPanels>
    </ToolShell>
  );
}
