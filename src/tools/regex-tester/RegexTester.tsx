import { ToolShell } from '@/components/ToolShell';
import { Panel, SplitPanels } from '@/components/Panels';
import { ErrorBox, WarningBox } from '@/components/ErrorBox';
import { OutputPanel } from '@/components/OutputPanel';
import { useToolState } from '@/lib/useToolState';
import { useDebounced } from '@/lib/useDebounced';
import { CHEATSHEET, FLAGS, groupNames, segments } from './logic';
import { useRegexWorker } from './useRegexWorker';

const SAMPLE = {
  pattern: '(?<user>[\\w.+-]+)@(?<domain>[\\w-]+\\.[\\w.]+)',
  flags: 'gi',
  text: 'Contact ada.lovelace@example.com or grace+ops@navy.mil.\nInvalid: bob@, @nowhere.com\nSupport: SUPPORT@devkit.local',
  replacement: '$<user> at $<domain>',
};
const HL = ['bg-sky-200 dark:bg-sky-800', 'bg-amber-200 dark:bg-amber-800'];

export default function RegexTester() {
  const [s, set, api] = useToolState('regex-tester', { pattern: '', flags: 'g', text: '', replacement: '', replaceMode: false }, ['pattern', 'text', 'replacement']);
  const pattern = useDebounced(s.pattern, 150);
  const text = useDebounced(s.text, 150);
  const replacement = useDebounced(s.replacement, 150);
  const state = useRegexWorker(pattern, s.flags, text, s.replaceMode ? replacement : null);
  const result = state.status === 'done' && state.result.ok ? state.result.value : null;
  const error = state.status === 'done' && !state.result.ok ? state.result.error : null;
  const matches = result?.matches ?? [];
  const names = groupNames(pattern);
  const toggleFlag = (f: string) => set({ flags: FLAGS.filter((x) => (x === f ? !s.flags.includes(f) : s.flags.includes(x))).join('') });
  const output = s.replaceMode ? (result?.replaced ?? '') : matches.map((m) => m.text).join('\n');

  return (
    <ToolShell onSample={() => set({ ...SAMPLE })} onClear={() => set({ pattern: '', text: '', replacement: '' })} output={output} share={api}>
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex min-w-0 flex-1 items-center rounded-md border border-slate-300 bg-white font-mono text-sm dark:border-slate-700 dark:bg-slate-900">
            <span className="pl-3 text-slate-400">/</span>
            <input
              aria-label="Pattern"
              spellCheck={false}
              className="min-w-0 flex-1 bg-transparent px-1 py-2 outline-none"
              value={s.pattern}
              placeholder="pattern"
              onChange={(e) => set({ pattern: e.target.value })}
            />
            <span className="pr-3 text-slate-400">/{s.flags}</span>
          </label>
          <fieldset className="flex gap-1" aria-label="Flags">
            {FLAGS.map((f) => (
              <label key={f} className={`btn btn-sm cursor-pointer font-mono ${s.flags.includes(f) ? 'btn-primary' : ''}`} title={{ g: 'global', i: 'ignore case', m: 'multiline', s: 'dotAll', u: 'unicode', y: 'sticky' }[f]}>
                <input type="checkbox" className="sr-only" checked={s.flags.includes(f)} onChange={() => toggleFlag(f)} />
                {f}
              </label>
            ))}
          </fieldset>
        </div>
        {error && <ErrorBox error={error} />}
        {state.status === 'timeout' && <WarningBox>The pattern took too long (over 1.5 s) and was stopped. It may backtrack catastrophically — try making quantifiers more specific.</WarningBox>}
      </div>

      <SplitPanels>
        <Panel title="Test text">
          <textarea aria-label="Test text" spellCheck={false} className="code-box min-h-48 w-full resize-y" value={s.text} onChange={(e) => set({ text: e.target.value })} placeholder="Text to test against…" />
          <div className="code-box min-h-24 max-h-80 overflow-auto whitespace-pre-wrap break-words" aria-label="Highlighted matches">
            {segments(s.text === text ? text : s.text, s.text === text ? matches : []).map((seg, i) =>
              seg.match === null ? <span key={i}>{seg.text}</span> : <mark key={i} className={`${HL[seg.match % 2]} rounded-sm text-inherit`}>{seg.text}</mark>,
            )}
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={s.replaceMode} onChange={(e) => set({ replaceMode: e.target.checked })} />
            Replace mode
          </label>
          {s.replaceMode && (
            <>
              <input aria-label="Replacement" spellCheck={false} className="input font-mono" value={s.replacement} placeholder="Replacement ($1, $<name>, $&)" onChange={(e) => set({ replacement: e.target.value })} />
              <OutputPanel title="Replace preview" value={result?.replaced ?? ''} testId="replace-output" />
            </>
          )}
        </Panel>

        <Panel title={`Matches (${matches.length}${result?.truncated ? '+' : ''})`}>
          <div data-testid="output" className="flex max-h-[28rem] flex-col gap-2 overflow-auto">
            {matches.length === 0 && <p className="text-sm text-slate-500">{s.pattern ? 'No matches.' : 'Enter a pattern.'}</p>}
            {matches.map((m, i) => (
              <div key={i} className="rounded-md border border-slate-200 p-2 text-sm dark:border-slate-800">
                <div className="flex justify-between gap-2">
                  <code className="break-all font-mono">{m.text || <em className="text-slate-400">(empty)</em>}</code>
                  <span className="shrink-0 text-xs text-slate-500">#{i + 1} · {m.index}–{m.end}</span>
                </div>
                {m.groups.length > 0 && (
                  <table className="mt-1 w-full font-mono text-xs">
                    <tbody>
                      {m.groups.map((g, gi) => {
                        const name = names[gi];
                        return (
                          <tr key={gi}>
                            <td className="w-24 pr-2 text-slate-500">${gi + 1}{name ? ` <${name}>` : ''}</td>
                            <td className="break-all">{g ?? <em className="text-slate-400">undefined</em>}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            ))}
          </div>
          <details className="rounded-md border border-slate-200 p-2 text-sm dark:border-slate-800">
            <summary className="cursor-pointer font-medium">Cheat sheet</summary>
            <table className="mt-2 w-full text-xs">
              <tbody>
                {CHEATSHEET.map(([k, v]) => (
                  <tr key={k}>
                    <td className="py-0.5 pr-3 font-mono text-sky-700 dark:text-sky-300">{k}</td>
                    <td>{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        </Panel>
      </SplitPanels>
    </ToolShell>
  );
}
