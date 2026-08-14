import fs from "node:fs"
import path from "node:path"
import matter from "gray-matter"
import { isKitSite } from "@/config/kit"
import { routing } from "@/i18n/routing"

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
 *
 * ## Translations
 *
 * A translated page is a file next to its source with the locale in the name:
 * `getting-started.md` is translated by `getting-started.it.md`. Nothing else
 * is needed, and nothing has to be translated: a page with no variant for the
 * requested locale is served in English rather than 404, so you can translate
 * one guide and leave the rest.
 *
 * Translations carry frontmatter even where their source does not, because
 * they need to say two things the source cannot: the title in that language,
 * and which revision of the source they were written from. See
 * `translationOf` below.
 */

export type DocEntry = {
  slug: string
  title: string
  description: string
  /**
   * Absolute path of the Markdown file to render: the translation when there
   * is one for the requested locale, otherwise the English source.
   */
  file: string
  /**
   * Absolute path of the English source. Repo relative links inside a doc
   * resolve against this, so a translated page still links to `/docs/billing`
   * and not to a file name that only exists in one language.
   */
  source: string
  /** Language the rendered file is actually written in. */
  locale: string
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
    slug: "i18n",
    title: "Languages",
    description: "Add a language, translate the docs, and the checks that catch a stale one.",
    file: "i18n.md",
  },
  {
    slug: "deployment",
    title: "Deployment",
    description: "Ship to Vercel: production env, migrations, webhooks, going admin.",
    file: "deployment.md",
  },
].map((d) => {
  const file = path.join(KIT_DOCS_DIR, d.file)
  return { ...d, file, source: file, locale: routing.defaultLocale }
})

/** `getting-started.md` in locale `it` → `getting-started.it.md`. */
function variantPath(source: string, locale: string): string {
  return source.replace(/\.md$/, `.${locale}.md`)
}

/** True for `getting-started.it.md`, false for `getting-started.md`. */
function isTranslation(file: string): boolean {
  return new RegExp(`\\.(${routing.locales.join("|")})\\.md$`).test(file)
}

/**
 * Your product docs, read from content/docs/. Frontmatter carries `title`,
 * `description` and `order` (the position in the sidebar; ties fall back to
 * filename order).
 */
function loadProductDocs(): DocEntry[] {
  if (!fs.existsSync(PRODUCT_DOCS_DIR)) return []
  const entries: (DocEntry & { order: number })[] = []
  for (const file of fs.readdirSync(PRODUCT_DOCS_DIR).sort()) {
    // Translations are variants of an entry, not entries of their own:
    // `projects.it.md` must not become a fourth guide with slug "projects.it".
    if (!file.endsWith(".md") || isTranslation(file)) continue
    const { data } = matter(fs.readFileSync(path.join(PRODUCT_DOCS_DIR, file), "utf8"))
    // Fail loud on malformed frontmatter instead of shipping a broken nav.
    for (const field of ["title", "description"] as const) {
      if (!data[field]) throw new Error(`content/docs/${file}: missing "${field}" in frontmatter`)
    }
    const full = path.join(PRODUCT_DOCS_DIR, file)
    entries.push({
      slug: file.replace(/\.md$/, ""),
      title: String(data.title),
      description: String(data.description),
      file: full,
      source: full,
      locale: routing.defaultLocale,
      order: Number(data.order ?? Number.MAX_SAFE_INTEGER),
    })
  }
  entries.sort((a, b) => a.order - b.order)
  return entries.map((e) => ({
    slug: e.slug,
    title: e.title,
    description: e.description,
    file: e.file,
    source: e.source,
    locale: e.locale,
  }))
}

/** The English manifest, read from disk once. */
let sourceDocs: DocEntry[] | undefined
function getSourceDocs(): DocEntry[] {
  sourceDocs ??= isKitSite ? KIT_DOCS : loadProductDocs()
  return sourceDocs
}

/**
 * Swaps an entry for its translation when one exists on disk.
 *
 * The translated file supplies its own `title` and `description`: a sidebar
 * that lists Italian pages under English titles reads as a bug, and the kit's
 * own guides have no frontmatter in English to translate in place.
 */
function translated(entry: DocEntry, locale: string): DocEntry {
  const file = variantPath(entry.source, locale)
  if (!fs.existsSync(file)) return entry
  const { data } = matter(fs.readFileSync(file, "utf8"))
  return {
    ...entry,
    file,
    locale,
    title: data.title ? String(data.title) : entry.title,
    description: data.description ? String(data.description) : entry.description,
  }
}

const byLocale = new Map<string, DocEntry[]>()

/** The documentation index as the given locale sees it. */
export function getDocs(locale: string = routing.defaultLocale): DocEntry[] {
  if (locale === routing.defaultLocale) return getSourceDocs()
  let docs = byLocale.get(locale)
  if (!docs) {
    docs = getSourceDocs().map((entry) => translated(entry, locale))
    byLocale.set(locale, docs)
  }
  return docs
}

export function getDoc(slug: string, locale?: string): DocEntry | undefined {
  return getDocs(locale).find((d) => d.slug === slug)
}

/**
 * The locales a page is genuinely written in, English always included.
 *
 * This is what decides `hreflang`, and getting it from the list of configured
 * locales instead would be the classic own goal: declaring an alternate for a
 * page that falls back tells a search engine that two URLs hold the same
 * words in different languages, when they hold the same words full stop. That
 * is duplicate content, published by us, about ourselves.
 */
export function translatedLocales(slug: string): string[] {
  return routing.locales.filter(
    (locale) => locale === routing.defaultLocale || getDoc(slug, locale)?.locale === locale
  )
}

export function getDocContent(doc: DocEntry): string {
  // Product docs carry frontmatter, and every translation does; the page
  // renders the body only.
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
