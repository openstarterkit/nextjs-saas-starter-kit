/**
 * Minimal fixed-window in-memory rate limiter.
 *
 * Honest caveat: on serverless every instance has its own memory, so treat
 * this as a speed bump, not a wall (bcrypt's cost is the real brute-force
 * brake). If you need hard guarantees at scale, swap in a shared store
 * (e.g. Upstash Redis) behind this same function signature.
 */

const WINDOW_MS = 15 * 60 * 1000
const MAX_ATTEMPTS = 5
// Keep the map bounded: purge expired entries once it grows past this.
const PURGE_THRESHOLD = 1000

const hits = new Map<string, { count: number; resetAt: number }>()

export function checkRateLimit(key: string, max = MAX_ATTEMPTS, windowMs = WINDOW_MS): boolean {
  const now = Date.now()

  if (hits.size > PURGE_THRESHOLD) {
    for (const [k, v] of hits) if (v.resetAt <= now) hits.delete(k)
  }

  const entry = hits.get(key)
  if (!entry || entry.resetAt <= now) {
    hits.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }
  entry.count++
  return entry.count <= max
}
