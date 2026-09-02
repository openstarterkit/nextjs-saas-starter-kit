import { describe, it, expect } from "vitest"
import { assertRevisionOrder, categorySlug, formatPostDate, isoDate } from "@/lib/blog"

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

describe("isoDate", () => {
  // Frontmatter dates arrive in two shapes and only one of them is a string:
  // gray-matter parses an unquoted 2026-08-31 into a Date and leaves a quoted
  // one alone. Getting this wrong does not throw, it writes "Invalid Date"
  // into the sitemap, which is the kind of failure nobody notices.
  it("normalizes a Date to yyyy-mm-dd", () => {
    expect(isoDate(new Date("2026-08-31T00:00:00Z"))).toBe("2026-08-31")
  })

  it("drops the time component rather than carrying it into the output", () => {
    expect(isoDate(new Date("2026-08-31T22:45:10Z"))).toBe("2026-08-31")
  })

  it("leaves a quoted string untouched", () => {
    expect(isoDate("2026-08-31")).toBe("2026-08-31")
  })
})

describe("assertRevisionOrder", () => {
  // An `updated` before `date` is the one frontmatter typo that produces a
  // dateModified earlier than datePublished, which is invalid structured data,
  // and a sitemap lastmod that moves backwards. Nothing else catches it.
  it("rejects a revision dated before publication", () => {
    expect(() => assertRevisionOrder("post.mdx", "2026-08-10", "2026-07-01")).toThrow(
      /"updated" \(2026-07-01\) is before "date" \(2026-08-10\)/,
    )
  })

  it("accepts a revision after publication", () => {
    expect(() => assertRevisionOrder("post.mdx", "2026-08-10", "2026-09-02")).not.toThrow()
  })

  it("accepts a revision on the day of publication", () => {
    expect(() => assertRevisionOrder("post.mdx", "2026-08-10", "2026-08-10")).not.toThrow()
  })

  it("accepts a post that declares no revision at all", () => {
    expect(() => assertRevisionOrder("post.mdx", "2026-08-10")).not.toThrow()
  })
})
