/**
 * localStorage helpers. Every access is wrapped in try/catch: storage can be unavailable
 * (private mode, blocked site data) and the app must still work without it.
 *
 * Tool *inputs* are only stored when the user enables "Remember inputs" (off by default).
 */
import { useSyncExternalStore } from 'react';

const PREFIX = 'devkit:';
const MAX_RECENTS = 8;

export type Theme = 'dark' | 'light';

export interface Settings {
  rememberInputs: boolean;
}

const DEFAULT_SETTINGS: Settings = { rememberInputs: false };

const listeners = new Set<() => void>();
let version = 0;

function notify() {
  version++;
  listeners.forEach((l) => l());
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getStore(): Storage | null {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null;
  } catch {
    return null;
  }
}

export function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = getStore()?.getItem(PREFIX + key);
    if (raw == null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeJSON(key: string, value: unknown): void {
  try {
    const store = getStore();
    if (!store) return;
    if (value === undefined) store.removeItem(PREFIX + key);
    else store.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    /* quota exceeded or storage blocked: ignore */
  }
  notify();
}

// ---- theme ----
export function getStoredTheme(): Theme | null {
  const t = readJSON<unknown>('theme', null);
  return t === 'dark' || t === 'light' ? t : null;
}
export function setStoredTheme(theme: Theme): void {
  writeJSON('theme', theme);
}

// ---- favorites ----
export function getFavorites(): string[] {
  const f = readJSON<unknown>('favorites', []);
  return Array.isArray(f) ? f.filter((x): x is string => typeof x === 'string') : [];
}
export function isFavorite(slug: string): boolean {
  return getFavorites().includes(slug);
}
export function toggleFavorite(slug: string): boolean {
  const favs = getFavorites();
  const next = favs.includes(slug) ? favs.filter((s) => s !== slug) : [...favs, slug];
  writeJSON('favorites', next);
  return next.includes(slug);
}

// ---- recents ----
export function getRecents(): string[] {
  const r = readJSON<unknown>('recents', []);
  return Array.isArray(r) ? r.filter((x): x is string => typeof x === 'string') : [];
}
export function pushRecent(slug: string): void {
  const next = [slug, ...getRecents().filter((s) => s !== slug)].slice(0, MAX_RECENTS);
  writeJSON('recents', next);
}

// ---- global settings ----
export function getSettings(): Settings {
  const s = readJSON<Partial<Settings>>('settings', {});
  return { ...DEFAULT_SETTINGS, ...(typeof s === 'object' && s ? s : {}) };
}
export function updateSettings(patch: Partial<Settings>): void {
  const next = { ...getSettings(), ...patch };
  writeJSON('settings', next);
  if (!next.rememberInputs) clearAllToolInputs();
}

// ---- per-tool settings and (opt-in) inputs ----
export function getToolSettings<T extends object>(slug: string): Partial<T> {
  const s = readJSON<unknown>(`tool:${slug}:settings`, {});
  return typeof s === 'object' && s ? (s as Partial<T>) : {};
}
export function setToolSettings(slug: string, value: object): void {
  writeJSON(`tool:${slug}:settings`, value);
}
export function getToolInput<T extends object>(slug: string): Partial<T> {
  if (!getSettings().rememberInputs) return {};
  const s = readJSON<unknown>(`tool:${slug}:input`, {});
  return typeof s === 'object' && s ? (s as Partial<T>) : {};
}
export function setToolInput(slug: string, value: object): void {
  if (!getSettings().rememberInputs) return;
  writeJSON(`tool:${slug}:input`, value);
}
function clearAllToolInputs(): void {
  try {
    const store = getStore();
    if (!store) return;
    const keys: string[] = [];
    for (let i = 0; i < store.length; i++) {
      const k = store.key(i);
      if (k && k.startsWith(PREFIX + 'tool:') && k.endsWith(':input')) keys.push(k);
    }
    keys.forEach((k) => store.removeItem(k));
  } catch {
    /* ignore */
  }
}

/** Re-render when anything in storage changes (via these helpers). */
export function useStorage<T>(read: () => T): T {
  useSyncExternalStore(subscribe, () => version, () => 0);
  return read();
}
