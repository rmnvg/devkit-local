import { ToolShell } from '@/components/ToolShell';
import { OutputPanel } from '@/components/OutputPanel';
import { useToolState } from '@/lib/useToolState';
import { generate, type Unit } from './logic';

export default function LoremIpsum() {
  const [s, set, api] = useToolState('lorem-ipsum', { unit: 'paragraphs' as Unit, count: 3, startWithLorem: true, html: false, seed: 1 }, []);
  const text = generate(s);
  return (
    <ToolShell onSample={() => set({ seed: Math.floor(Math.random() * 1e9) })} onClear={() => set({ count: 1 })} output={text} onRun={() => set({ seed: Math.floor(Math.random() * 1e9) })} share={api}>
      <div className="flex flex-wrap items-end gap-3">
        <label className="field-label">How many<input className="input w-24 font-mono" type="number" min={1} value={s.count} onChange={(e) => set({ count: Math.floor(Number(e.target.value)) || 1 })} /></label>
        <label className="field-label">Of
          <select className="select" value={s.unit} onChange={(e) => set({ unit: e.target.value as Unit })}><option value="paragraphs">Paragraphs</option><option value="sentences">Sentences</option><option value="words">Words</option></select>
        </label>
        <label className="flex items-center gap-2 pb-2 text-sm"><input type="checkbox" checked={s.startWithLorem} onChange={(e) => set({ startWithLorem: e.target.checked })} /> Start with “Lorem ipsum…”</label>
        <label className="flex items-center gap-2 pb-2 text-sm"><input type="checkbox" checked={s.html} onChange={(e) => set({ html: e.target.checked })} /> Wrap in &lt;p&gt;</label>
        <button type="button" className="btn" onClick={() => set({ seed: Math.floor(Math.random() * 1e9) })}>Regenerate</button>
      </div>
      <OutputPanel title="Text" value={text} />
    </ToolShell>
  );
}
