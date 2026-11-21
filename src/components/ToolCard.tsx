import { Link } from 'react-router-dom';
import type { ToolMeta } from '@/lib/types';

export function ToolCard({ tool, fav }: { tool: ToolMeta; fav?: boolean }) {
  return (
    <Link
      to={`/tools/${tool.slug}`}
      className="group flex flex-col gap-1 rounded-lg border border-slate-200 bg-white p-4 transition hover:border-sky-500 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:hover:border-sky-500"
    >
      <span className="flex items-center gap-2 font-medium group-hover:text-sky-700 dark:group-hover:text-sky-300">
        {tool.name}
        {fav && <span className="text-amber-400" aria-label="favorite">★</span>}
        {tool.isNew && <span className="rounded bg-sky-600 px-1 text-[10px] font-semibold uppercase text-white">new</span>}
      </span>
      <span className="text-sm text-slate-600 dark:text-slate-400">{tool.description}</span>
    </Link>
  );
}
