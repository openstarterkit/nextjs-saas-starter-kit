import rehypeShikiFromHighlighter from "@shikijs/rehype/core"
import { createHighlighterCoreSync } from "shiki/core"
import { createJavaScriptRegexEngine } from "shiki/engine/javascript"

import githubLight from "shiki/themes/github-light.mjs"
import githubDark from "shiki/themes/github-dark.mjs"

import bash from "shiki/langs/bash.mjs"
import css from "shiki/langs/css.mjs"
import html from "shiki/langs/html.mjs"
import javascript from "shiki/langs/javascript.mjs"
import json from "shiki/langs/json.mjs"
import markdown from "shiki/langs/markdown.mjs"
import mdx from "shiki/langs/mdx.mjs"
import prisma from "shiki/langs/prisma.mjs"
import sql from "shiki/langs/sql.mjs"
import tsx from "shiki/langs/tsx.mjs"
import typescript from "shiki/langs/typescript.mjs"

/**
 * Syntax highlighting for the docs and the blog, shared so the two cannot
 * drift: they run different markdown pipelines (MDXRemote in the blog,
 * ReactMarkdown in the docs) and would otherwise be styled by two
 * configurations that agree today and diverge in six months.
 *
 * It runs at build time and ships **no JavaScript to the browser**: what
 * reaches the page is already-coloured markup. The only client-side part of a
 * code block is the copy button beside it.
 *
 * Two themes rather than one, because the kit has a dark mode and a single
 * theme looks wrong in half of it. Shiki writes both colours into the markup as
 * CSS variables and globals.css picks the one that matches — no second render,
 * no flash, nothing to hydrate.
 *
 * WHY THE SYNCHRONOUS HIGHLIGHTER, which is the part worth understanding
 * before changing anything here: `react-markdown` runs its pipeline with
 * `runSync`, and the convenient version of this plugin loads grammars on
 * demand, asynchronously. Putting the two together fails at request time with
 * "`runSync` finished async" — a 500 on every docs page, and only there,
 * because the blog's MDXRemote is async and would have hidden the problem.
 *
 * So the grammars are imported up front and the highlighter is built
 * synchronously. The cost is that this list IS the set of languages the kit
 * highlights: a fence in a language missing from it renders as plain text
 * rather than failing. Add the import when you add the language.
 */
const highlighter = createHighlighterCoreSync({
  themes: [githubLight, githubDark],
  langs: [bash, css, html, javascript, json, markdown, mdx, prisma, sql, tsx, typescript],
  // The JavaScript engine rather than the WebAssembly one: no .wasm to load,
  // which is what makes a synchronous highlighter possible at all.
  engine: createJavaScriptRegexEngine(),
})

type HastNode = {
  type: string
  tagName?: string
  properties?: Record<string, unknown>
  data?: { meta?: string }
  children?: HastNode[]
}

/**
 * Writes the language a fence asked for into its meta string, before Shiki
 * runs. The code block's header shows it ("TypeScript", "Terminal") when the
 * fence names no file, and Shiki would otherwise lose it: a language that is
 * not imported above is highlighted as "text", and that is all the result
 * would remember. Riding on the meta string, it reaches the component the same
 * way the file name does, through `parseMetaString` below.
 */
function annotateLanguages(node: HastNode) {
  if (node.tagName === "pre") {
    const code = node.children?.[0]
    const classes = code?.properties?.className
    const languageClass = Array.isArray(classes)
      ? classes.find((c): c is string => typeof c === "string" && c.startsWith("language-"))
      : undefined
    if (code && languageClass) {
      const meta = code.data?.meta ?? String(code.properties?.metastring ?? "")
      code.data = { ...code.data, meta: `${meta} lang="${languageClass.slice("language-".length)}"`.trim() }
    }
    return
  }
  node.children?.forEach(annotateLanguages)
}

const shikiOptions = {
  themes: { light: "github-light", dark: "github-dark" },
  fallbackLanguage: "text",
  /**
   * Lets a fence name the file it comes from:
   *
   *     ```ts title="src/lib/auth.ts"
   *
   * The value is handed to the `pre` element as a data attribute, which is
   * how it reaches the React component that draws the header. `filename` is
   * accepted as well because half the ecosystem writes it that way, and a
   * fence that silently loses its title is the kind of thing an author
   * notices only after publishing.
   */
  parseMetaString(meta: string) {
    const file = meta.match(/(?:title|filename)="([^"]+)"/)
    const lang = meta.match(/(?:^|\s)lang="([^"]+)"/)
    return {
      ...(file ? { "data-filename": file[1] } : {}),
      ...(lang ? { "data-language": lang[1] } : {}),
    }
  },
}

/** Shiki, with the fence's language saved first (annotateLanguages). */
function rehypeCodeBlocks() {
  const shiki = rehypeShikiFromHighlighter(highlighter, shikiOptions)
  return (tree: HastNode) => {
    annotateLanguages(tree)
    return (shiki as unknown as (tree: HastNode) => unknown)(tree)
  }
}

export const rehypeShikiPlugin: [typeof rehypeCodeBlocks] = [rehypeCodeBlocks]
