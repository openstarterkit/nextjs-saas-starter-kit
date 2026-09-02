import fs from "node:fs"
import path from "node:path"
import matter from "gray-matter"
import { isKitSite } from "@/config/kit"

/**
 * File-based blog: every .mdx (or .md) file in content/blog/ is a post.
 * Frontmatter carries the metadata, the filename is the slug. No database,
 * no CMS, no external service: writing a post is a git commit. Files with
 * `draft: true` stay out of every list, the feed and the sitemap.
 *
 * The three posts in there are examples written for a product audience:
 * rewrite them, add your own, delete what you don't need.
 *
 * `KIT_SITE="true"` switches the source to `content/blog-kit/`, a folder that
 * is **not** part of this repository. It is how one codebase can serve a
 * product's blog and a second, unrelated one without the two overlapping.
 * Leave the flag unset, as your app does, and only `content/blog/` is ever
 * read; set it and create the folder if you want the same split yourself.
 */

/** One question and its answer, from a post's optional `faq:` frontmatter. */
export type PostFaq = { q: string; a: string }

export type Post = {
  slug: string
  title: string
  description: string
  /** ISO date (yyyy-mm-dd); lists sort newest first. */
  date: string
  /**
   * Optional ISO date of the last substantive revision. It feeds `dateModified`
   * in the article schema and `lastModified` in the sitemap, so an edit to an
   * old post is visible to a crawler instead of waiting for the next natural
   * visit. It deliberately does NOT affect ordering: moving `date` forward
   * would announce freshness by lying about publication and would push a
   * three-week-old post back to the top of the blog.
   */
  updated?: string
  category: string
  /** Optional cover image path (e.g. "/blog/covers/my-post.svg"). */
  cover?: string
  /**
   * Optional Q&A pairs, published as FAQPage structured data by the post page.
   * Search engines require every answer you declare to be visible to the
   * reader, so these repeat an FAQ section written in the body: they never
   * replace it.
   */
  faq?: PostFaq[]
  content: string
  readingMinutes: number
}

export type Category = { name: string; slug: string; count: number }

const BLOG_DIR = path.join(process.cwd(), "content", isKitSite ? "blog-kit" : "blog")

/** URL-safe category slug ("Product updates" -> "product-updates"). */
export function categorySlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
}

/**
 * gray-matter turns an unquoted `2026-08-31` into a Date and a quoted one into
 * a string, and both forms appear in real frontmatter. Normalize to yyyy-mm-dd.
 */
export function isoDate(value: unknown): string {
  return value instanceof Date ? value.toISOString().slice(0, 10) : String(value)
}

/**
 * Refuses a revision date that predates publication.
 *
 * The pair is silent in both the places it reaches: a `dateModified` earlier
 * than `datePublished` is invalid structured data, and the sitemap `lastmod`
 * moves backwards. Neither throws on its own, so the build has to. Comparing
 * the strings is enough, because yyyy-mm-dd sorts the way the calendar does.
 */
export function assertRevisionOrder(file: string, date: string, updated?: string): void {
  if (updated !== undefined && updated < date) {
    throw new Error(`content/blog/${file}: "updated" (${updated}) is before "date" (${date})`)
  }
}

export function getAllPosts(): Post[] {
  if (!fs.existsSync(BLOG_DIR)) return []
  const posts: Post[] = []
  for (const file of fs.readdirSync(BLOG_DIR)) {
    if (!/\.mdx?$/.test(file)) continue
    const { data, content } = matter(fs.readFileSync(path.join(BLOG_DIR, file), "utf8"))
    if (data.draft) continue
    // Fail loud on malformed frontmatter instead of shipping a broken card.
    for (const field of ["title", "description", "date", "category"] as const) {
      if (!data[field]) throw new Error(`content/blog/${file}: missing "${field}" in frontmatter`)
    }
    // Same rule for the optional FAQ: a half-written entry would ship a broken
    // rich result, which is worse than none, so it stops the build instead.
    let faq: PostFaq[] | undefined
    if (data.faq !== undefined) {
      if (!Array.isArray(data.faq)) throw new Error(`content/blog/${file}: "faq" must be a list`)
      faq = data.faq.map((entry: unknown, i: number) => {
        const { q, a } = (entry ?? {}) as { q?: unknown; a?: unknown }
        if (typeof q !== "string" || typeof a !== "string" || !q.trim() || !a.trim()) {
          throw new Error(`content/blog/${file}: faq[${i}] needs both "q" and "a"`)
        }
        return { q, a }
      })
    }
    const words = content.split(/\s+/).filter(Boolean).length
    // gray-matter parses unquoted dates as Date objects: normalize both.
    const date = isoDate(data.date)
    const updated = data.updated === undefined ? undefined : isoDate(data.updated)
    assertRevisionOrder(file, date, updated)
    posts.push({
      slug: file.replace(/\.mdx?$/, ""),
      title: String(data.title),
      description: String(data.description),
      date,
      updated,
      category: String(data.category),
      cover: data.cover ? String(data.cover) : undefined,
      faq,
      content,
      readingMinutes: Math.max(1, Math.round(words / 220)),
    })
  }
  return posts.sort((a, b) => (a.date < b.date ? 1 : -1))
}

/** "2026-07-25" -> "July 25, 2026" (UTC, so the date never shifts by timezone). */
export function formatPostDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  })
}

export function getPost(slug: string): Post | undefined {
  return getAllPosts().find((p) => p.slug === slug)
}

export function getCategories(): Category[] {
  const map = new Map<string, Category>()
  for (const post of getAllPosts()) {
    const slug = categorySlug(post.category)
    const existing = map.get(slug)
    if (existing) existing.count++
    else map.set(slug, { name: post.category, slug, count: 1 })
  }
  return [...map.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
}

export function getPostsByCategory(slug: string): Post[] {
  return getAllPosts().filter((p) => categorySlug(p.category) === slug)
}

/**
 * Posts per page on the index and the category listings.
 *
 * Leave it unset to list every post on one page, the way the kit treats other
 * values you do not fill in. When it is set, the extra pages are real routes
 * (`/blog/page/2`) rather than a query string: each one has an address of its
 * own that can be linked, crawled and shown in a result, which a `?page=`
 * cannot claim as reliably.
 *
 * The RSS feed ignores this and stays whole: a feed reader wants the posts, not
 * the pagination.
 */
export const POSTS_PER_PAGE = 12

export type Paginated = { posts: Post[]; page: number; totalPages: number }

/**
 * Slices a list into a page, clamping to what exists. `totalPages` is at least
 * 1 so an empty blog still renders page 1 instead of "page 1 of 0".
 */
export function paginate(posts: Post[], page: number): Paginated {
  const perPage = POSTS_PER_PAGE > 0 ? POSTS_PER_PAGE : posts.length || 1
  const totalPages = Math.max(1, Math.ceil(posts.length / perPage))
  const current = Math.min(Math.max(1, page), totalPages)
  const start = (current - 1) * perPage
  return { posts: posts.slice(start, start + perPage), page: current, totalPages }
}
