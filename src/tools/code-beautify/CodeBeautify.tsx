import { useEffect, useState } from 'react';
import { ToolShell } from '@/components/ToolShell';
import { Panel, SplitPanels } from '@/components/Panels';
import { OutputPanel } from '@/components/OutputPanel';
import { ErrorBox } from '@/components/ErrorBox';
import { Tabs } from '@/components/Tabs';
import { useToolState } from '@/lib/useToolState';
import { useDebounced } from '@/lib/useDebounced';
import { beautifyCode, minifyCss, minifyHtml, minifyJs, sizeChange, type Lang, type Result } from './logic';

const SAMPLES: Record<Lang, string> = {
  js: `const total=(items,tax=0.2)=>{let sum=0;for(const item of items){if(item.qty>0){sum+=item.price*item.qty}}return Math.round(sum*(1+tax)*100)/100};console.log(total([{price:9.99,qty:2},{price:4.5,qty:0}]));`,
  css: `.card{display:flex;gap:1rem;padding:16px 24px;border:1px solid #e2e8f0;border-radius:8px}.card:hover{box-shadow:0 2px 8px rgba(0,0,0,.1)}@media (max-width:600px){.card{flex-direction:column}}`,
  html: `<!doctype html><html><head><title>Demo</title></head><body><nav><ul><li><a href="/">Home</a></li><li><a href="/about">About</a></li></ul></nav><main><h1>Hello</h1><p>Some <strong>text</strong>.</p></main></body></html>`,
};

export default function CodeBeautify() {
  const [s, set, api] = useToolState('code-beautify', { code: '', lang: 'js' as Lang, mode: 'beautify' as 'beautify' | 'minify', indent: 2, useTabs: false }, ['code']);
  const code = useDebounced(s.code, 250);
  const [r, setR] = useState<Result<string>>({ ok: true, value: '' });
  useEffect(() => {
    let cancelled = false;
    if (s.mode === 'beautify') setR(beautifyCode(code, s.lang, { indent: s.indent, useTabs: s.useTabs }));
    else if (s.lang === 'js') void minifyJs(code).then((x) => !cancelled && setR(x));
    else setR({ ok: true, value: s.lang === 'css' ? minifyCss(code) : minifyHtml(code) });
    return () => { cancelled = true; };
  }, [code, s.lang, s.mode, s.indent, s.useTabs]);
  const output = r.ok ? r.value : '';
  return (
    <ToolShell onSample={() => set({ code: SAMPLES[s.lang] })} onClear={() => set({ code: '' })} output={output} share={api}
      toolbar={
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Tabs label="Language" value={s.lang} onChange={(lang) => set({ lang })} options={[{ value: 'js', label: 'JavaScript' }, { value: 'css', label: 'CSS' }, { value: 'html', label: 'HTML' }]} />
          <Tabs label="Mode" value={s.mode} onChange={(mode) => set({ mode })} options={[{ value: 'beautify', label: 'Beautify' }, { value: 'minify', label: 'Minify' }]} />
          {s.mode === 'beautify' && (
            <select aria-label="Indent" className="select" value={s.useTabs ? 'tab' : String(s.indent)} onChange={(e) => (e.target.value === 'tab' ? set({ useTabs: true, indent: 1 }) : set({ useTabs: false, indent: Number(e.target.value) }))}>
              <option value="2">2 spaces</option><option value="4">4 spaces</option><option value="tab">Tabs</option>
            </select>
          )}
        </div>
      }>
      <SplitPanels>
        <Panel title="Input">
          <textarea aria-label="Code input" spellCheck={false} className="code-box min-h-[26rem] w-full resize-y" value={s.code} onChange={(e) => set({ code: e.target.value })} placeholder={`Paste ${s.lang.toUpperCase()}…`} />
          {!r.ok && <ErrorBox error={r.error} />}
        </Panel>
        <div className="flex min-w-0 flex-col gap-2">
          <OutputPanel title={s.mode === 'beautify' ? 'Beautified' : 'Minified'} value={output} />
          {output && <p className="text-sm text-slate-600 dark:text-slate-400">{sizeChange(code, output)}</p>}
        </div>
      </SplitPanels>
    </ToolShell>
  );
}
