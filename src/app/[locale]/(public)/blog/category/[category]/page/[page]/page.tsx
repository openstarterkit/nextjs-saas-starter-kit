import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { CategoryIndex } from "@/components/blog/category-index"
import { getCategories, getPostsByCategory, paginate } from "@/lib/blog"
import { siteConfig } from "@/config/site"
import { pageMetadata } from "@/lib/metadata"

/** Pages two and up of a category. Page 1 stays at the bare category address. */
export function generateStaticParams() {
  return getCategories().flatMap((c) => {
    const { totalPages } = paginate(getPostsByCategory(c.slug), 1)
    return Array.from({ length: Math.max(0, totalPages - 1) }, (_, i) => ({
      category: c.slug,
      page: String(i + 2),
    }))
  })
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string; page: string }>
}): Promise<Metadata> {
  const { category, page } = await params
  const match = getCategories().find((c) => c.slug === category)
  if (!match) return {}

  return pageMetadata({
    title: `${match.name}, page ${page} | ${siteConfig.name}`,
    path: `/blog/category/${category}/page/${page}`,
  })
}

export default async function BlogCategoryPagedPage({
  params,
}: {
  params: Promise<{ category: string; page: string }>
}) {
  const { category, page } = await params
  const n = Number(page)
  if (!getCategories().some((c) => c.slug === category)) notFound()

  const { totalPages } = paginate(getPostsByCategory(category), 1)
  if (!Number.isInteger(n) || n < 2 || n > totalPages) notFound()

  return <CategoryIndex category={category} page={n} />
}
