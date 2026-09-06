import { describe, it, expect } from "vitest"

import { siteConfig } from "@/config/site"
import { pageMetadata } from "./metadata"

describe("pageMetadata", () => {
  it("carries the title and description it was given", () => {
    const out = pageMetadata({ title: "Pricing", description: "What it costs", path: "/pricing" })

    expect(out.title).toBe("Pricing")
    expect(out.description).toBe("What it costs")
  })

  it("falls back to the site description", () => {
    expect(pageMetadata({ title: "Pricing" }).description).toBe(siteConfig.description)
  })

  // `path` is a site path and the canonical has to be absolute. Building the
  // URL once here is what keeps the canonical and the Open Graph URL from
  // disagreeing, which is a duplicate-content report nobody sees on the page.
  it("builds one absolute URL and uses it for both the canonical and Open Graph", () => {
    const out = pageMetadata({ title: "Pricing", path: "/pricing" })

    expect(out.alternates?.canonical).toBe(`${siteConfig.url}/pricing`)
    expect(out.openGraph?.url).toBe(`${siteConfig.url}/pricing`)
  })

  it("defaults to the home path", () => {
    expect(pageMetadata({ title: "Home" }).alternates?.canonical).toBe(`${siteConfig.url}/`)
  })

  // Next merges metadata shallowly: a page declaring `openGraph` replaces the
  // parent's object instead of extending it. The helper exists so no page ends
  // up with a title and no description, which nothing on the site would show.
  it("repeats the title and description into both social blocks", () => {
    const out = pageMetadata({ title: "Pricing", description: "What it costs" })

    expect(out.openGraph).toMatchObject({
      title: "Pricing",
      description: "What it costs",
      siteName: siteConfig.name,
    })
    expect(out.twitter).toMatchObject({
      card: "summary_large_image",
      title: "Pricing",
      description: "What it costs",
    })
  })

  it("describes a page as a website unless told it is an article", () => {
    // `OpenGraph` is a union whose variants do not all carry a type, so the
    // property is read through a narrowing rather than asserted away.
    const ogType = (metadata: ReturnType<typeof pageMetadata>) => {
      const og = metadata.openGraph
      return og && "type" in og ? og.type : undefined
    }

    expect(ogType(pageMetadata({ title: "Pricing" }))).toBe("website")
    expect(ogType(pageMetadata({ title: "A post", type: "article" }))).toBe("article")
  })

  // This used to assert the opposite, on the assumption that the file
  // convention would be inherited and that naming an image here would override
  // a page's own. Neither holds: a page declaring `openGraph` replaces the
  // parent object and loses the inherited image, while a colocated file is
  // merged and wins anyway. The suite stayed green for months because the test
  // encoded the same assumption as the code it was checking.
  it("names the generated image in both social blocks", () => {
    const out = pageMetadata({ title: "Pricing" })

    expect(out.openGraph).toHaveProperty("images", ["/opengraph-image"])
    expect(out.twitter).toHaveProperty("images", ["/opengraph-image"])
  })
})
