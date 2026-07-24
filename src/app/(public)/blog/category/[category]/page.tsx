import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { getCategories, getPostsByCategory } from "@/lib/blog"
import { PostCard } from "@/components/blog/post-card"
import { siteConfig } from "@/config/site"

export function generateStaticParams() {
  return getCategories().map((c) => ({ category: c.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }): Promise<Metadata> {
  const { category } = await params
  const match = getCategories().find((c) => c.slug === category)
  if (!match) return {}
  return {
    title: `${match.name} | Blog | ${siteConfig.name}`,
    description: `All ${siteConfig.name} blog posts in the ${match.name} category.`,
  }
}

export default async function BlogCategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params
  const match = getCategories().find((c) => c.slug === category)
  if (!match) notFound()
  const posts = getPostsByCategory(category)

  return (
    <section className="py-24">
      <div className="mx-auto max-w-5xl px-6">
        <Link href="/blog/" className="text-sm text-muted-foreground hover:text-primary">
          ← Blog
        </Link>
        <h1 className="mt-6 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{match.name}</h1>
        <p className="mt-4 text-muted-foreground">
          {posts.length} {posts.length === 1 ? "post" : "posts"} in this category.
        </p>

        <div className="mt-12 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>
      </div>
    </section>
  )
}
