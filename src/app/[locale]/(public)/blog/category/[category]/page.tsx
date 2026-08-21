import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { getCategories, getPostsByCategory } from "@/lib/blog"
import { PostCard } from "@/components/blog/post-card"
import { siteConfig } from "@/config/site"

export function generateStaticParams() {
  return getCategories().map((c) => ({ category: c.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; category: string }>
}): Promise<Metadata> {
  const { locale, category } = await params
  const t = await getTranslations({ locale, namespace: "blog" })
  const match = getCategories().find((c) => c.slug === category)
  if (!match) return {}
  return {
    title: `${match.name} | ${t("title")} | ${siteConfig.name}`,
    description: t("categoryMeta", { site: siteConfig.name, category: match.name }),
    alternates: { canonical: `${siteConfig.url}/blog/category/${category}` },
  }
}

export default async function BlogCategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params
  const t = await getTranslations("blog")
  const match = getCategories().find((c) => c.slug === category)
  if (!match) notFound()
  const posts = getPostsByCategory(category)

  return (
    <section className="py-24">
      <div className="mx-auto max-w-5xl px-6">
        <Link href="/blog" className="text-sm text-muted-foreground hover:text-primary">
          {t("back")}
        </Link>
        <h1 className="mt-6 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{match.name}</h1>
        <p className="mt-4 text-muted-foreground">{t("inCategory", { count: posts.length })}</p>

        <div className="mt-12 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>
      </div>
    </section>
  )
}
