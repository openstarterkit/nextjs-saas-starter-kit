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
 * rewrite them, add your own, delete what you don't need. The kit's own site
 * (KIT_SITE="true") reads content/blog-kit/ instead, where the posts explain
 * the kit itself, so one repo can serve two blogs without them overlapping.
 */

export type Post = {
  slug: string
  title: string
  description: string
  /** ISO date (yyyy-mm-dd); lists sort newest first. */
  date: string
  category: string
  /** Optional cover image path (e.g. "/blog/covers/my-post.svg"). */
  cover?: string
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
    const words = content.split(/\s+/).filter(Boolean).length
    posts.push({
      slug: file.replace(/\.mdx?$/, ""),
      title: String(data.title),
      description: String(data.description),
      // gray-matter parses unquoted dates as Date objects: normalize both.
      date: data.date instanceof Date ? data.date.toISOString().slice(0, 10) : String(data.date),
      category: String(data.category),
      cover: data.cover ? String(data.cover) : undefined,
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
