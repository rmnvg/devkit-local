import { Link } from 'react-router-dom';
import { SITE_NAME, useDocumentMeta } from '@/lib/useDocumentMeta';

export default function NotFound() {
  useDocumentMeta(`Not found — ${SITE_NAME}`);
  return (
    <div className="mx-auto max-w-xl py-16 text-center">
      <h1 className="mb-2 text-3xl font-semibold">Page not found</h1>
      <p className="mb-6 text-slate-600 dark:text-slate-400">That page or tool doesn’t exist. Try the search (Ctrl/⌘ K).</p>
      <Link to="/" className="btn btn-primary">Back to all tools</Link>
    </div>
  );
}
