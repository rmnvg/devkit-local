import type { ReactNode } from 'react';
import { CopyButton } from './CopyButton';
import { Panel } from './Panels';

/** Read-only monospace output with a copy button. */
export function OutputPanel({
  title = 'Output',
  value,
  placeholder = 'Output appears here.',
  actions,
  testId = 'output',
}: {
  title?: string;
  value: string;
  placeholder?: string;
  actions?: ReactNode;
  testId?: string;
}) {
  return (
    <Panel
      title={title}
      actions={
        <>
          {actions}
          <CopyButton text={value} />
        </>
      }
    >
      <pre
        data-testid={testId}
        tabIndex={0}
        className="code-box min-h-64 max-h-[70vh] overflow-auto whitespace-pre-wrap break-words"
      >
        {value || <span className="text-slate-400 dark:text-slate-500">{placeholder}</span>}
      </pre>
    </Panel>
  );
}
