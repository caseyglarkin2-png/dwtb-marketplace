// In-memory stale-while-revalidate cache for Railway API responses.
// Reduces redundant calls; serves stale data when Railway is briefly down.

interface CacheEntry<T> {
  data: T;
  fetchedAt: number;
  freshUntil: number;
  staleUntil: number;
}

const store = new Map<string, CacheEntry<unknown>>();

interface CacheConfig {
  freshMs: number;
  staleMs: number;
}

export const CACHE_CONFIGS: Record<string, CacheConfig> = {
  slots: { freshMs: 30_000, staleMs: 300_000 },    // 30s fresh, 5min stale
  stats: { freshMs: 60_000, staleMs: 600_000 },    // 60s fresh, 10min stale
  pipeline: { freshMs: 60_000, staleMs: 600_000 },
  leads: { freshMs: 60_000, staleMs: 600_000 },
};

export type CacheSource = "live" | "cached" | "fallback";

export interface CachedResult<T> {
  data: T;
  source: CacheSource;
}

export async function cachedFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  config?: CacheConfig,
): Promise<CachedResult<T>> {
  const cfg = config || CACHE_CONFIGS[key] || { freshMs: 30_000, staleMs: 300_000 };
  const now = Date.now();
  const entry = store.get(key) as CacheEntry<T> | undefined;

  // Fresh — return immediately
  if (entry && now < entry.freshUntil) {
    return { data: entry.data, source: "cached" };
  }

  // Stale — try refresh, fall back to stale
  if (entry && now < entry.staleUntil) {
    try {
      const data = await fetcher();
      set(key, data, cfg);
      return { data, source: "live" };
    } catch {
      return { data: entry.data, source: "cached" };
    }
  }

  // Expired or missing — must fetch
  const data = await fetcher();
  set(key, data, cfg);
  return { data, source: "live" };
}

function set<T>(key: string, data: T, cfg: CacheConfig) {
  const now = Date.now();
  store.set(key, {
    data,
    fetchedAt: now,
    freshUntil: now + cfg.freshMs,
    staleUntil: now + cfg.staleMs,
  });
}

export function invalidateCache(key?: string) {
  if (key) {
    store.delete(key);
  } else {
    store.clear();
  }
}
