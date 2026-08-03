import { describe, it, expect } from "vitest"
import { categorySlug, formatPostDate } from "@/lib/blog"

describe("categorySlug", () => {
  it("lowercases and hyphenates a category name", () => {
    expect(categorySlug("Product updates")).toBe("product-updates")
  })

  it("drops punctuation so the slug stays URL-safe", () => {
    expect(categorySlug("Tips & tricks")).toBe("tips-tricks")
    expect(categorySlug("How-to's")).toBe("how-tos")
  })

  it("trims and collapses whitespace", () => {
    expect(categorySlug("  Behind   the scenes ")).toBe("behind-the-scenes")
  })

  it("is stable when applied twice, since routes round-trip it", () => {
    const once = categorySlug("Product updates")
    expect(categorySlug(once)).toBe(once)
  })
})

describe("formatPostDate", () => {
  it("renders an ISO date in long US form", () => {
    expect(formatPostDate("2026-07-25")).toBe("July 25, 2026")
  })

  // The regression this guards: parsing without an explicit UTC zone makes the
  // first of the month render as the last day of the previous one in negative
  // offsets, so a post dated July 1 would publicly read June 30.
  it("does not shift the day regardless of the machine timezone", () => {
    expect(formatPostDate("2026-01-01")).toBe("January 1, 2026")
    expect(formatPostDate("2026-12-31")).toBe("December 31, 2026")
  })
})
