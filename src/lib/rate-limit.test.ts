import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { checkRateLimit } from "@/lib/rate-limit"

// The limiter keeps its counters in a module-level Map, so every test needs
// its own key or it would inherit the previous test's count.
let n = 0
const freshKey = () => `test-key-${++n}`

describe("checkRateLimit", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("allows the first attempt on an unseen key", () => {
    expect(checkRateLimit(freshKey(), 5, 1000)).toBe(true)
  })

  it("allows exactly max attempts, then blocks", () => {
    const key = freshKey()
    expect(checkRateLimit(key, 3, 1000)).toBe(true)
    expect(checkRateLimit(key, 3, 1000)).toBe(true)
    expect(checkRateLimit(key, 3, 1000)).toBe(true)
    expect(checkRateLimit(key, 3, 1000)).toBe(false)
  })

  it("keeps blocking while the window is open", () => {
    const key = freshKey()
    checkRateLimit(key, 1, 10_000)
    expect(checkRateLimit(key, 1, 10_000)).toBe(false)
    vi.advanceTimersByTime(9_999)
    expect(checkRateLimit(key, 1, 10_000)).toBe(false)
  })

  it("starts a new window once the old one has expired", () => {
    const key = freshKey()
    checkRateLimit(key, 1, 1000)
    expect(checkRateLimit(key, 1, 1000)).toBe(false)
    vi.advanceTimersByTime(1001)
    expect(checkRateLimit(key, 1, 1000)).toBe(true)
  })

  it("counts each key separately", () => {
    const a = freshKey()
    const b = freshKey()
    checkRateLimit(a, 1, 1000)
    expect(checkRateLimit(a, 1, 1000)).toBe(false)
    // b must be untouched by a's exhausted budget.
    expect(checkRateLimit(b, 1, 1000)).toBe(true)
  })

  it("defaults to 5 attempts per 15 minutes", () => {
    const key = freshKey()
    for (let i = 0; i < 5; i++) expect(checkRateLimit(key)).toBe(true)
    expect(checkRateLimit(key)).toBe(false)
    vi.advanceTimersByTime(15 * 60 * 1000 + 1)
    expect(checkRateLimit(key)).toBe(true)
  })
})
