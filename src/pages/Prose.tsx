import type { ReactNode } from 'react';

export function Prose({ children }: { children: ReactNode }) {
  return (
    <article className="mx-auto flex max-w-3xl flex-col gap-4 leading-relaxed text-slate-700 dark:text-slate-300 [&_a]:text-sky-700 [&_a]:underline dark:[&_a]:text-sky-300 [&_h1]:text-3xl [&_h1]:font-semibold [&_h1]:text-slate-900 dark:[&_h1]:text-slate-100 [&_h2]:mt-4 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-slate-900 dark:[&_h2]:text-slate-100 [&_li]:ml-5 [&_li]:list-disc">
      {children}
    </article>
  );
}
