/**
 * Fixed-window rate limiting: in memory by default, shared when you ask for it.
 *
 * The honest caveat that shipped with the in-memory version still applies to
 * it — on serverless every instance has its own memory, so on its own this is a
 * speed bump rather than a wall, and bcrypt's cost is the real brute-force
 * brake. What changed in 2.2 is that the wall no longer requires rewriting
 * anything: set two environment variables and the same counters move to Upstash
 * Redis, shared across every instance and every region.
 *
 * Both variables are optional, and that is a release constraint rather than a
 * preference: one new REQUIRED variable would make this a major version for
 * everybody who has already cloned the kit. Unset, the behaviour is exactly
 * what it was.
 *
 * Which limit deserves the shared store first is worth knowing, and it is not
 * the sign-in one: there bcrypt carries most of the weight. The limits on magic
 * link, signup, reset and the public forms guard OUTBOUND EMAIL — your Resend
 * bill and your sending reputation — and bcrypt has nothing to do with those.
 */

const WINDOW_MS = 15 * 60 * 1000
const MAX_ATTEMPTS = 5
// Keep the in-memory map bounded: purge expired entries once it grows past this.
const PURGE_THRESHOLD = 1000

const hits = new Map<string, { count: number; resetAt: number }>()

/** Returns how many times this key has been seen inside the current window. */
type Store = (key: string, windowMs: number) => Promise<number>

const memoryStore: Store = async (key, windowMs) => {
  const now = Date.now()

  if (hits.size > PURGE_THRESHOLD) {
    for (const [k, v] of hits) if (v.resetAt <= now) hits.delete(k)
  }

  const entry = hits.get(key)
  if (!entry || entry.resetAt <= now) {
    hits.set(key, { count: 1, resetAt: now + windowMs })
    return 1
  }
  entry.count++
  return entry.count
}

/**
 * Upstash over its REST API, which is the shape that suits serverless: no
 * connection held open, no pool to exhaust, and no client library to install —
 * two commands in one pipelined `fetch`.
 *
 * `PEXPIRE ... NX` sets the expiry only when the key does not already have one,
 * so the window starts at the first hit instead of sliding forward with every
 * later one. Getting that wrong quietly turns a 15 minute window into a
 * permanent ban for anyone who keeps knocking.
 */
const upstashStore =
  (url: string, token: string): Store =>
  async (key, windowMs) => {
    const response = await fetch(`${url.replace(/\/$/, "")}/pipeline`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify([
        ["INCR", key],
        ["PEXPIRE", key, String(windowMs), "NX"],
      ]),
      // A limiter that hangs costs more than the abuse it prevents.
      signal: AbortSignal.timeout(2000),
    })
    if (!response.ok) throw new Error(`upstash responded ${response.status}`)
    const [incr] = (await response.json()) as { result: number }[]
    return incr.result
  }

let warned = false

function sharedStore(): Store | null {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  return upstashStore(url, token)
}

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

/**
 * True while the caller is still under the limit.
 *
 * When a shared store is configured but unreachable, this falls back to the
 * in-memory counter rather than failing in either direction. Refusing everybody
 * would take the site down along with the Redis; letting everybody through
 * would drop the protection exactly when something is already wrong. What is
 * left is the speed bump, which is what the kit had before you configured
 * anything.
 */
export async function checkRateLimit(
  key: string,
  max = MAX_ATTEMPTS,
  windowMs = WINDOW_MS
): Promise<boolean> {
  const shared = sharedStore()
  if (shared) {
    try {
      return (await shared(key, windowMs)) <= max
    } catch (error) {
      // Once per process: a limiter that floods the logs during an outage
      // makes the outage harder to read.
      if (!warned) {
        warned = true
        console.warn("[rate-limit] shared store unreachable, falling back to memory:", error)
      }
    }
  }
  return (await memoryStore(key, windowMs)) <= max
}
