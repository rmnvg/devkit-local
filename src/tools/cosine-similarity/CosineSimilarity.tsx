import { ToolShell } from '@/components/ToolShell';
import { Panel, SplitPanels } from '@/components/Panels';
import { ErrorBox, WarningBox } from '@/components/ErrorBox';
import { Stat } from '@/components/ModelSelect';
import { useToolState } from '@/lib/useToolState';
import { useDebounced } from '@/lib/useDebounced';
import { describeCosine, parseVector, similarity } from './logic';

const fmt = (n: number | null, d = 6) => (n == null ? '—' : Number(n.toFixed(d)).toString());

function sample(seed: number, dims = 16): string {
  let s = seed;
  const v = Array.from({ length: dims }, () => ((s = (s * 9301 + 49297) % 233280) / 233280) * 2 - 1);
  const n = Math.hypot(...v);
  return JSON.stringify(v.map((x) => Number((x / n).toFixed(5))));
}

export default function CosineSimilarity() {
  const [s, set, api] = useToolState('cosine-similarity', { a: '', b: '' }, ['a', 'b']);
  const a = useDebounced(s.a);
  const b = useDebounced(s.b);
  const pa = a.trim() ? parseVector(a, 'Vector A') : null;
  const pb = b.trim() ? parseVector(b, 'Vector B') : null;
  const r = pa?.ok && pb?.ok ? similarity(pa.value, pb.value) : null;
  const v = r?.ok ? r.value : null;
  const output = v ? `cosine=${fmt(v.cosine)} dot=${fmt(v.dot)} |A|=${fmt(v.normA)} |B|=${fmt(v.normB)} euclidean=${fmt(v.euclidean)} dims=${v.dimensions}` : '';

  return (
    <ToolShell onSample={() => set({ a: sample(7), b: sample(11) })} onClear={() => set({ a: '', b: '' })} output={output} share={api}>
      <SplitPanels>
        <Panel title="Vector A">
          <textarea aria-label="Vector A" spellCheck={false} className="code-box min-h-40 w-full resize-y" value={s.a} placeholder="[0.12, -0.03, …] or comma/space-separated" onChange={(e) => set({ a: e.target.value })} />
          {pa && !pa.ok && <ErrorBox error={pa.error} />}
        </Panel>
        <Panel title="Vector B">
          <textarea aria-label="Vector B" spellCheck={false} className="code-box min-h-40 w-full resize-y" value={s.b} placeholder="[0.10, 0.01, …]" onChange={(e) => set({ b: e.target.value })} />
          {pb && !pb.ok && <ErrorBox error={pb.error} />}
        </Panel>
      </SplitPanels>
      {r && !r.ok && <ErrorBox error={r.error} />}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        <Stat label="Cosine similarity" value={fmt(v?.cosine ?? null)} testId="output" />
        <Stat label="Angle" value={v?.angleDeg == null ? '—' : `${v.angleDeg.toFixed(2)}°`} />
        <Stat label="Dot product" value={fmt(v?.dot ?? null)} />
        <Stat label="‖A‖" value={fmt(v?.normA ?? null)} />
        <Stat label="‖B‖" value={fmt(v?.normB ?? null)} />
        <Stat label="Euclidean distance" value={fmt(v?.euclidean ?? null)} />
      </div>
      {v && (
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {v.dimensions.toLocaleString()} dimensions.{' '}
          {v.cosine != null && <>Interpretation: <strong>{describeCosine(v.cosine)}</strong>. </>}
          {v.normalized && 'Both vectors are unit length, so cosine similarity equals the dot product.'}
        </p>
      )}
      {v && v.cosine == null && <WarningBox>One of the vectors is all zeros, so cosine similarity is undefined.</WarningBox>}
    </ToolShell>
  );
}
