import { useTranslations } from "next-intl"
import Link from "next/link"
import { getAllPosts, getCategories, paginate } from "@/lib/blog"
import { Badge } from "@/components/ui/badge"
import { PostCard } from "@/components/blog/post-card"
import { Pagination } from "@/components/ui/pagination"

/**
 * The blog index, rendered by both /blog and /blog/page/N.
 *
 * One component so the two addresses cannot drift apart: page 1 is the bare
 * /blog on purpose, because a canonical archive should not have two URLs for
 * the same list.
 */
export function BlogIndex({ page }: { page: number }) {
  const t = useTranslations("blog")
  const { posts, page: current, totalPages } = paginate(getAllPosts(), page)
  const categories = getCategories()

  return (
    <section className="py-24">
      <div className="mx-auto max-w-5xl px-6 lg:px-12">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{t("title")}</h1>
          <p className="mt-4 text-muted-foreground">
            {t("intro")}{" "}
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
            {t.rich("empty", { code: (c) => <code>{c}</code> })}
          </p>
        ) : (
          <div className="mt-12 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <PostCard key={post.slug} post={post} />
            ))}
          </div>
        )}

        <Pagination
          page={current}
          totalPages={totalPages}
          href={(n) => (n === 1 ? "/blog" : `/blog/page/${n}`)}
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
