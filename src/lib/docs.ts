import fs from "node:fs"
import path from "node:path"

/**
 * Manifest of the documentation rendered at /docs. The single source of
 * truth is the Markdown in the repo's docs/ folder (readable on GitHub as
 * well); the site renders those same files, so the two never drift.
 */
export const DOCS = [
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
    slug: "deployment",
    title: "Deployment",
    description: "Ship to Vercel: production env, migrations, webhooks, going admin.",
    file: "deployment.md",
  },
] as const

export type DocEntry = (typeof DOCS)[number]

const DOCS_DIR = path.join(process.cwd(), "docs")

export function getDoc(slug: string): DocEntry | undefined {
  return DOCS.find((d) => d.slug === slug)
}

export function getDocContent(doc: DocEntry): string {
  return fs.readFileSync(path.join(DOCS_DIR, doc.file), "utf8")
}

/** GitHub-style heading slug. Kept in sync with the heading ids the page renders. */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[`*_~]/g, "")
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
      const text = match[2].replace(/[`*_~]/g, "").trim()
      toc.push({ depth: match[1].length, text, slug: slugify(text) })
    }
  }
  return toc
}
