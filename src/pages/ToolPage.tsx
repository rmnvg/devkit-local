import { Suspense, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getTool, tools } from '@/lib/registry';
import { pushRecent } from '@/lib/storage';
import { ToolMetaCtx } from '@/components/ToolContext';
import { ToolCard } from '@/components/ToolCard';
import { categoryName, relatedTools, toolDescription, toolPath, toolTitle } from '@/lib/seo';
import { useSeo } from '@/lib/useSeo';
import NotFound from './NotFound';

export default function ToolPage() {
  const { slug } = useParams();
  const tool = getTool(slug);
  if (!tool) return <NotFound />;
  return <ToolPageInner key={tool.slug} slug={tool.slug} />;
}

function ToolPageInner({ slug }: { slug: string }) {
  const tool = getTool(slug)!;
  useSeo({ title: toolTitle(tool), description: toolDescription(tool), path: toolPath(tool) });
  useEffect(() => pushRecent(tool.slug), [tool.slug]);
  const C = tool.component;
  const related = relatedTools(tool, tools);
  return (
    <ToolMetaCtx.Provider value={tool}>
      <nav aria-label="Breadcrumb" className="mx-auto mb-3 max-w-7xl text-sm text-slate-500 dark:text-slate-400">
        <ol className="flex flex-wrap items-center gap-1">
          <li><Link to="/" className="hover:underline">All tools</Link></li>
          <li aria-hidden>›</li>
          <li><Link to={`/#${tool.category}`} className="hover:underline">{categoryName(tool.category)}</Link></li>
          <li aria-hidden>›</li>
          <li aria-current="page" className="text-slate-700 dark:text-slate-300">{tool.name}</li>
        </ol>
      </nav>
      <Suspense fallback={<ToolSkeleton />}>
        <C />
      </Suspense>
      {related.length > 0 && (
        <section aria-label="Related tools" className="mx-auto mt-10 max-w-7xl border-t border-slate-200 pt-6 dark:border-slate-800">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Related tools</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((t) => <ToolCard key={t.slug} tool={t} />)}
          </div>
        </section>
      )}
    </ToolMetaCtx.Provider>
  );
}

function ToolSkeleton() {
  return (
    <div className="mx-auto max-w-7xl animate-pulse" role="status" aria-busy="true" aria-label="Loading tool">
      <div className="mb-3 h-8 w-64 rounded bg-slate-200 dark:bg-slate-800" />
      <div className="mb-6 h-4 w-96 max-w-full rounded bg-slate-200 dark:bg-slate-800" />
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="h-64 rounded bg-slate-200 dark:bg-slate-800" />
        <div className="h-64 rounded bg-slate-200 dark:bg-slate-800" />
      </div>
    </div>
  );
}
