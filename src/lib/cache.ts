// Lightweight in-memory cache for the public site-content bundle.
//
// Why: the site-content endpoint runs 6 queries against the remote Turso DB
// (AWS ap-south-1) on every page load. From the sandbox that's several hundred
// ms of network latency per round-trip, which made the initial page feel slow
// (~4s). This content rarely changes (only when an admin edits services /
// offers / gallery / stylists / settings), so a 60-second TTL cache gives a
// huge speedup for normal browsing while staying fresh enough.
//
// The cache is process-local (fine for a single dev server). Admin mutation
// routes call invalidateSiteContentCache() after writes so the next read sees
// fresh data immediately.

type Entry<T> = { value: T; expiresAt: number }

const TTL_MS = 60 * 1000 // 60 seconds
let siteContentCache: Entry<unknown> | null = null

export function getCachedSiteContent<T>(): T | null {
  if (!siteContentCache) return null
  if (Date.now() > siteContentCache.expiresAt) {
    siteContentCache = null
    return null
  }
  return siteContentCache.value as T
}

export function setCachedSiteContent<T>(value: T): void {
  siteContentCache = { value, expiresAt: Date.now() + TTL_MS }
}

export function invalidateSiteContentCache(): void {
  siteContentCache = null
}
