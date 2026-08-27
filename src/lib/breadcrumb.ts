import { siteConfig } from "@/config/site"

/**
 * One trail, two outputs.
 *
 * A breadcrumb has to exist twice: as the row a reader clicks, and as the
 * BreadcrumbList search engines read to replace the bare URL under a result
 * with the path through the site. Building both from the same array is the
 * point of this module, because the failure mode of writing them separately is
 * silent: the markup keeps validating while it describes a trail the page no
 * longer shows.
 *
 * `href` is a path, not a URL. The visible component needs a relative link and
 * the structured data needs an absolute one, so the absolute form is built
 * here rather than typed twice.
 */
export type Crumb = { name: string; href: string }

export function breadcrumbJsonLd(trail: Crumb[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: `${siteConfig.url}${crumb.href}`,
    })),
  }
}
