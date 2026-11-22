import { useEffect } from 'react';
import type { PageSeo } from './seo';

function upsertMeta(attr: 'name' | 'property', key: string, content: string) {
  let m = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!m) {
    m = document.createElement('meta');
    m.setAttribute(attr, key);
    document.head.appendChild(m);
  }
  m.content = content;
}

/** Keep <head> in sync during client-side navigation (prerendered HTML sets the same values). */
export function useSeo({ title, description, path, noindex }: PageSeo) {
  useEffect(() => {
    document.title = title;
    const url = window.location.origin + path;
    upsertMeta('name', 'description', description);
    upsertMeta('name', 'robots', noindex ? 'noindex, follow' : 'index, follow');
    upsertMeta('property', 'og:title', title);
    upsertMeta('property', 'og:description', description);
    upsertMeta('property', 'og:url', url);
    upsertMeta('name', 'twitter:title', title);
    upsertMeta('name', 'twitter:description', description);
    let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (noindex) {
      link?.remove();
      return;
    }
    if (!link) {
      link = document.createElement('link');
      link.rel = 'canonical';
      document.head.appendChild(link);
    }
    link.href = url;
  }, [title, description, path, noindex]);
}
