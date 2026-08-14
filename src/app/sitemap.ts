import type { MetadataRoute } from "next"
import { getAllPosts, getCategories } from "@/lib/blog"
import { getDocs, translatedLocales } from "@/lib/docs"
import { routing } from "@/i18n/routing"
import { localizedPath } from "@/i18n/alternates"
import { siteConfig } from "@/config/site"
import { isKitSite } from "@/config/kit"

/**
 * Sitemap built from the real public routes plus the blog content on disk,
 * so a new post is in the sitemap the moment it ships. Served at /sitemap.xml.
 *
 * **Only translated pages appear in more than one language.** A URL that
 * resolves is not the same thing as a URL worth submitting: `/it/docs/billing`
 * answers, but with the English text, and listing it would ask to have the
 * same page indexed twice. The rest of the site is English only, so the rest
 * of this file has no locale in it at all.
 */

/** One entry per language a page exists in, cross-linked with the others. */
function localized(
  path: string,
  locales: readonly string[],
  rest: Omit<MetadataRoute.Sitemap[number], "url">
): MetadataRoute.Sitemap {
  const url = (locale: string) => `${siteConfig.url}${localizedPath(path, locale)}`
  const languages =
    locales.length > 1 ? Object.fromEntries(locales.map((l) => [l, url(l)])) : undefined
  return locales.map((locale) => ({
    ...rest,
    url: url(locale),
    ...(languages ? { alternates: { languages } } : {}),
  }))
}
export default function sitemap(): MetadataRoute.Sitemap {
  // A demo deployment is `noindex` (see the root layout): handing search
  // engines a list of URLs we ask them to ignore only creates noise.
  if (process.env.DEMO_MODE === "true") return []

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${siteConfig.url}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${siteConfig.url}/pricing`, changeFrequency: "weekly", priority: 0.9 },
    // The index renders from the message files, so it exists in every language
    // that has one.
    ...localized("/docs", routing.locales, { changeFrequency: "weekly", priority: 0.8 }),
    { url: `${siteConfig.url}/blog`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${siteConfig.url}/changelog`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${siteConfig.url}/privacy`, changeFrequency: "yearly", priority: 0.2 },
    // The kit's own site sells nothing and has no accounts, so it ships no
    // terms and no separate cookie page: the footer hides both links and the
    // cookie disclosure is a section of the privacy policy. Listing them here
    // would submit the placeholder pages for indexing. Your app keeps them.
    ...(isKitSite
      ? []
      : [
          { url: `${siteConfig.url}/terms`, changeFrequency: "yearly" as const, priority: 0.2 },
          { url: `${siteConfig.url}/cookies`, changeFrequency: "yearly" as const, priority: 0.2 },
        ]),
  ]

  const docs: MetadataRoute.Sitemap = getDocs().flatMap((doc) =>
    localized(`/docs/${doc.slug}`, translatedLocales(doc.slug), {
      changeFrequency: "weekly",
      priority: 0.7,
    })
  )

  const posts: MetadataRoute.Sitemap = getAllPosts().map((post) => ({
    url: `${siteConfig.url}/blog/${post.slug}`,
    lastModified: new Date(`${post.date}T00:00:00Z`),
    changeFrequency: "monthly",
    priority: 0.7,
  }))

  const categories: MetadataRoute.Sitemap = getCategories().map((c) => ({
    url: `${siteConfig.url}/blog/category/${c.slug}`,
    changeFrequency: "weekly",
    priority: 0.4,
  }))

  return [...staticRoutes, ...docs, ...posts, ...categories]
}
