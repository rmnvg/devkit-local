import { ToolShell } from '@/components/ToolShell';
import { SplitPanels, Panel } from '@/components/Panels';
import { CodeInput } from '@/components/CodeInput';
import { OutputPanel } from '@/components/OutputPanel';
import { useToolState } from '@/lib/useToolState';
import { shout } from './logic';

export default function Hello() {
  const [s, set, api] = useToolState('hello', { text: '' }, ['text']);
  const out = shout(s.text);
  return (
    <ToolShell onSample={() => set({ text: 'hello, world' })} onClear={() => set({ text: '' })} output={out} share={api}>
      <SplitPanels>
        <Panel title="Input">
          <CodeInput label="Input text" value={s.text} onChange={(text) => set({ text })} />
        </Panel>
        <OutputPanel value={out} />
      </SplitPanels>
    </ToolShell>
  );
}
