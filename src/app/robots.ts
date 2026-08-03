import type { MetadataRoute } from "next"
import { siteConfig } from "@/config/site"

/**
 * Crawling policy: public pages are open, app surfaces (dashboard, admin,
 * auth flows, API) are not useful to index. Served at /robots.txt.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard", "/admin", "/api/", "/verify-request", "/reset-password"],
    },
    // A demo deployment is `noindex` (see the root layout) and stays crawlable
    // on purpose, so engines can read that noindex. It just has no sitemap to
    // offer: advertising URLs we ask them to ignore is pure noise.
    sitemap: process.env.DEMO_MODE === "true" ? undefined : `${siteConfig.url}/sitemap.xml`,
  }
}
