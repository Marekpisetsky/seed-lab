/**
 * A tiny observable store backed by localStorage, shaped for React's
 * `useSyncExternalStore`: `get` returns a stable reference until the value
 * changes, `subscribe` notifies on writes from this tab and on `storage`
 * events from other tabs.
 *
 * The in-memory copy is the source of truth for the running page, so the app
 * keeps working for the session even when localStorage is blocked or full.
 */

import { getBrowserStorage, readValue, writeValue, type KeyValueStorage, type Parser } from "./storage";

export type Updater<T> = T | ((previous: T) => T);

export interface PersistentStore<T> {
  get(): T;
  /** What the server renders (and the client hydrates with): the defaults. */
  getServerSnapshot(): T;
  /** Updates the value; returns `false` if it could not be saved (it stays in memory). */
  set(next: Updater<T>): boolean;
  subscribe(listener: () => void): () => void;
}

interface StoreOptions<T> {
  key: string;
  parse: Parser<T>;
  fallback: T;
  /** Injected for tests; defaults to `window.localStorage` when available. */
  storage?: () => KeyValueStorage | null;
}

export function createPersistentStore<T>({
  key,
  parse,
  fallback,
  storage = getBrowserStorage,
}: StoreOptions<T>): PersistentStore<T> {
  let cache: { value: T } | null = null;
  const listeners = new Set<() => void>();

  const get = (): T => {
    cache ??= { value: readValue(storage(), key, parse, fallback) };
    return cache.value;
  };

  const set = (next: Updater<T>): boolean => {
    const value = typeof next === "function" ? (next as (previous: T) => T)(get()) : next;
    cache = { value };
    // A failed write is not fatal: the value stays in memory for this session.
    const saved = writeValue(storage(), key, value);
    listeners.forEach((listener) => listener());
    return saved;
  };

  const subscribe = (listener: () => void): (() => void) => {
    listeners.add(listener);
    const onStorage = (event: StorageEvent) => {
      if (event.key === key || event.key === null) {
        cache = null;
        listener();
      }
    };
    if (typeof window !== "undefined") window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(listener);
      if (typeof window !== "undefined") window.removeEventListener("storage", onStorage);
    };
  };

  return { get, getServerSnapshot: () => fallback, set, subscribe };
}
