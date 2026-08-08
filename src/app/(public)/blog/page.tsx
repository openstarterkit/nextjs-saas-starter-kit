import type { Metadata } from "next"
import Link from "next/link"
import { getAllPosts, getCategories } from "@/lib/blog"
import { Badge } from "@/components/ui/badge"
import { PostCard } from "@/components/blog/post-card"
import { siteConfig } from "@/config/site"

export const metadata: Metadata = {
  title: `Blog | ${siteConfig.name}`,
  description: `Guides, product updates and build notes from ${siteConfig.name}.`,
  alternates: {
    canonical: `${siteConfig.url}/blog`,
    types: { "application/rss+xml": "/blog/rss.xml" },
  },
}

export default function BlogIndexPage() {
  const posts = getAllPosts()
  const categories = getCategories()

  return (
    <section className="py-24">
      <div className="mx-auto max-w-5xl px-6">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Blog</h1>
          <p className="mt-4 text-muted-foreground">
            Guides, product updates and build notes. Follow along via{" "}
            <a href="/blog/rss.xml" className="text-primary hover:underline">
              RSS
            </a>
            .
          </p>
        </div>

        {categories.length > 1 && (
          <div className="mt-8 flex flex-wrap gap-2">
            {categories.map((c) => (
              <Link key={c.slug} href={`/blog/category/${c.slug}/`}>
                <Badge variant="secondary" className="hover:border-primary/40 hover:text-primary">
                  {c.name} · {c.count}
                </Badge>
              </Link>
            ))}
          </div>
        )}

        {posts.length === 0 ? (
          <p className="mt-12 text-muted-foreground">
            No posts yet. Add an <code>.mdx</code> file to <code>content/blog/</code> to publish the first one.
          </p>
        ) : (
          <div className="mt-12 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <PostCard key={post.slug} post={post} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
