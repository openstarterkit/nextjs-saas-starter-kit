import { describe, it, expect } from "vitest"
import fs from "node:fs"
import path from "node:path"
import matter from "gray-matter"
import { slugify, extractToc, getDocs } from "@/lib/docs"
import { routing } from "@/i18n/routing"

const ROOT = process.cwd()

describe("the docs index", () => {
  // `docs/README.md` is the entry point on GitHub, where the site's generated
  // sidebar does not exist. It had drifted two guides behind the folder and
  // nothing said so, which is the same failure as documentation that lies
  // about a folder it no longer ships.
  const index = fs.readFileSync(path.join(ROOT, "docs", "README.md"), "utf8")
  const guides = fs
    .readdirSync(path.join(ROOT, "docs"))
    .filter((f) => f.endsWith(".md") && f !== "README.md" && !/\.[a-z]{2}\.md$/.test(f))

  it("links every guide in the folder", () => {
    const missing = guides.filter((f) => !index.includes(`(./${f})`))
    expect(missing, `guide senza riga in docs/README.md:\n${missing.join("\n")}`).toEqual([])
  })

  it("links nothing that is not there", () => {
    const broken = [...index.matchAll(/\(\.\/([\w.-]+\.md)\)/g)]
      .map((m) => m[1])
      .filter((f) => !fs.existsSync(path.join(ROOT, "docs", f)))
    expect(broken, `link a file inesistenti:\n${broken.join("\n")}`).toEqual([])
  })
})

describe("docs in another language", () => {
  it("keeps every page, translated or not, so a gap is never a 404", () => {
    const source = getDocs(routing.defaultLocale)
    for (const locale of routing.locales) {
      const docs = getDocs(locale)
      expect(docs.map((d) => d.slug)).toEqual(source.map((d) => d.slug))
      for (const doc of docs) expect(fs.existsSync(doc.file)).toBe(true)
    }
  })

  it("says which language each page is actually written in", () => {
    // What the "you are reading the original" notice is decided on. Reading it
    // off the requested locale instead would make the notice never appear.
    for (const doc of getDocs("it")) {
      const translated = doc.file.endsWith(".it.md")
      expect(doc.locale, doc.file).toBe(translated ? "it" : routing.defaultLocale)
    }
  })
})

describe("the frontmatter of every translation", () => {
  // Both folders, read off disk rather than through getDocs: the tests run
  // with KIT_SITE unset, so getDocs only ever opens content/docs/ and the
  // repo's own docs/ folder is never parsed by anything else here.
  //
  // The regression: an unquoted colon in a description ("Ogni variabile
  // d'ambiente spiegata: database, ...") is invalid YAML. The build stayed
  // green, and the page fell back to English at request time with the
  // exception in a server log nobody reads. Every symptom of an untranslated
  // page, from a translation that was right there.
  const files = (["docs", path.join("content", "docs")] as const).flatMap((dir) => {
    const full = path.join(ROOT, dir)
    if (!fs.existsSync(full)) return []
    return fs
      .readdirSync(full)
      .filter((f) => /\.[a-z]{2}\.md$/.test(f))
      .map((f) => ({ label: `${dir}/${f}`, dir: full, file: f }))
  })

  it("has at least one to check", () => {
    expect(files.length).toBeGreaterThan(0)
  })

  it.each(files)("parses and declares its source: $label", ({ label, dir, file }) => {
    const raw = fs.readFileSync(path.join(dir, file), "utf8")
    let data: Record<string, unknown> = {}
    expect(() => {
      data = matter(raw).data
    }, `${label}: frontmatter YAML non valido (una descrizione con i due punti va tra virgolette)`).not.toThrow()

    for (const field of ["title", "description", "translated_from", "source_checksum"]) {
      expect(data[field], `${label}: manca "${field}" nel frontmatter`).toBeTruthy()
    }
    // Without this, check:translations silently skips a file whose
    // translated_from points at a guide that has since been renamed.
    expect(
      fs.existsSync(path.join(dir, String(data.translated_from))),
      `${label}: translated_from punta a un file che non esiste`,
    ).toBe(true)
  })
})

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
