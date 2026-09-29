/**
 * A small in-memory cache with a time-to-live and a size cap (oldest entries
 * are evicted first). Used by the price proxy so repeated requests for the
 * same symbol do not hit the upstream source again.
 */

export interface TtlCache<V> {
  get(key: string): V | undefined;
  set(key: string, value: V): void;
}

interface TtlCacheOptions {
  ttlMs: number;
  maxEntries: number;
  now?: () => number;
}

export function createTtlCache<V>({ ttlMs, maxEntries, now = Date.now }: TtlCacheOptions): TtlCache<V> {
  const entries = new Map<string, { value: V; expiresAt: number }>();
  return {
    get(key) {
      const entry = entries.get(key);
      if (!entry) return undefined;
      if (entry.expiresAt <= now()) {
        entries.delete(key);
        return undefined;
      }
      return entry.value;
    },
    set(key, value) {
      entries.delete(key);
      entries.set(key, { value, expiresAt: now() + ttlMs });
      while (entries.size > maxEntries) {
        const oldest = entries.keys().next().value as string;
        entries.delete(oldest);
      }
    },
  };
}
