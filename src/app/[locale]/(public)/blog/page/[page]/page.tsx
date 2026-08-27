import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { BlogIndex } from "@/components/blog/blog-index"
import { getAllPosts, paginate } from "@/lib/blog"
import { siteConfig } from "@/config/site"
import { pageMetadata } from "@/lib/metadata"

/**
 * Pages two and up of the archive, as real prerendered routes.
 *
 * Page 1 is not generated here: it lives at the bare /blog, so the same list
 * never answers at two addresses. A number past the end is a 404 rather than
 * an empty page, because an address that renders nothing still looks valid to
 * a crawler.
 */
export function generateStaticParams() {
  const { totalPages } = paginate(getAllPosts(), 1)
  return Array.from({ length: Math.max(0, totalPages - 1) }, (_, i) => ({
    page: String(i + 2),
  }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ page: string }>
}): Promise<Metadata> {
  const { page } = await params
  return pageMetadata({
    title: `Blog, page ${page} | ${siteConfig.name}`,
    description: `Guides, product updates and build notes from ${siteConfig.name}.`,
    path: `/blog/page/${page}`,
  })
}

export default async function BlogPagedIndexPage({
  params,
}: {
  params: Promise<{ page: string }>
}) {
  const { page } = await params
  const n = Number(page)
  const { totalPages } = paginate(getAllPosts(), 1)

  if (!Number.isInteger(n) || n < 2 || n > totalPages) notFound()

  return <BlogIndex page={n} />
}
