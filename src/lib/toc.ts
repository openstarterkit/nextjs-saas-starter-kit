import type React from "react"

/**
 * Heading slugs and the "on this page" outline, shared by the docs and the
 * blog.
 *
 * The two halves have to agree or the outline links to anchors that do not
 * exist, so they are deliberately the same functions rather than two similar
 * ones: `extractToc` reads the source to build the list, and the page renders
 * its headings through `slugify(nodeText(children))`. Change the rule here and
 * both sides move together.
 */

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
 * Pulls the h2/h3 headings out of a Markdown or MDX document for the "On this
 * page" outline. Skips fenced code blocks so a `#` comment inside one isn't
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

/**
 * Flattens what a Markdown or MDX renderer hands a heading component into
 * plain text, so the id can be derived from the same string `extractToc` read
 * out of the source. A heading may arrive as nested elements when it contains
 * inline code or emphasis.
 */
export function nodeText(node: React.ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node)
  if (Array.isArray(node)) return node.map(nodeText).join("")
  if (node && typeof node === "object" && "props" in node) {
    return nodeText((node as { props: { children?: React.ReactNode } }).props.children)
  }
  return ""
}
