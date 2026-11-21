import { useState } from 'react';
import { toPath, summarize } from '@/tools/json-formatter/logic';
import { useCopy } from './CopyButton';

const PAGE = 200;

/** Collapsible JSON tree. Click a key to copy its JSONPath. */
export function JsonTree({ value }: { value: unknown }) {
  return (
    <div className="code-box max-h-[70vh] overflow-auto" role="tree" aria-label="JSON tree">
      <Node name={null} value={value} path={[]} depth={0} />
    </div>
  );
}

function Node({ name, value, path, depth }: { name: string | number | null; value: unknown; path: (string | number)[]; depth: number }) {
  const [open, setOpen] = useState(depth < 2);
  const [limit, setLimit] = useState(PAGE);
  const copy = useCopy();
  const isObj = value !== null && typeof value === 'object';
  const entries: [string | number, unknown][] = isObj
    ? Array.isArray(value) ? value.map((v, i) => [i, v]) : Object.entries(value as object)
    : [];

  const label =
    name === null ? null : (
      <button
        type="button"
        title={`Copy path ${toPath(path)}`}
        onClick={() => void copy(toPath(path), `Copied ${toPath(path)}`)}
        className="text-violet-700 hover:underline dark:text-violet-300"
      >
        {typeof name === 'number' ? name : JSON.stringify(name)}
      </button>
    );

  if (!isObj) {
    return (
      <div role="treeitem" style={{ paddingLeft: depth ? 16 : 0 }}>
        {label}{label && <span className="text-slate-400">: </span>}<Primitive value={value} />
      </div>
    );
  }
  return (
    <div role="treeitem" aria-expanded={open} style={{ paddingLeft: depth ? 16 : 0 }}>
      <button type="button" onClick={() => setOpen((o) => !o)} aria-label={open ? 'Collapse' : 'Expand'} className="mr-1 inline-block w-4 text-slate-500">
        {open ? '▾' : '▸'}
      </button>
      {label}{label && <span className="text-slate-400">: </span>}
      <span className="text-slate-500">{summarize(value)}</span>
      {open && (
        <div role="group">
          {entries.slice(0, limit).map(([k, v]) => (
            <Node key={k} name={k} value={v} path={[...path, k]} depth={depth + 1} />
          ))}
          {entries.length > limit && (
            <button type="button" className="ml-4 text-xs text-sky-600 underline" onClick={() => setLimit((l) => l + PAGE)}>
              Show {Math.min(PAGE, entries.length - limit)} more of {entries.length - limit}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function Primitive({ value }: { value: unknown }) {
  if (typeof value === 'string') return <span className="text-emerald-700 dark:text-emerald-300">{JSON.stringify(value)}</span>;
  if (typeof value === 'number') return <span className="text-sky-700 dark:text-sky-300">{String(value)}</span>;
  if (typeof value === 'boolean') return <span className="text-amber-700 dark:text-amber-300">{String(value)}</span>;
  return <span className="text-slate-500">null</span>;
}
