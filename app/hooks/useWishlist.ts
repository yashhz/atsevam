import {useCallback, useSyncExternalStore} from 'react';

const STORAGE_KEY = 'av_wishlist';
const listeners = new Set<() => void>();
let cache: string[] | null = null;
const EMPTY: string[] = [];

function read(): string[] {
  if (cache) return cache;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    cache = Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string') : [];
  } catch {
    // storage blocked (private mode / in-app browser): keep it in memory only
    cache = [];
  }
  return cache;
}

function write(next: string[]) {
  cache = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* ignore — wishlist still works for this visit */
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
      cache = null; // another tab changed it
      listener();
    }
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', onStorage);
  };
}

/**
 * Wishlist persisted in the browser (no account needed). Hearts survive page
 * reloads and stay in sync across every card on the page and other tabs.
 * Server render and first client render both see an empty list, so hydration
 * always matches.
 */
export function useWishlist(handle: string) {
  const items = useSyncExternalStore(subscribe, read, () => EMPTY);
  const active = items.includes(handle);

  const toggle = useCallback(() => {
    const current = read();
    write(
      current.includes(handle)
        ? current.filter((h) => h !== handle)
        : [...current, handle],
    );
  }, [handle]);

  return {active, toggle, count: items.length};
}
