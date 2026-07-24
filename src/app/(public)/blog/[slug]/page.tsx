import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { MDXRemote } from "next-mdx-remote/rsc"
import remarkGfm from "remark-gfm"
import { getAllPosts, getPost, categorySlug, formatPostDate } from "@/lib/blog"
import { Badge } from "@/components/ui/badge"
import { siteConfig } from "@/config/site"

export function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const post = getPost(slug)
  if (!post) return {}
  const url = `${siteConfig.url}/blog/${post.slug}`
  return {
    title: `${post.title} | ${siteConfig.name}`,
    description: post.description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      title: post.title,
      description: post.description,
      publishedTime: `${post.date}T00:00:00Z`,
    },
    twitter: { card: "summary_large_image", title: post.title, description: post.description },
  }
}

// External links leave the post: open them in a new tab (same rule as the
// changelog page). Everything else keeps default navigation.
const mdxComponents = {
  a: ({ href, title, children }: { href?: string; title?: string; children?: React.ReactNode }) => {
    const isExternal = typeof href === "string" && /^https?:\/\//.test(href)
    return (
      <a href={href} title={title} {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
        {children}
      </a>
    )
  },
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = getPost(slug)
  if (!post) notFound()

  // Structured data: lets search engines show the post as an Article.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    datePublished: `${post.date}T00:00:00Z`,
    author: { "@type": "Organization", name: siteConfig.name, url: siteConfig.url },
    mainEntityOfPage: `${siteConfig.url}/blog/${post.slug}`,
  }

  return (
    <section className="py-24">
      <div className="mx-auto max-w-3xl px-6">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

        <Link href="/blog/" className="text-sm text-muted-foreground hover:text-primary">
          ← Blog
        </Link>

        <header className="mt-6">
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <time dateTime={post.date}>{formatPostDate(post.date)}</time>
            <Link href={`/blog/category/${categorySlug(post.category)}/`}>
              <Badge variant="secondary">{post.category}</Badge>
            </Link>
            <span>{post.readingMinutes} min read</span>
          </div>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{post.title}</h1>
          <p className="mt-4 text-lg text-muted-foreground">{post.description}</p>
        </header>

        {post.cover && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.cover}
            alt=""
            className="mt-8 aspect-[1200/630] w-full rounded-2xl border border-border object-cover"
          />
        )}

        <article className="prose mt-10 max-w-none prose-headings:tracking-tight prose-code:before:content-none prose-code:after:content-none">
          <MDXRemote
            source={post.content}
            components={mdxComponents}
            options={{ mdxOptions: { remarkPlugins: [remarkGfm] } }}
          />
        </article>
      </div>
    </section>
  )
}
