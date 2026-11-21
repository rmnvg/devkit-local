import { useNavigate } from 'react-router-dom';
import { ToolShell } from '@/components/ToolShell';
import { Panel, SplitPanels } from '@/components/Panels';
import { PlainTextarea } from '@/components/CodeInput';
import { ErrorBox } from '@/components/ErrorBox';
import { EstimateBadge, ModelSelect, Stat } from '@/components/ModelSelect';
import { useToolState } from '@/lib/useToolState';
import { useTokenCount } from '@/lib/tokenizer';
import { estimateTokens, getModel, models } from '@/lib/llm';
import { encodeState } from '@/lib/urlState';
import { textStats, visiblePiece } from './logic';
import { SAMPLE_PROMPT } from './samples';

const COLORS = [
  'bg-sky-200/70 dark:bg-sky-800/60',
  'bg-amber-200/70 dark:bg-amber-800/60',
  'bg-emerald-200/70 dark:bg-emerald-800/60',
  'bg-rose-200/70 dark:bg-rose-800/60',
  'bg-violet-200/70 dark:bg-violet-800/60',
];
const MAX_PIECES = 2000;

export default function TokenCounter() {
  const [s, set, api] = useToolState('token-counter', { text: '', model: models[0]!.id, showTokens: true }, ['text']);
  const navigate = useNavigate();
  const model = getModel(s.model) ?? models[0]!;
  const encoding = model.tokenizer ?? 'o200k_base';
  const tok = useTokenCount(s.text, encoding, model.provider === 'openai' && s.showTokens ? MAX_PIECES : 0);
  const stats = textStats(s.text);
  const base = tok.result?.count ?? 0;
  const tokens = estimateTokens(model, base);
  const exact = model.exactTokenCount;

  const sendToCost = () => {
    const enc = encodeState({ inputTokens: tokens });
    if (enc.ok) navigate(`/tools/llm-cost${enc.hash}`);
  };
  const sendToFit = () => {
    const enc = encodeState({ text: s.text });
    navigate(enc.ok ? `/tools/context-fit${enc.hash}` : '/tools/context-fit');
  };

  return (
    <ToolShell
      onSample={() => set({ text: SAMPLE_PROMPT })}
      onClear={() => set({ text: '' })}
      output={String(tokens)}
      share={api}
      toolbar={
        <>
          <button type="button" className="btn" onClick={sendToCost} disabled={!s.text}>Send to cost calculator →</button>
          <button type="button" className="btn" onClick={sendToFit} disabled={!s.text}>Check context fit →</button>
        </>
      }
    >
      <SplitPanels>
        <Panel title="Text">
          <PlainTextarea label="Text to count" value={s.text} onChange={(text) => set({ text })} placeholder="Paste a prompt, document or conversation…" minHeight="22rem" />
        </Panel>
        <Panel title="Result">
          <ModelSelect value={model.id} onChange={(id) => set({ model: id })} />
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Stat
              label={`Tokens (${model.tokenizer ?? 'estimated'})`}
              value={tokens}
              testId="output"
              extra={!exact && <EstimateBadge provider={model.provider} />}
            />
            <Stat label="Characters" value={stats.characters} />
            <Stat label="Words" value={stats.words} />
            <Stat label="Lines" value={stats.lines} />
          </div>
          {tok.status === 'error' && <ErrorBox error={`Tokenizer failed: ${tok.error}`} />}
          {model.contextWindow && (
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Uses {((tokens / model.contextWindow) * 100).toFixed(2)}% of the {model.contextWindow.toLocaleString()}-token context window.
            </p>
          )}
          {model.provider === 'openai' ? (
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={s.showTokens} onChange={(e) => set({ showTokens: e.target.checked })} />
                Show token boundaries
              </label>
              {s.showTokens && tok.result && tok.result.pieces.length > 0 && (
                <div className="code-box max-h-[50vh] overflow-auto whitespace-pre-wrap break-words" aria-label="Token visualization">
                  {tok.result.pieces.map((p, i) => (
                    <span key={i} className={`${COLORS[i % COLORS.length]} rounded-sm`}>{visiblePiece(p)}</span>
                  ))}
                  {tok.result.truncated && <div className="mt-2 text-xs text-slate-500">Showing the first {MAX_PIECES.toLocaleString()} tokens.</div>}
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-400">Token boundaries are only shown for OpenAI tokenizers.</p>
          )}
        </Panel>
      </SplitPanels>
    </ToolShell>
  );
}
