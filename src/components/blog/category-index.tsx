import { notFound } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { getCategories, getPostsByCategory, paginate } from "@/lib/blog"
import { PostCard } from "@/components/blog/post-card"
import { Pagination } from "@/components/ui/pagination"
import { breadcrumbJsonLd, type Crumb } from "@/lib/breadcrumb"
import { BreadcrumbTrail } from "@/components/ui/breadcrumb"
import { jsonLdScript } from "@/lib/json-ld"

export function generateStaticParams() {
  return getCategories().map((c) => ({ category: c.slug }))
}

/**
 * One category listing, rendered by both /blog/category/x and its page N.
 */
export async function CategoryIndex({ category, page }: { category: string; page: number }) {
  const t = await getTranslations("blog")
  const match = getCategories().find((c) => c.slug === category)
  if (!match) notFound()
  const { posts, page: current, totalPages } = paginate(getPostsByCategory(category), page)

  const trail: Crumb[] = [
    { name: t("breadcrumbHome"), href: "/" },
    { name: t("breadcrumbBlog"), href: "/blog" },
    { name: match.name, href: `/blog/category/${category}` },
  ]

  return (
    <section className="py-24">
      <div className="mx-auto max-w-5xl px-6 lg:px-12">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(breadcrumbJsonLd(trail)) }} />

        <BreadcrumbTrail trail={trail} />
        <h1 className="mt-6 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{match.name}</h1>
        <p className="mt-4 text-muted-foreground">{t("inCategory", { count: posts.length })}</p>

        <div className="mt-12 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>

        <Pagination
          page={current}
          totalPages={totalPages}
          href={(n) =>
            n === 1 ? `/blog/category/${category}` : `/blog/category/${category}/page/${n}`
          }
          labels={{
            previous: t("previous"),
            next: t("next"),
            navigation: t("pagination"),
            page: t("page"),
          }}
          className="mt-12"
        />
      </div>
    </section>
  )
}
