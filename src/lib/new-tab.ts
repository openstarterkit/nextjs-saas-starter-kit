/**
 * Props for a link that leaves the site.
 *
 * A demo lives on its own domain, and a visitor who opens it should not lose
 * the page they were reading: an absolute URL opens in a new tab. A relative
 * one (the local /login a clone falls back to) stays in the same tab.
 */
export function newTab(href: string | null | undefined) {
  return href && /^https?:\/\//.test(href) ? { target: "_blank", rel: "noopener noreferrer" } : {}
}
