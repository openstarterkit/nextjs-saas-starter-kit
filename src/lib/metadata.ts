import type { Metadata } from "next"

import { siteConfig } from "@/config/site"

/**
 * The generated image at `src/app/opengraph-image.tsx`, named rather than
 * inherited.
 *
 * Next resolves the `opengraph-image` file convention per route and merges
 * metadata shallowly, and those two facts do not combine the way they read.
 * A page that declares `openGraph` REPLACES the parent's object, and the image
 * the ancestor file put there goes with it. A colocated file survives, because
 * it is merged into the segment's own metadata: that is why blog posts, which
 * have their own image beside them, kept theirs while every page using this
 * helper had none.
 *
 * The result was worse than no tags. Every page still declared
 * `summary_large_image`, which asks a platform for the big card and then hands
 * it nothing.
 *
 * Relative on purpose: `metadataBase` in the root layout makes it absolute, so
 * a preview deployment advertises itself rather than production.
 */
const OG_IMAGE = "/opengraph-image"

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
      images: [OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [OG_IMAGE],
    },
  }
}
