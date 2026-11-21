import type { ReactNode } from 'react';

/** Input/output layout: side by side on desktop, stacked on mobile. */
export function SplitPanels({ children }: { children: ReactNode }) {
  return <div className="grid min-w-0 gap-4 lg:grid-cols-2">{children}</div>;
}

export function Panel({
  title,
  actions,
  children,
  className = '',
}: {
  title: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`flex min-w-0 flex-col gap-2 ${className}`} aria-label={title}>
      <div className="flex min-h-8 flex-wrap items-center justify-between gap-2">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{title}</h2>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {children}
    </section>
  );
}
