import CodeMirror, { EditorView } from '@uiw/react-codemirror';
import { json } from '@codemirror/lang-json';
import { yaml } from '@codemirror/lang-yaml';
import { xml } from '@codemirror/lang-xml';
import { useMemo } from 'react';
import { useTheme } from '@/app/theme';
import type { CodeInputProps } from './CodeInput';

export default function CodeMirrorInput({ value, onChange, language, label, placeholder, minHeight = '16rem', testId = 'input' }: CodeInputProps) {
  const { theme } = useTheme();
  const extensions = useMemo(() => {
    const ext = [EditorView.lineWrapping, EditorView.contentAttributes.of({ 'aria-label': label })];
    if (language === 'json') ext.push(json());
    if (language === 'yaml') ext.push(yaml());
    if (language === 'xml') ext.push(xml());
    return ext;
  }, [language, label]);
  return (
    <div data-testid={testId} className="overflow-hidden rounded-md border border-slate-300 text-sm dark:border-slate-700">
      <CodeMirror
        value={value}
        onChange={onChange}
        extensions={extensions}
        theme={theme}
        placeholder={placeholder}
        minHeight={minHeight}
        maxHeight="70vh"
        basicSetup={{ foldGutter: true, highlightActiveLine: false }}
      />
    </div>
  );
}
