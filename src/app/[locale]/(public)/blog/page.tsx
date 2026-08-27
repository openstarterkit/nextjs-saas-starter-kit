import type { Metadata } from "next"

import { BlogIndex } from "@/components/blog/blog-index"
import { siteConfig } from "@/config/site"
import { pageMetadata } from "@/lib/metadata"

export const metadata: Metadata = {
  ...pageMetadata({
    title: `Blog | ${siteConfig.name}`,
    description: `Guides, product updates and build notes from ${siteConfig.name}.`,
    path: "/blog",
  }),
  // Keeps the feed discoverable alongside the canonical the helper builds.
  alternates: {
    canonical: `${siteConfig.url}/blog`,
    types: { "application/rss+xml": "/blog/rss.xml" },
  },
}

export default function BlogIndexPage() {
  return <BlogIndex page={1} />
}
