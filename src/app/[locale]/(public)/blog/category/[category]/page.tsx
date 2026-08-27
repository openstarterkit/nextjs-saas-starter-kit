import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getTranslations } from "next-intl/server"

import { CategoryIndex } from "@/components/blog/category-index"
import { getCategories } from "@/lib/blog"
import { siteConfig } from "@/config/site"
import { pageMetadata } from "@/lib/metadata"

export async function generateStaticParams() {
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

  return pageMetadata({
    title: `${match.name} | ${t("title")} | ${siteConfig.name}`,
    description: t("categoryMeta", { site: siteConfig.name, category: match.name }),
    path: `/blog/category/${category}`,
  })
}

export default async function BlogCategoryPage({
  params,
}: {
  params: Promise<{ category: string }>
}) {
  const { category } = await params
  if (!getCategories().some((c) => c.slug === category)) notFound()

  return <CategoryIndex category={category} page={1} />
}
