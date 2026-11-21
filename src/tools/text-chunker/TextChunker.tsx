import { useEffect, useState } from 'react';
import { ToolShell } from '@/components/ToolShell';
import { Panel, SplitPanels } from '@/components/Panels';
import { ErrorBox } from '@/components/ErrorBox';
import { CopyButton } from '@/components/CopyButton';
import { Stat } from '@/components/ModelSelect';
import { useToolState } from '@/lib/useToolState';
import { useDebounced } from '@/lib/useDebounced';
import { chunkInWorker, type EncodingName } from '@/lib/tokenizer';
import { SAMPLE_PROMPT } from '@/tools/token-counter/samples';
import { parseSeparators, stats, type Chunk, type ChunkMode, type Result } from './logic';

const SAMPLE = `# Refund policy

Refunds are available within 30 days of purchase for monthly plans. Annual plans are refunded pro rata for the unused months. Refunds are issued to the original payment method within 5–10 business days.

## Exceptions

Usage-based charges (API overages, storage) are not refundable. Accounts closed for abuse are not eligible for refunds.

# API keys

API keys can be rotated from Settings → Security. Rotating a key immediately invalidates the old one, so update your deployments first. Each workspace can have up to 20 active keys.

${SAMPLE_PROMPT}`;

export default function TextChunker() {
  const [s, set, api] = useToolState(
    'text-chunker',
    { text: '', mode: 'recursive' as ChunkMode, size: 200, overlap: 20, separators: '\\n\\n\n\\n\n. \n \n', measureTokens: false, encoding: 'o200k_base' as EncodingName },
    ['text'],
  );
  const text = useDebounced(s.text, 300);
  const [result, setResult] = useState<Result<Chunk[]> | null>(null);

  useEffect(() => {
    let cancelled = false;
    chunkInWorker(text, { mode: s.mode, size: s.size, overlap: s.overlap, separators: parseSeparators(s.separators), measureTokens: s.measureTokens }, s.encoding).then(
      (r) => !cancelled && setResult(r),
      (e: unknown) => !cancelled && setResult({ ok: false, error: String(e) }),
    );
    return () => {
      cancelled = true;
    };
  }, [text, s.mode, s.size, s.overlap, s.separators, s.measureTokens, s.encoding]);

  const chunks = result?.ok ? result.value : [];
  const st = stats(chunks);
  const unit = s.mode === 'tokens' || (s.mode === 'recursive' && s.measureTokens) ? 'tokens' : 'characters';
  const output = JSON.stringify(chunks.map((c) => c.text), null, 2);

  return (
    <ToolShell onSample={() => set({ text: SAMPLE })} onClear={() => set({ text: '' })} output={chunks.length ? output : ''} share={api}>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <label className="field-label">
          Split by
          <select className="select" value={s.mode} onChange={(e) => set({ mode: e.target.value as ChunkMode })}>
            <option value="recursive">Separators (recursive)</option>
            <option value="tokens">Tokens</option>
            <option value="characters">Characters</option>
          </select>
        </label>
        <label className="field-label">
          Chunk size ({unit})
          <input className="input font-mono" type="number" min={1} value={s.size} onChange={(e) => set({ size: Math.floor(Number(e.target.value)) || 0 })} />
        </label>
        <label className="field-label">
          Overlap ({unit})
          <input className="input font-mono" type="number" min={0} value={s.overlap} onChange={(e) => set({ overlap: Math.floor(Number(e.target.value)) || 0 })} />
        </label>
        <label className="field-label">
          Tokenizer
          <select className="select" value={s.encoding} onChange={(e) => set({ encoding: e.target.value as EncodingName })}>
            <option value="o200k_base">o200k_base (GPT-4o and newer)</option>
            <option value="cl100k_base">cl100k_base (GPT-4, text-embedding-3)</option>
          </select>
        </label>
        {s.mode === 'recursive' && (
          <label className="flex items-center gap-2 self-end pb-2 text-sm">
            <input type="checkbox" checked={s.measureTokens} onChange={(e) => set({ measureTokens: e.target.checked })} /> Measure size in tokens
          </label>
        )}
      </div>
      {result && !result.ok && <ErrorBox error={result.error} />}

      <SplitPanels>
        <div className="flex min-w-0 flex-col gap-3">
          <Panel title="Text">
            <textarea aria-label="Text to chunk" spellCheck={false} className="code-box min-h-80 w-full resize-y" value={s.text} onChange={(e) => set({ text: e.target.value })} placeholder="Paste a document…" />
          </Panel>
          {s.mode === 'recursive' && (
            <label className="field-label">
              Separators, one per line, tried in order (\n = newline, empty line = split anywhere)
              <textarea className="code-box min-h-24 w-full resize-y" value={s.separators} onChange={(e) => set({ separators: e.target.value })} spellCheck={false} />
            </label>
          )}
        </div>
        <Panel title={`Chunks (${st.count})`}>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Stat label="Chunks" value={st.count} testId="output" />
            <Stat label="Avg tokens" value={st.avgTokens} />
            <Stat label="Min / max tokens" value={`${st.minTokens} / ${st.maxTokens}`} />
            <Stat label="Total tokens" value={st.totalTokens} />
          </div>
          <ol className="flex max-h-[60vh] flex-col gap-2 overflow-auto">
            {chunks.slice(0, 500).map((c) => (
              <li key={c.index} className="rounded-md border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between gap-2 border-b border-slate-200 px-2 py-1 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
                  <span>#{c.index + 1} · {c.chars.toLocaleString()} chars · {c.tokens.toLocaleString()} tokens</span>
                  <CopyButton text={c.text} />
                </div>
                <pre className="whitespace-pre-wrap break-words p-2 font-mono text-[13px]">{c.text}</pre>
              </li>
            ))}
            {chunks.length > 500 && <li className="text-sm text-slate-500 dark:text-slate-400">Showing the first 500 of {chunks.length.toLocaleString()} chunks. “Copy output” copies all of them as JSON.</li>}
          </ol>
        </Panel>
      </SplitPanels>
    </ToolShell>
  );
}
