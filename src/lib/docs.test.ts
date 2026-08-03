import { describe, it, expect } from "vitest"
import { slugify, extractToc } from "@/lib/docs"

describe("slugify", () => {
  it("lowercases and joins words with hyphens", () => {
    expect(slugify("Getting Started")).toBe("getting-started")
  })

  it("drops inline Markdown markers", () => {
    expect(slugify("`env` **vars** and _paths_")).toBe("env-vars-and-paths")
  })

  it("keeps an underscore inside a word, matching the id the page renders", () => {
    expect(slugify("DATABASE_URL")).toBe("database_url")
    expect(slugify("STRIPE_WEBHOOK_SECRET")).toBe("stripe_webhook_secret")
  })

  it("drops punctuation but keeps existing hyphens", () => {
    expect(slugify("Billing & payments: what's included?")).toBe("billing-payments-whats-included")
    expect(slugify("Server-side rendering")).toBe("server-side-rendering")
  })

  it("collapses runs of whitespace into a single hyphen", () => {
    expect(slugify("  Deploy   to    Vercel  ")).toBe("deploy-to-vercel")
  })
})

describe("extractToc", () => {
  it("collects h2 and h3 with their depth", () => {
    const toc = extractToc(["## First", "text", "### Nested", "## Second"].join("\n"))
    expect(toc).toEqual([
      { depth: 2, text: "First", slug: "first" },
      { depth: 3, text: "Nested", slug: "nested" },
      { depth: 2, text: "Second", slug: "second" },
    ])
  })

  it("ignores h1 and h4, which the outline does not render", () => {
    const toc = extractToc(["# Title", "#### Too deep", "## Kept"].join("\n"))
    expect(toc.map((t) => t.text)).toEqual(["Kept"])
  })

  // The regression this guards: a shell comment inside a fenced block starts
  // with "#" and would otherwise land in the outline as a heading.
  it("skips headings inside fenced code blocks", () => {
    const toc = extractToc(
      ["## Real heading", "```bash", "## not a heading", "# nor this", "```", "## After the fence"].join("\n"),
    )
    expect(toc.map((t) => t.text)).toEqual(["Real heading", "After the fence"])
  })

  it("strips inline Markdown from the visible text, not just from the slug", () => {
    const [item] = extractToc("## The `env` **variable**")
    expect(item.text).toBe("The env variable")
    expect(item.slug).toBe("the-env-variable")
  })

  // The docs are full of env var names, and stripping underscores blindly
  // used to list this heading as "DATABASEURL".
  it("keeps underscores inside a word, so env var names survive", () => {
    const [item] = extractToc("## DATABASE_URL")
    expect(item.text).toBe("DATABASE_URL")
    expect(item.slug).toBe("database_url")
  })

  it("still removes underscores used as emphasis around a word", () => {
    expect(extractToc("## _emphasis_ matters")[0].text).toBe("emphasis matters")
    expect(extractToc("## __strong__ wording")[0].text).toBe("strong wording")
  })

  it("tolerates closing hashes and trailing spaces", () => {
    expect(extractToc("## Closed heading ##")[0].text).toBe("Closed heading")
  })

  it("returns an empty outline for a doc with no headings", () => {
    expect(extractToc("Just a paragraph.\n\nAnd another one.")).toEqual([])
  })
})
