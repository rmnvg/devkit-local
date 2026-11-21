import { ToolShell } from '@/components/ToolShell';
import { Panel, SplitPanels } from '@/components/Panels';
import { Tabs } from '@/components/Tabs';
import { OutputPanel } from '@/components/OutputPanel';
import { downloadBytes } from '@/components/FileDrop';
import { useToolState } from '@/lib/useToolState';
import { useDebounced } from '@/lib/useDebounced';
import { outline, renderMarkdown, toHtmlDocument } from './logic';

const SAMPLE = `# devkit-local

A **private** toolbox for _AI engineers_. Everything runs in your browser.

## Features

- [x] Token counter
- [x] Cost calculator
- [ ] World domination

| Tool | Category |
|------|----------|
| JWT Decoder | Auth |
| Regex Tester | Text |

> Tip: press \`Ctrl/⌘ K\` to jump to any tool.

\`\`\`ts
const tokens = encode(prompt).length;
\`\`\`
`;

export default function MarkdownPreview() {
  const [s, set, api] = useToolState('markdown-preview', { md: '', gfm: true, breaks: false, view: 'preview' as 'preview' | 'html' }, ['md']);
  const md = useDebounced(s.md, 150);
  const html = md ? renderMarkdown(md, { gfm: s.gfm, breaks: s.breaks }) : '';
  const toc = outline(md);
  return (
    <ToolShell onSample={() => set({ md: SAMPLE })} onClear={() => set({ md: '' })} output={html} share={api}
      toolbar={
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <label className="flex items-center gap-1"><input type="checkbox" checked={s.gfm} onChange={(e) => set({ gfm: e.target.checked })} /> GitHub flavor</label>
          <label className="flex items-center gap-1"><input type="checkbox" checked={s.breaks} onChange={(e) => set({ breaks: e.target.checked })} /> Newlines as &lt;br&gt;</label>
          <button type="button" className="btn" disabled={!html} onClick={() => downloadBytes(new TextEncoder().encode(toHtmlDocument(html, toc[0]?.text ?? 'Document')), 'document.html', 'text/html')}>Download HTML</button>
        </div>
      }>
      <SplitPanels>
        <Panel title="Markdown">
          <textarea aria-label="Markdown" spellCheck={false} className="code-box min-h-[28rem] w-full resize-y" value={s.md} onChange={(e) => set({ md: e.target.value })} placeholder="# Write Markdown…" />
        </Panel>
        <div className="flex min-w-0 flex-col gap-2">
          <Tabs label="Output view" value={s.view} onChange={(view) => set({ view })} options={[{ value: 'preview', label: 'Preview' }, { value: 'html', label: 'HTML' }]} />
          {s.view === 'preview' ? (
            <div data-testid="output" className="md-preview min-h-[28rem] overflow-auto rounded-md border border-slate-300 p-4 dark:border-slate-700"
              // Sanitized with DOMPurify in renderMarkdown()
              dangerouslySetInnerHTML={{ __html: html }} />
          ) : <OutputPanel title="HTML" value={html} />}
          <p className="text-xs text-slate-500 dark:text-slate-400">HTML is sanitized (no scripts or event handlers). Images from other sites are blocked by this site’s privacy policy.</p>
        </div>
      </SplitPanels>
    </ToolShell>
  );
}
