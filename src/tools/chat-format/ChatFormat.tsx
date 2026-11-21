import { ToolShell } from '@/components/ToolShell';
import { Panel, SplitPanels } from '@/components/Panels';
import { CodeInput } from '@/components/CodeInput';
import { OutputPanel } from '@/components/OutputPanel';
import { ErrorBox, WarningBox } from '@/components/ErrorBox';
import { useToolState } from '@/lib/useToolState';
import { useDebounced } from '@/lib/useDebounced';
import { convertChat, type Provider } from './logic';
import { SAMPLE_OPENAI } from './samples';

const LABEL: Record<Provider, string> = { openai: 'OpenAI Chat Completions', anthropic: 'Anthropic Messages', gemini: 'Gemini generateContent' };

export default function ChatFormat() {
  const [s, set, api] = useToolState('chat-format', { text: '', from: 'auto' as Provider | 'auto', to: 'anthropic' as Provider }, ['text']);
  const text = useDebounced(s.text);
  const r = text.trim() ? convertChat(text, s.from, s.to) : null;
  const output = r?.ok ? r.value.output : '';

  return (
    <ToolShell
      onSample={() => set({ text: JSON.stringify(SAMPLE_OPENAI, null, 2), from: 'auto', to: 'anthropic' })}
      onClear={() => set({ text: '' })}
      output={output}
      share={api}
      toolbar={
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <label className="flex items-center gap-1">
            From
            <select className="select" value={s.from} onChange={(e) => set({ from: e.target.value as Provider | 'auto' })}>
              <option value="auto">Auto-detect</option>
              {(Object.keys(LABEL) as Provider[]).map((p) => <option key={p} value={p}>{LABEL[p]}</option>)}
            </select>
          </label>
          <button type="button" className="btn btn-ghost" aria-label="Swap" title="Use output as input" onClick={() => r?.ok && set({ text: output, from: s.to, to: r.value.detected })}>⇄</button>
          <label className="flex items-center gap-1">
            To
            <select className="select" value={s.to} onChange={(e) => set({ to: e.target.value as Provider })}>
              {(Object.keys(LABEL) as Provider[]).map((p) => <option key={p} value={p}>{LABEL[p]}</option>)}
            </select>
          </label>
        </div>
      }
    >
      <SplitPanels>
        <Panel title={`Input${r?.ok && s.from === 'auto' ? ` (detected: ${LABEL[r.value.detected]})` : ''}`}>
          <CodeInput language="json" label="Input messages" value={s.text} onChange={(t) => set({ text: t })} minHeight="26rem" placeholder='[{"role":"user","content":"Hi"}] or {"system":…, "messages":[…]} or {"contents":[…]}' />
          {r && !r.ok && <ErrorBox error={r.error} />}
        </Panel>
        <div className="flex min-w-0 flex-col gap-2">
          {r?.ok && r.value.warnings.length > 0 && (
            <WarningBox>
              <ul className="list-disc pl-4">{r.value.warnings.map((w) => <li key={w}>{w}</li>)}</ul>
            </WarningBox>
          )}
          <OutputPanel title={LABEL[s.to]} value={output} />
        </div>
      </SplitPanels>
      <p className="text-xs text-slate-500 dark:text-slate-400">
        System prompts move to Anthropic’s top-level <code>system</code> and Gemini’s <code>systemInstruction</code>. OpenAI <code>tool</code> messages become
        Anthropic <code>tool_result</code> blocks and Gemini <code>functionResponse</code> parts. Gemini has no call IDs, so IDs are generated when needed.
      </p>
    </ToolShell>
  );
}
