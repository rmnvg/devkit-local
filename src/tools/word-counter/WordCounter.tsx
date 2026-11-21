import { ToolShell } from '@/components/ToolShell';
import { Stat } from '@/components/ModelSelect';
import { TokenBadge } from '@/components/TokenBadge';
import { useToolState } from '@/lib/useToolState';
import { useDebounced } from '@/lib/useDebounced';
import { models } from '@/lib/llm';
import { SAMPLE_PROMPT } from '@/tools/token-counter/samples';
import { countText, formatMinutes } from './logic';

export default function WordCounter() {
  const [s, set, api] = useToolState('word-counter', { text: '' }, ['text']);
  const text = useDebounced(s.text, 100);
  const c = countText(text);
  const output = `Words: ${c.words}\nCharacters: ${c.characters}\nCharacters (no spaces): ${c.charactersNoSpaces}\nSentences: ${c.sentences}\nParagraphs: ${c.paragraphs}\nLines: ${c.lines}\nBytes (UTF-8): ${c.bytes}`;
  return (
    <ToolShell onSample={() => set({ text: SAMPLE_PROMPT })} onClear={() => set({ text: '' })} output={output} share={api}>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
        <Stat label="Words" value={c.words} testId="output" />
        <Stat label="Characters" value={c.characters} />
        <Stat label="No spaces" value={c.charactersNoSpaces} />
        <Stat label="Sentences" value={c.sentences} />
        <Stat label="Paragraphs" value={c.paragraphs} />
        <Stat label="Lines" value={c.lines} />
        <Stat label="Bytes (UTF-8)" value={c.bytes} />
      </div>
      <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-slate-600 dark:text-slate-400">
        <span>Reading time: <strong>{formatMinutes(c.readingMinutes)}</strong></span>
        <span>Speaking time: <strong>{formatMinutes(c.speakingMinutes)}</strong></span>
        <TokenBadge text={text} modelId={models[0]!.id} label="tokens (o200k)" />
      </div>
      <div className="grid gap-4 lg:grid-cols-[3fr_1fr]">
        <textarea aria-label="Text" className="code-box min-h-80 w-full resize-y font-sans" value={s.text} onChange={(e) => set({ text: e.target.value })} placeholder="Type or paste text…" />
        <div>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Top words</h2>
          <ol className="text-sm">
            {c.topWords.map(([w, n]) => <li key={w} className="flex justify-between border-b border-slate-200 py-1 dark:border-slate-800"><span>{w}</span><span className="font-mono">{n}</span></li>)}
          </ol>
        </div>
      </div>
    </ToolShell>
  );
}
