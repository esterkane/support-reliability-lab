/**
 * Tiny in-memory read-through cache used to demonstrate cache-status behavior
 * (the lab analog of Vercel's `x-vercel-cache`). The status it returns is the
 * teaching tool: a request is a MISS the first time a key is seen and a HIT
 * afterward. Whether a HIT is *stale* is decided by the caller comparing the
 * served version to the current one — which only goes wrong when the cache key
 * omits a dimension it should include (the cache-regression bug).
 */

export type CacheStatus = "HIT" | "MISS";

const store = new Map<string, unknown>();

export function getCached<T>(
  key: string,
  loader: () => T,
): { value: T; status: CacheStatus } {
  if (store.has(key)) {
    return { value: store.get(key) as T, status: "HIT" };
  }
  const value = loader();
  store.set(key, value);
  return { value, status: "MISS" };
}

/** Test/dev helper — clears the cache between runs. */
export function clearCache(): void {
  store.clear();
}
