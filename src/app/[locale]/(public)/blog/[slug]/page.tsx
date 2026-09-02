import type { Metadata } from "next"
import { Children, isValidElement } from "react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { MDXRemote } from "next-mdx-remote/rsc"
import remarkGfm from "remark-gfm"
import { getAllPosts, getPost, categorySlug, formatPostDate } from "@/lib/blog"
import { extractToc, slugify, nodeText } from "@/lib/toc"
import { breadcrumbJsonLd, type Crumb } from "@/lib/breadcrumb"
import { BreadcrumbTrail } from "@/components/ui/breadcrumb"
import { OnThisPage } from "@/components/docs/on-this-page"
import { Figure } from "@/components/blog/figure"
import { NewsletterSignup } from "@/components/blog/newsletter-signup"
import { Badge } from "@/components/ui/badge"
import { siteConfig } from "@/config/site"
import { jsonLdScript } from "@/lib/json-ld"

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
      ...(post.updated ? { modifiedTime: `${post.updated}T00:00:00Z` } : {}),
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
function MarkdownAnchor({
  href,
  title,
  children,
}: {
  href?: string
  title?: string
  children?: React.ReactNode
}) {
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
}

const mdxComponents = {
  a: MarkdownAnchor,
  // Markdown puts every block on its own line inside a paragraph, and the
  // figure above is a `<figure>`: a `<figure>` inside a `<p>` is invalid HTML,
  // so the browser closes the paragraph before it and builds a tree that does
  // not match the one rendered on the server. React then reports a hydration
  // error on every post that has a diagram.
  //
  // When a paragraph holds nothing but that image, the paragraph goes away.
  // Anything else keeps it, because a paragraph is what it should be.
  p: ({ children }: { children?: React.ReactNode }) => {
    const only = Children.toArray(children)
    if (only.length === 1 && isValidElement(only[0])) {
      const child = only[0] as React.ReactElement<{ href?: string; children?: React.ReactNode }>
      if (child.type === MarkdownAnchor && selfLinkedImage(child.props.href, child.props.children)) {
        return <>{children}</>
      }
    }
    return <p>{children}</p>
  },
  // The id comes from the same slugify() that extractToc() used on the source,
  // so every outline link lands on a heading that exists. scroll-mt keeps the
  // heading clear of the top edge when the browser jumps to it.
  h2: ({ children }: { children?: React.ReactNode }) => (
    <h2 id={slugify(nodeText(children))} className="scroll-mt-24">
      {children}
    </h2>
  ),
  h3: ({ children }: { children?: React.ReactNode }) => (
    <h3 id={slugify(nodeText(children))} className="scroll-mt-24">
      {children}
    </h3>
  ),
  // Same treatment the docs get: a wide table scrolls inside its own box
  // instead of dragging the whole article sideways. Seven of the posts carry
  // one, up to four columns, and a phone has room for two.
  table: ({ children }: { children?: React.ReactNode }) => (
    <div className="overflow-x-auto">
      <table>{children}</table>
    </div>
  ),
  NewsletterSignup,
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const t = await getTranslations("blog")
  const post = getPost(slug)
  const toc = post ? extractToc(post.content) : []
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
      // Only when the post declares it. An absent dateModified is honest; one
      // that always equals datePublished is noise.
      ...(post.updated ? { dateModified: `${post.updated}T00:00:00Z` } : {}),
      author: { "@type": "Organization", name: siteConfig.name, url: siteConfig.url },
      mainEntityOfPage: `${siteConfig.url}/blog/${post.slug}`,
    },
  ]

  // Home, section, current page: the trail the reader sees is the trail the
  // structured data declares, because both read this array.
  const trail: Crumb[] = [
    { name: t("breadcrumbHome"), href: "/" },
    { name: t("breadcrumbBlog"), href: "/blog" },
    { name: post.title, href: `/blog/${post.slug}` },
  ]
  jsonLd.push(breadcrumbJsonLd(trail))

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
      {/* Three columns from xl, and the middle one is the same 48rem the page
          has always used: the article does not move a pixel, the outline simply
          takes margin that was empty. Centring article and outline together as
          one group would have shifted the text left, which is the version that
          got rejected. Below xl the side columns collapse and this is the plain
          reading column again. */}
      <div className="mx-auto max-w-3xl px-6 lg:px-12 xl:grid xl:max-w-7xl xl:grid-cols-[1fr_48rem_1fr] xl:gap-8">
        <div className="hidden xl:block" />
        <div className="min-w-0">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(jsonLd) }} />

        <BreadcrumbTrail trail={trail} />

        <header className="mt-6">
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            {/* Labelled on the post itself, where the two dates sit side by
                side and an unlabelled pair reads as a range. The cards on the
                index carry one date and stay bare. */}
            <time dateTime={post.date}>{t("publishedOn", { date: formatPostDate(post.date) })}</time>
            {post.updated && (
              <time dateTime={post.updated} className="text-foreground/70">
                {t("updatedOn", { date: formatPostDate(post.updated) })}
              </time>
            )}
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

        <article className="prose mt-10 min-w-0 max-w-none prose-headings:scroll-mt-24 prose-headings:tracking-tight prose-code:before:content-none prose-code:after:content-none">
          <MDXRemote
            source={post.content}
            components={mdxComponents}
            options={{ mdxOptions: { remarkPlugins: [remarkGfm] } }}
          />
        </article>
        </div>

        {/* Sticky the way the docs do it, down to the same expression: pinned
            under the header rather than at a guessed offset, because
            `--header-h` is measured by StickyHeader at runtime and a fixed
            top-24 slid under it. The max height lets a long outline scroll on
            its own instead of running past the bottom of the screen. */}
        <aside className="hidden xl:block">
          <div className="sticky top-[calc(var(--header-h,4.5rem)+2rem)]">
            <OnThisPage items={toc} />
          </div>
        </aside>
      </div>
    </section>
  )
}
