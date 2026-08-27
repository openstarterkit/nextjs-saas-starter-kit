import type { Metadata } from "next"

import { siteConfig } from "@/config/site"

/**
 * Builds a page's metadata, including the Open Graph and Twitter blocks.
 *
 * Why a helper rather than the fields written out on each page: Next merges
 * metadata shallowly, so a page that declares `openGraph` replaces the parent's
 * object rather than adding to it. Written by hand eighteen times, that is a
 * guarantee some page ends up with a title and no description, or a URL
 * pointing at the wrong path, and nobody notices because the page still looks
 * fine. Nothing about a broken share preview shows up on the site itself.
 *
 * It matters most where this kit's traffic comes from: a link posted in a chat,
 * a forum or a social timeline is rendered from these tags, so the preview *is*
 * the advert. Without them every link from the same site looks identical.
 *
 * `path` is a site path, not a URL: the absolute form is built here so the two
 * cannot disagree.
 */
export function pageMetadata({
  title,
  description = siteConfig.description,
  path = "/",
  type = "website",
}: {
  title: string
  description?: string
  path?: string
  type?: "website" | "article"
}): Metadata {
  const url = `${siteConfig.url}${path}`

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: siteConfig.name,
      type,
    },
    // The image itself comes from the opengraph-image file convention, which
    // Next resolves per route: declaring one here would override the generated
    // one on every page that has its own.
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  }
}
