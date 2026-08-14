import { getAllPosts } from "@/lib/blog"
import { siteConfig } from "@/config/site"

/**
 * RSS 2.0 feed generated from the blog frontmatter. No library: the feed is
 * a small, stable XML document and a template keeps it dependency-free.
 */

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

export function GET() {
  const posts = getAllPosts()
  const items = posts
    .map((post) => {
      const url = `${siteConfig.url}/blog/${post.slug}`
      return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${new Date(`${post.date}T00:00:00Z`).toUTCString()}</pubDate>
      <category>${escapeXml(post.category)}</category>
      <description>${escapeXml(post.description)}</description>
    </item>`
    })
    .join("\n")

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(siteConfig.name)} Blog</title>
    <link>${siteConfig.url}/blog</link>
    <description>${escapeXml(`Guides, product updates and build notes from ${siteConfig.name}.`)}</description>
    <language>en</language>
    <atom:link href="${siteConfig.url}/blog/rss.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>
`

  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  })
}
