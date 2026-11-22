import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { tools, getTool } from '@/lib/registry';
import { CATEGORIES, type ToolMeta } from '@/lib/types';
import { getFavorites, getRecents, useStorage } from '@/lib/storage';
import { searchTools } from '@/lib/search';
import { ToolCard } from '@/components/ToolCard';
import { HOME_SEO } from '@/lib/seo';
import { useSeo } from '@/lib/useSeo';

function resolve(slugs: string[]): ToolMeta[] {
  return slugs.map(getTool).filter((t): t is ToolMeta => !!t);
}

export default function Home() {
  useSeo(HOME_SEO);
  const { hash } = useLocation();
  useEffect(() => {
    // category anchors (/#ai) from breadcrumbs
    if (hash.length > 1) document.getElementById(hash.slice(1))?.scrollIntoView();
  }, [hash]);
  const [q, setQ] = useState(() => (typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('q') ?? '' : ''));
  const favs = useStorage(getFavorites);
  const recents = useStorage(getRecents);
  const favTools = resolve(favs);
  const recentTools = resolve(recents);
  const results = q.trim() ? searchTools(tools, q) : null;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8">
      <section className="flex flex-col gap-3 pt-4">
        <h1 className="text-3xl font-semibold tracking-tight">The dev toolbox for AI engineers</h1>
        <p className="max-w-2xl text-slate-600 dark:text-slate-400">
          Token counting, LLM cost comparison and context-window fit, plus everyday tools for JWT, JSON,
          regex and timestamps. <strong className="font-medium text-slate-800 dark:text-slate-200">Everything runs in your browser</strong> — nothing you paste is ever sent anywhere.
        </p>
        <label className="sr-only" htmlFor="home-search">Search tools</label>
        <input
          id="home-search"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search tools…"
          className="input max-w-xl text-base"
          autoComplete="off"
        />
      </section>

      {results ? (
        <Section title={`Results (${results.length})`}>
          {results.length ? results.map((t) => <ToolCard key={t.slug} tool={t} fav={favs.includes(t.slug)} />) : (
            <p className="text-slate-500">No tools match “{q}”.</p>
          )}
        </Section>
      ) : (
        <>
          {favTools.length > 0 && (
            <Section title="Favorites">
              {favTools.map((t) => <ToolCard key={t.slug} tool={t} fav />)}
            </Section>
          )}
          {recentTools.length > 0 && (
            <Section title="Recent">
              {recentTools.map((t) => <ToolCard key={t.slug} tool={t} fav={favs.includes(t.slug)} />)}
            </Section>
          )}
          {CATEGORIES.map((c) => {
            const items = tools.filter((t) => t.category === c.id);
            if (!items.length) return null;
            return (
              <Section key={c.id} id={c.id} title={c.label}>
                {items.map((t) => <ToolCard key={t.slug} tool={t} fav={favs.includes(t.slug)} />)}
              </Section>
            );
          })}
        </>
      )}
    </div>
  );
}

function Section({ title, children, id }: { title: string; children: React.ReactNode; id?: string }) {
  return (
    <section aria-label={title} id={id} className="scroll-mt-20">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{title}</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
    </section>
  );
}
