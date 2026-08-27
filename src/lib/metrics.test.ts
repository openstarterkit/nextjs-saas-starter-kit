import { describe, it, expect } from "vitest"
import { monthlyEquivalent, mrrHistory, type MrrSubscription } from "./metrics"

const DAY = 24 * 60 * 60 * 1000
const NOW = new Date("2026-08-26T00:00:00.000Z")
const daysAgo = (n: number) => new Date(NOW.getTime() - n * DAY)

function sub(overrides: Partial<MrrSubscription> = {}): MrrSubscription {
  return {
    createdAt: daysAgo(60),
    updatedAt: daysAgo(60),
    status: "ACTIVE",
    plan: { price: 1900, interval: "MONTH" },
    ...overrides,
  }
}

describe("monthlyEquivalent", () => {
  it("takes a monthly price as it is", () => {
    expect(monthlyEquivalent({ price: 1900, interval: "MONTH" })).toBe(1900)
  })

  it("spreads a yearly price over twelve months", () => {
    expect(monthlyEquivalent({ price: 19000, interval: "YEAR" })).toBe(1583)
  })

  // One-time payments are revenue, but they are not recurring revenue.
  it("counts a one-time plan as zero", () => {
    expect(monthlyEquivalent({ price: 29900, interval: "ONE_TIME" })).toBe(0)
  })
})

describe("mrrHistory", () => {
  it("returns one point per week, oldest first", () => {
    const points = mrrHistory([], { weeks: 4, now: NOW })

    expect(points).toHaveLength(4)
    expect(points[0].date).toBe("2026-08-05")
    expect(points[3].date).toBe("2026-08-26")
  })

  it("counts nothing before the subscription existed", () => {
    const points = mrrHistory([sub({ createdAt: daysAgo(10), updatedAt: daysAgo(10) })], {
      weeks: 4,
      now: NOW,
    })

    expect(points.map((p) => p.mrr)).toEqual([0, 0, 1900, 1900])
  })

  // The property the whole rule is built around: the last point has to agree
  // with the MRR figure the admin page shows next to the chart, which counts
  // only rows that are ACTIVE right now.
  it("ends on the same figure as a plain active-only sum", () => {
    const subs = [
      sub(),
      sub({ status: "CANCELED", updatedAt: daysAgo(10) }),
      sub({ status: "PAST_DUE", updatedAt: daysAgo(3) }),
    ]
    const activeOnly = subs
      .filter((s) => s.status === "ACTIVE")
      .reduce((sum, s) => sum + monthlyEquivalent(s.plan), 0)

    const points = mrrHistory(subs, { weeks: 4, now: NOW })

    expect(points.at(-1)!.mrr).toBe(activeOnly)
  })

  // A cancellation should show up as a dip rather than erase the revenue that
  // subscription produced while it was running.
  it("keeps a canceled subscription up to the moment it was last written", () => {
    // Canceled five days ago, so it is still counted at the sample a week back
    // and gone at the present one: a dip at the end rather than a rewrite of
    // the whole line.
    const points = mrrHistory([sub({ status: "CANCELED", updatedAt: daysAgo(5) })], {
      weeks: 4,
      now: NOW,
    })

    expect(points.map((p) => p.mrr)).toEqual([1900, 1900, 1900, 0])
  })
})
