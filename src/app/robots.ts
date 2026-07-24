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
    sitemap: `${siteConfig.url}/sitemap.xml`,
  }
}
