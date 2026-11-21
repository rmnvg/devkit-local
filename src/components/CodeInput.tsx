import { lazy, Suspense } from 'react';

export type CodeLang = 'json' | 'yaml' | 'xml' | 'text';

export interface CodeInputProps {
  value: string;
  onChange: (v: string) => void;
  language?: CodeLang;
  label: string;
  placeholder?: string;
  minHeight?: string;
  testId?: string;
}

const CodeMirrorInput = lazy(() => import('./CodeMirrorInput'));

/**
 * Code editor input. CodeMirror is lazy-loaded; a plain textarea stands in while it loads.
 * Plain `text` uses a textarea (fast for very large prose input).
 */
export function CodeInput(props: CodeInputProps) {
  if (props.language === 'text' || !props.language) return <PlainTextarea {...props} />;
  return (
    <Suspense fallback={<PlainTextarea {...props} />}>
      <CodeMirrorInput {...props} />
    </Suspense>
  );
}

export function PlainTextarea({ value, onChange, label, placeholder, minHeight = '16rem', testId = 'input' }: CodeInputProps) {
  return (
    <textarea
      aria-label={label}
      data-testid={testId}
      spellCheck={false}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      style={{ minHeight }}
      className="code-box w-full resize-y"
    />
  );
}
