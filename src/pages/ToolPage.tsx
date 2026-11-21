import { Suspense, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getTool } from '@/lib/registry';
import { pushRecent } from '@/lib/storage';
import { ToolMetaCtx } from '@/components/ToolContext';
import { SITE_NAME, useDocumentMeta } from '@/lib/useDocumentMeta';
import NotFound from './NotFound';

export default function ToolPage() {
  const { slug } = useParams();
  const tool = getTool(slug);
  if (!tool) return <NotFound />;
  return <ToolPageInner key={tool.slug} slug={tool.slug} />;
}

function ToolPageInner({ slug }: { slug: string }) {
  const tool = getTool(slug)!;
  useDocumentMeta(`${tool.name} — ${SITE_NAME}`, tool.description);
  useEffect(() => pushRecent(tool.slug), [tool.slug]);
  const C = tool.component;
  return (
    <ToolMetaCtx.Provider value={tool}>
      <Suspense fallback={<ToolSkeleton />}>
        <C />
      </Suspense>
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
