import { describe, expect, it } from "vitest"

import { pageItems } from "./pagination"

describe("pageItems", () => {
  it("shows every page while there are seven or fewer", () => {
    expect(pageItems(1, 1)).toEqual([1])
    expect(pageItems(3, 7)).toEqual([1, 2, 3, 4, 5, 6, 7])
  })

  it("keeps the run of pages against the start near it", () => {
    expect(pageItems(1, 50)).toEqual([1, 2, 3, 4, 5, "gap", 50])
    expect(pageItems(4, 50)).toEqual([1, 2, 3, 4, 5, "gap", 50])
  })

  it("keeps the run of pages against the end near it", () => {
    expect(pageItems(50, 50)).toEqual([1, "gap", 46, 47, 48, 49, 50])
    expect(pageItems(47, 50)).toEqual([1, "gap", 46, 47, 48, 49, 50])
  })

  it("shows the neighbours of a page in the middle, with a gap each side", () => {
    expect(pageItems(5, 50)).toEqual([1, "gap", 4, 5, 6, "gap", 50])
    expect(pageItems(25, 50)).toEqual([1, "gap", 24, 25, 26, "gap", 50])
  })

  it("never lets a gap stand for a single page", () => {
    for (let total = 8; total <= 12; total++) {
      for (let page = 1; page <= total; page++) {
        const items = pageItems(page, total)
        items.forEach((item, i) => {
          if (item !== "gap") return
          const before = items[i - 1] as number
          const after = items[i + 1] as number
          expect(after - before).toBeGreaterThan(2)
        })
      }
    }
  })

  it("always has seven entries past seven pages", () => {
    for (let page = 1; page <= 30; page++) expect(pageItems(page, 30)).toHaveLength(7)
  })

  it("clamps a page out of range instead of inventing pages", () => {
    expect(pageItems(99, 10)).toEqual([1, "gap", 6, 7, 8, 9, 10])
    expect(pageItems(0, 10)).toEqual([1, 2, 3, 4, 5, "gap", 10])
  })
})
