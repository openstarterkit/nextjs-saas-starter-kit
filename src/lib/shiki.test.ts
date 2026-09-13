import { describe, it, expect } from "vitest"
import React from "react"
import { renderToStaticMarkup } from "react-dom/server"
import Markdown from "react-markdown"
import { rehypeShikiPlugin } from "@/lib/shiki"

/**
 * The file name a fence declares has to survive two different markdown
 * pipelines to reach the header: MDXRemote in the blog, react-markdown in the
 * docs. They are separate libraries with separate rules about which properties
 * they hand to a custom component, and a `data-` attribute that one forwards
 * and the other drops would fail in the quietest way possible — the header
 * simply missing on half the site, with nothing in any log.
 *
 * So the round trip is pinned here rather than trusted.
 */

type PreProps = React.ComponentPropsWithoutRef<"pre"> & { "data-filename"?: string }

const render = (md: string) => {
  const props: PreProps[] = []
  renderToStaticMarkup(
    React.createElement(
      Markdown,
      {
        rehypePlugins: [rehypeShikiPlugin],
        components: {
          pre: (p: PreProps) => {
            props.push(p)
            return React.createElement("pre")
          },
        },
      },
      md
    )
  )
  return { props }
}

/** The same pipeline with nothing stubbed, so the coloured markup is visible. */
const renderPlain = (md: string) =>
  renderToStaticMarkup(
    React.createElement(Markdown, { rehypePlugins: [rehypeShikiPlugin] }, md)
  )

describe("the file name a fence declares", () => {
  it("reaches the component as data-filename", () => {
    const { props } = render('```ts title="src/lib/auth.ts"\nconst a = 1\n```\n')
    expect(props[0]["data-filename"]).toBe("src/lib/auth.ts")
  })

  it("is accepted as filename= too, because half the ecosystem writes it that way", () => {
    const { props } = render('```ts filename="prisma/schema.prisma"\nmodel User {}\n```\n')
    expect(props[0]["data-filename"]).toBe("prisma/schema.prisma")
  })

  it("is absent on a plain fence, which must keep working exactly as before", () => {
    const { props } = render("```ts\nconst a = 1\n```\n")
    expect(props[0]["data-filename"]).toBeUndefined()
  })
})

describe("highlighting", () => {
  it("colours the code at build time, with both themes in the markup", () => {
    const html = renderPlain("```ts\nconst a = 1\n```\n")
    // Two themes as CSS variables is what lets dark mode work without a second
    // render: if this ever becomes a single colour, the dark site breaks.
    expect(html).toContain("--shiki-dark")
    expect(html).toContain("shiki")
  })

  it("falls back to plain text for a language nobody imported, instead of failing", () => {
    // The synchronous highlighter can only know the grammars imported up front.
    // An unknown one must degrade, not throw: a fence in a new language should
    // never take a docs page down.
    expect(() => renderPlain("```brainfuck\n+++++\n```\n")).not.toThrow()
  })
})
