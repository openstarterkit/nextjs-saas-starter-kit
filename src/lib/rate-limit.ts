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

/**
 * Builds a rate-limit key for anonymous requests (public forms like contact
 * or newsletter) from the caller's IP. Call from a Server Action or Route
 * Handler; falls back to "unknown" when no forwarding header is present
 * (e.g. local dev), which still rate-limits globally rather than not at all.
 */
export async function rateLimitKeyFromIp(scope: string): Promise<string> {
  const { headers } = await import("next/headers")
  const h = await headers()
  const ip = (h.get("x-forwarded-for")?.split(",")[0] ?? h.get("x-real-ip") ?? "unknown").trim()
  return `${scope}:${ip}`
}

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
