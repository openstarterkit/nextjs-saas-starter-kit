import type { Metadata } from "next"
import { Children, isValidElement } from "react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { MDXRemote } from "next-mdx-remote/rsc"
import remarkGfm from "remark-gfm"
import { getAllPosts, getPost, categorySlug, formatPostDate } from "@/lib/blog"
import { Figure } from "@/components/blog/figure"
import { NewsletterSignup } from "@/components/blog/newsletter-signup"
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

/** The `<img>` inside `[![alt](x)](x)`, when that image is the whole link. */
function selfLinkedImage(href: string | undefined, children: React.ReactNode) {
  if (typeof href !== "string") return null
  const only = Children.toArray(children)
  if (only.length !== 1 || !isValidElement(only[0])) return null
  const node = only[0] as React.ReactElement<{ src?: string; alt?: string }>
  return node.type === "img" && node.props.src === href ? node.props : null
}

// External links leave the post: open them in a new tab (same rule as the
// changelog page). Everything else keeps default navigation.
const mdxComponents = {
  a: ({ href, title, children }: { href?: string; title?: string; children?: React.ReactNode }) => {
    // An image linked to itself is a diagram the reader is meant to enlarge,
    // written that way so the post still works on GitHub and in a feed reader.
    // Here it becomes a figure that opens in place. A link pointing anywhere
    // else stays a link, which is why the match is on the exact same URL.
    const image = selfLinkedImage(href, children)
    if (image?.src) return <Figure src={image.src} alt={image.alt} />

    const isExternal = typeof href === "string" && /^https?:\/\//.test(href)
    return (
      <a href={href} title={title} {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
        {children}
      </a>
    )
  },
  NewsletterSignup,
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const t = await getTranslations("blog")
  const post = getPost(slug)
  if (!post) notFound()

  // Structured data: the post as an Article, plus a FAQPage when it declares
  // `faq:` in its frontmatter. The rule that makes the second one safe, and
  // it is Google's own: every answer declared here must be readable on the
  // page, so the frontmatter mirrors an FAQ section written in the body.
  const jsonLd: object[] = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: post.title,
      description: post.description,
      datePublished: `${post.date}T00:00:00Z`,
      author: { "@type": "Organization", name: siteConfig.name, url: siteConfig.url },
      mainEntityOfPage: `${siteConfig.url}/blog/${post.slug}`,
    },
  ]

  if (post.faq?.length) {
    jsonLd.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: post.faq.map(({ q, a }) => ({
        "@type": "Question",
        name: q,
        acceptedAnswer: { "@type": "Answer", text: a },
      })),
    })
  }

  return (
    <section className="py-24">
      <div className="mx-auto max-w-3xl px-6">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

        <Link href="/blog" className="text-sm text-muted-foreground hover:text-primary">
          {t("back")}
        </Link>

        <header className="mt-6">
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <time dateTime={post.date}>{formatPostDate(post.date)}</time>
            <Link href={`/blog/category/${categorySlug(post.category)}/`}>
              <Badge variant="secondary">{post.category}</Badge>
            </Link>
            <span>{t("readingTime", { minutes: post.readingMinutes })}</span>
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
