import fs from "node:fs"
import path from "node:path"
import matter from "gray-matter"
import { isKitSite } from "@/config/kit"

/**
 * The documentation rendered at /docs, from one of two sources.
 *
 * **Your app** (the default) serves `content/docs/`: product documentation
 * for the people who use what you built. Same convention as `content/blog/`,
 * so adding a page is a Markdown file and a commit. The three files in there
 * are examples: rewrite them, add your own, delete the section from the
 * navbar and footer if you don't need it.
 *
 * **The kit's own site** (KIT_SITE="true") serves the repo's `docs/` folder
 * instead: the setup manual for developers who clone it. Those files have no
 * frontmatter, since GitHub renders them as-is, so their titles live in the
 * manifest below.
 */

export type DocEntry = {
  slug: string
  title: string
  description: string
  /** Absolute path of the Markdown file backing this entry. */
  file: string
}

const KIT_DOCS_DIR = path.join(process.cwd(), "docs")
const PRODUCT_DOCS_DIR = path.join(process.cwd(), "content", "docs")

/** Setup manual, in reading order. Only used when KIT_SITE="true". */
const KIT_DOCS: DocEntry[] = [
  {
    slug: "getting-started",
    title: "Getting started",
    description: "From git clone to a running app in about 10 minutes.",
    file: "getting-started.md",
  },
  {
    slug: "configuration",
    title: "Configuration",
    description: "Every env var explained: database, OAuth, Stripe, email, branding.",
    file: "configuration.md",
  },
  {
    slug: "authentication",
    title: "Authentication",
    description: "OAuth, magic link, email + password, reset and account linking.",
    file: "authentication.md",
  },
  {
    slug: "billing",
    title: "Billing & payments",
    description: "Subscriptions, one-time payments, usage-based billing and entitlements.",
    file: "billing.md",
  },
  {
    slug: "blog",
    title: "Blog & content",
    description: "File-based MDX blog with categories, RSS and per-post SEO.",
    file: "blog.md",
  },
  {
    slug: "newsletter",
    title: "Newsletter & waitlist",
    description: "Double opt-in mailing list, consent record, Resend sync and admin export.",
    file: "newsletter.md",
  },
  {
    slug: "deployment",
    title: "Deployment",
    description: "Ship to Vercel: production env, migrations, webhooks, going admin.",
    file: "deployment.md",
  },
].map((d) => ({ ...d, file: path.join(KIT_DOCS_DIR, d.file) }))

/**
 * Your product docs, read from content/docs/. Frontmatter carries `title`,
 * `description` and `order` (the position in the sidebar; ties fall back to
 * filename order).
 */
function loadProductDocs(): DocEntry[] {
  if (!fs.existsSync(PRODUCT_DOCS_DIR)) return []
  const entries: (DocEntry & { order: number })[] = []
  for (const file of fs.readdirSync(PRODUCT_DOCS_DIR).sort()) {
    if (!file.endsWith(".md")) continue
    const { data } = matter(fs.readFileSync(path.join(PRODUCT_DOCS_DIR, file), "utf8"))
    // Fail loud on malformed frontmatter instead of shipping a broken nav.
    for (const field of ["title", "description"] as const) {
      if (!data[field]) throw new Error(`content/docs/${file}: missing "${field}" in frontmatter`)
    }
    entries.push({
      slug: file.replace(/\.md$/, ""),
      title: String(data.title),
      description: String(data.description),
      file: path.join(PRODUCT_DOCS_DIR, file),
      order: Number(data.order ?? Number.MAX_SAFE_INTEGER),
    })
  }
  return entries
    .sort((a, b) => a.order - b.order)
    .map(({ slug, title, description, file }) => ({ slug, title, description, file }))
}

export const DOCS: DocEntry[] = isKitSite ? KIT_DOCS : loadProductDocs()

export function getDoc(slug: string): DocEntry | undefined {
  return DOCS.find((d) => d.slug === slug)
}

export function getDocContent(doc: DocEntry): string {
  // Product docs carry frontmatter; the page renders the body only.
  return matter(fs.readFileSync(doc.file, "utf8")).content
}

/**
 * Removes the inline Markdown markers from a heading's text.
 *
 * Underscores follow the CommonMark rule: they mark emphasis only at a word
 * boundary (`_emphasis_`), never inside one. Stripping them unconditionally
 * turned "DATABASE_URL" into "DATABASEURL" in the outline, which matters here
 * because the docs are full of env var names.
 */
function stripInlineMarkdown(text: string): string {
  return text.replace(/[`*~]/g, "").replace(/(?<!\w)_+|_+(?!\w)/g, "")
}

/** GitHub-style heading slug. Kept in sync with the heading ids the page renders. */
export function slugify(text: string): string {
  return stripInlineMarkdown(text.toLowerCase().trim())
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
}

export type TocItem = { depth: number; text: string; slug: string }

/**
 * Pulls the h2/h3 headings out of a Markdown doc for the "On this page"
 * outline. Skips fenced code blocks so a `#` comment inside one isn't
 * mistaken for a heading.
 */
export function extractToc(markdown: string): TocItem[] {
  const toc: TocItem[] = []
  let inFence = false
  for (const line of markdown.split("\n")) {
    if (line.startsWith("```")) {
      inFence = !inFence
      continue
    }
    if (inFence) continue
    const match = /^(#{2,3})\s+(.+?)\s*#*$/.exec(line)
    if (match) {
      const text = stripInlineMarkdown(match[2]).trim()
      toc.push({ depth: match[1].length, text, slug: slugify(text) })
    }
  }
  return toc
}
