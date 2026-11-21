import { ToolShell } from '@/components/ToolShell';
import { Panel, SplitPanels } from '@/components/Panels';
import { OutputPanel } from '@/components/OutputPanel';
import { ErrorBox } from '@/components/ErrorBox';
import { Tabs } from '@/components/Tabs';
import { useToolState } from '@/lib/useToolState';
import { decodeFully, encode, type Mode } from './logic';

export default function UrlEncode() {
  const [s, set, api] = useToolState('url-encode', { text: '', dir: 'encode' as 'encode' | 'decode', mode: 'component' as Mode }, ['text']);
  const r = s.text ? (s.dir === 'encode' ? encode(s.text, s.mode) : decodeFully(s.text, s.mode)) : null;
  const output = r?.ok ? (typeof r.value === 'string' ? r.value : r.value.value) : '';
  const rounds = r?.ok && typeof r.value !== 'string' ? r.value.rounds : 0;
  return (
    <ToolShell
      onSample={() => set({ text: s.dir === 'encode' ? 'https://example.com/search?q=café & crème&lang=fr' : 'q%3Dcaf%25C3%25A9%2520%2526%2520cr%25C3%25A8me' })}
      onClear={() => set({ text: '' })}
      output={output}
      share={api}
      toolbar={
        <>
          <Tabs label="Direction" value={s.dir} onChange={(dir) => set({ dir, text: output || s.text })} options={[{ value: 'encode', label: 'Encode' }, { value: 'decode', label: 'Decode' }]} />
          <label className="flex items-center gap-2 text-sm">
            Mode
            <select className="select" value={s.mode} onChange={(e) => set({ mode: e.target.value as Mode })}>
              <option value="component">Component (encodeURIComponent)</option>
              <option value="uri">Full URI (encodeURI)</option>
              <option value="form">Form data (+ for spaces)</option>
            </select>
          </label>
        </>
      }
    >
      <SplitPanels>
        <Panel title="Input">
          <textarea aria-label="Input" spellCheck={false} className="code-box min-h-48 w-full resize-y" value={s.text} onChange={(e) => set({ text: e.target.value })} />
          {r && !r.ok && <ErrorBox error={r.error} />}
          {rounds > 1 && <p className="text-sm text-amber-700 dark:text-amber-300">Input was encoded {rounds} times; decoded fully.</p>}
        </Panel>
        <OutputPanel value={output} />
      </SplitPanels>
    </ToolShell>
  );
}
