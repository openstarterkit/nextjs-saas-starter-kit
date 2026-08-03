import { describe, it, expect } from "vitest"

// Both siteConfig and the docs manifest read the environment when they are
// first imported, so it has to be in place before the module under test pulls
// them in. KIT_SITE picks the setup manual in docs/ as the published set,
// which is the case these links are written for.
process.env.NEXT_PUBLIC_GITHUB_URL = "https://github.com/acme/kit"
process.env.KIT_SITE = "true"
const { mapRepoHref } = await import("./markdown-links")

const BLOB = "https://github.com/acme/kit/blob/main"

describe("mapRepoHref", () => {
  it("leaves alone what is already a usable link", () => {
    for (const href of [
      "https://example.com/page",
      "http://example.com",
      "mailto:hello@example.com",
      "#section",
      "/pricing",
    ]) {
      expect(mapRepoHref(href)).toBe(href)
    }
  })

  // The case the changelog page was getting wrong: these render as-is and ask
  // the browser for /docs/blog.md, which is a 404.
  it("points a repo link to the published guide, from the repository root", () => {
    expect(mapRepoHref("./docs/blog.md")).toBe("/docs/blog")
    expect(mapRepoHref("docs/billing.md")).toBe("/docs/billing")
  })

  // GitHub writes "Branding & theming" as branding--theming, this site as
  // branding-theming: without the translation the link lands on the page and
  // not on the section, which is the kind of half-broken link nobody reports.
  it("translates a GitHub anchor into the one the site generates", () => {
    expect(mapRepoHref("./docs/configuration.md#branding--theming")).toBe(
      "/docs/configuration#branding-theming",
    )
    expect(mapRepoHref("./docs/billing.md#usage-based")).toBe("/docs/billing#usage-based")
  })

  // On files that stay on GitHub the anchor must not be touched: there the
  // repository form is the correct one.
  it("leaves the anchor alone on links that stay on GitHub", () => {
    expect(mapRepoHref("./README.md#-a--b")).toBe(`${BLOB}/README.md#-a--b`)
  })

  // Same href, two meanings: from docs/ it is the docs index, from the root it
  // is the project README, which has no page on the site.
  it("resolves relative to the directory the file lives in", () => {
    expect(mapRepoHref("./configuration.md", "docs")).toBe("/docs/configuration")
    expect(mapRepoHref("./README.md", "docs")).toBe("/docs")
    expect(mapRepoHref("./README.md#-tests")).toBe(`${BLOB}/README.md#-tests`)
  })

  it("sends files with no page on the site to the repository", () => {
    expect(mapRepoHref("../ROADMAP.md", "docs")).toBe(`${BLOB}/ROADMAP.md`)
    expect(mapRepoHref("./LICENSE")).toBe(`${BLOB}/LICENSE`)
  })

  it("does not invent a link when the path climbs out of the repository", () => {
    expect(mapRepoHref("../../elsewhere.md")).toBe("../../elsewhere.md")
  })
})
