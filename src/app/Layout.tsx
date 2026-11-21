import { Suspense, useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { tools } from '@/lib/registry';
import { CATEGORIES } from '@/lib/types';
import { getSettings, readJSON, updateSettings, useStorage, writeJSON } from '@/lib/storage';
import { useTheme } from './theme';
import { CommandPalette } from './CommandPalette';
import { ShortcutsDialog } from './ShortcutsDialog';

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);

function isTypingTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  return el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName);
}

export function Layout() {
  const { theme, toggle } = useTheme();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const collapsed = useStorage(() => readJSON<boolean>('sidebarCollapsed', false));
  const settings = useStorage(getSettings);
  const location = useLocation();

  useEffect(() => setMobileNav(false), [location.pathname]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      } else if (e.key === '?' && !isTypingTarget(e.target) && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setHelpOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-sky-700 focus:px-3 focus:py-1 focus:text-white">
        Skip to content
      </a>
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
        <button
          type="button"
          className="btn btn-ghost lg:hidden"
          aria-label="Toggle navigation"
          aria-expanded={mobileNav}
          onClick={() => setMobileNav((o) => !o)}
        >
          ☰
        </button>
        <button
          type="button"
          className="btn btn-ghost hidden lg:inline-flex"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-expanded={!collapsed}
          onClick={() => writeJSON('sidebarCollapsed', !collapsed)}
        >
          ☰
        </button>
        <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <img src="/icons/icon.svg" alt="" width={24} height={24} />
          <span className="hidden sm:inline">devkit-local</span>
          <span className="sr-only sm:hidden">devkit-local home</span>
        </Link>
        <button
          type="button"
          onClick={() => setPaletteOpen(true)}
          className="ml-auto flex w-full max-w-xs items-center justify-between gap-2 rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-500 hover:border-slate-400 dark:border-slate-700 dark:text-slate-400 sm:ml-6"
        >
          <span>Search tools…</span>
          <kbd className="kbd">{isMac ? '⌘' : 'Ctrl'} K</kbd>
        </button>
        <Link
          to="/privacy"
          title="Everything runs in your browser"
          className="hidden items-center gap-1 rounded-full border border-emerald-600/40 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 md:flex sm:ml-auto"
        >
          🔒 100% local
        </Link>
        <button type="button" className="btn btn-ghost" aria-label="Keyboard shortcuts" onClick={() => setHelpOpen(true)}>
          ?
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
          onClick={toggle}
        >
          {theme === 'dark' ? '☀' : '☾'}
        </button>
      </header>

      <div className="flex flex-1">
        <nav
          aria-label="Tools"
          className={`${mobileNav ? 'fixed inset-x-0 bottom-0 top-14 z-20 block' : 'hidden'} ${
            collapsed ? 'lg:hidden' : 'lg:block'
          } w-full overflow-y-auto border-r border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950 lg:sticky lg:top-14 lg:h-[calc(100vh-3.5rem)] lg:w-60 lg:shrink-0`}
        >
          {CATEGORIES.map((c) => {
            const items = tools.filter((t) => t.category === c.id);
            if (!items.length) return null;
            return (
              <div key={c.id} className="mb-4">
                <h2 className="mb-1 px-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{c.label}</h2>
                <ul>
                  {items.map((t) => (
                    <li key={t.slug}>
                      <NavLink
                        to={`/tools/${t.slug}`}
                        className={({ isActive }) =>
                          `block rounded px-2 py-1 text-sm ${
                            isActive
                              ? 'bg-sky-100 font-medium text-sky-900 dark:bg-sky-950 dark:text-sky-200'
                              : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900'
                          }`
                        }
                      >
                        {t.name}
                        {t.isNew && <span className="ml-1.5 rounded bg-sky-700 px-1 text-[10px] font-semibold uppercase text-white">new</span>}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
          <div className="mt-6 border-t border-slate-200 pt-3 text-sm dark:border-slate-800">
            <label className="flex items-start gap-2 px-2 text-slate-600 dark:text-slate-400">
              <input
                type="checkbox"
                className="mt-1"
                checked={settings.rememberInputs}
                onChange={(e) => updateSettings({ rememberInputs: e.target.checked })}
              />
              <span>
                Remember inputs
                <span className="block text-xs text-slate-500">Saved in this browser only. Off by default.</span>
              </span>
            </label>
            <div className="mt-3 flex gap-3 px-2 text-xs text-slate-500">
              <Link to="/privacy" className="hover:underline">Privacy</Link>
              <Link to="/about" className="hover:underline">About</Link>
            </div>
          </div>
        </nav>

        <main id="main" className="min-w-0 flex-1 p-4 sm:p-6">
          <Suspense fallback={<div aria-busy="true" className="p-8 text-slate-500">Loading…</div>}>
            <Outlet />
          </Suspense>
        </main>
      </div>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
      <ShortcutsDialog open={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  );
}
