import { ToolShell } from '@/components/ToolShell';
import { Panel, SplitPanels } from '@/components/Panels';
import { OutputPanel } from '@/components/OutputPanel';
import { WarningBox } from '@/components/ErrorBox';
import { ModelSelect } from '@/components/ModelSelect';
import { TokenBadge } from '@/components/TokenBadge';
import { useToolState } from '@/lib/useToolState';
import { models } from '@/lib/llm';
import { findVariables, lintTemplate, render } from './logic';

const SAMPLE_TEMPLATE = `You are {{assistant_name}}, a support assistant for {{company}}.
Answer in {{language}}. Keep answers under {{max_words}} words.

<customer_profile>
Plan: {{plan}}
</customer_profile>

Question: {{question}}`;
const SAMPLE_VALUES = { assistant_name: 'Nova', company: 'Acme Cloud', language: 'English', max_words: '120', plan: 'Pro (annual)', question: 'How do I rotate my API key?' };

function parseValues(json: string): Record<string, string> {
  try {
    const v = JSON.parse(json) as unknown;
    return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, string>) : {};
  } catch {
    return {};
  }
}

export default function PromptTemplate() {
  const [s, set, api] = useToolState('prompt-template', { template: '', values: '{}', model: models[0]!.id }, ['template', 'values']);
  const values = parseValues(s.values);
  const vars = findVariables(s.template);
  const rendered = render(s.template, values);
  const lint = lintTemplate(s.template);
  const setValue = (name: string, v: string) => set({ values: JSON.stringify({ ...values, [name]: v }) });

  return (
    <ToolShell
      onSample={() => set({ template: SAMPLE_TEMPLATE, values: JSON.stringify(SAMPLE_VALUES) })}
      onClear={() => set({ template: '', values: '{}' })}
      output={rendered.text}
      share={api}
    >
      <SplitPanels>
        <div className="flex min-w-0 flex-col gap-4">
          <Panel title="Template" actions={<TokenBadge text={s.template} modelId={s.model} label="tokens (template)" />}>
            <textarea aria-label="Template" spellCheck={false} className="code-box min-h-64 w-full resize-y" value={s.template} placeholder="Write a prompt using {{variables}}…" onChange={(e) => set({ template: e.target.value })} />
            {lint.map((l) => <WarningBox key={l}>{l}</WarningBox>)}
          </Panel>
          <Panel title={`Variables (${vars.length})`}>
            {vars.length === 0 && <p className="text-sm text-slate-500 dark:text-slate-400">No {'{{variables}}'} found. Use double braces, e.g. {'{{name}}'}. Escape with {'\\{{'}.</p>}
            <div className="flex flex-col gap-2">
              {vars.map((v) => (
                <label key={v.name} className="field-label">
                  <span className="font-mono text-xs">{v.name}{v.count > 1 && <span className="text-slate-500 dark:text-slate-400"> ×{v.count}</span>}</span>
                  <textarea rows={1} className="input resize-y font-mono" value={values[v.name] ?? ''} onChange={(e) => setValue(v.name, e.target.value)} />
                </label>
              ))}
            </div>
          </Panel>
        </div>
        <div className="flex min-w-0 flex-col gap-2">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <ModelSelect value={s.model} onChange={(model) => set({ model })} />
            <TokenBadge text={rendered.text} modelId={s.model} label="tokens (rendered)" />
          </div>
          {rendered.missing.length > 0 && <WarningBox>Missing values: {rendered.missing.join(', ')}</WarningBox>}
          <OutputPanel title="Rendered prompt" value={rendered.text} />
        </div>
      </SplitPanels>
    </ToolShell>
  );
}
