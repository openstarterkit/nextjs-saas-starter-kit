import { describe, it, expect } from "vitest"
import { paginate, POSTS_PER_PAGE, type Post } from "./blog"

const post = (n: number) => ({ slug: `post-${n}` }) as Post
const many = (n: number) => Array.from({ length: n }, (_, i) => post(i))

describe("paginate", () => {
  it("returns a single page when everything fits", () => {
    const { posts, page, totalPages } = paginate(many(3), 1)

    expect(posts).toHaveLength(3)
    expect(page).toBe(1)
    expect(totalPages).toBe(1)
  })

  it("splits into pages of POSTS_PER_PAGE, last one short", () => {
    const total = POSTS_PER_PAGE + 2
    expect(paginate(many(total), 1).posts).toHaveLength(POSTS_PER_PAGE)
    expect(paginate(many(total), 2).posts).toHaveLength(2)
    expect(paginate(many(total), 2).totalPages).toBe(2)
  })

  // A page number out of range arrives from a hand-typed URL, so it clamps
  // instead of rendering an empty list that looks like a broken blog.
  it("clamps a page number outside the range", () => {
    expect(paginate(many(5), 0).page).toBe(1)
    expect(paginate(many(5), 99).page).toBe(1)
  })

  it("still reports one page when there are no posts", () => {
    expect(paginate([], 1)).toEqual({ posts: [], page: 1, totalPages: 1 })
  })
})
