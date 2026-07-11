import Link from "next/link"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { DOCS, getDoc, getDocContent, extractToc, slugify } from "@/lib/docs"
import { OnThisPage } from "@/components/docs/on-this-page"
import { siteConfig } from "@/config/site"

// Flatten a heading's React children to plain text, so its anchor id matches
// the slug the "On this page" outline links to.
function nodeText(node: React.ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node)
  if (Array.isArray(node)) return node.map(nodeText).join("")
  if (node && typeof node === "object" && "props" in node) {
    return nodeText((node as { props: { children?: React.ReactNode } }).props.children)
  }
  return ""
}

// Renders a guide from the repo's docs/ folder. The Markdown is the single
// source of truth: GitHub renders the files as-is, this page renders the
// same content inside the site shell.

export const dynamicParams = false

export function generateStaticParams() {
  return DOCS.map((d) => ({ slug: d.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const doc = getDoc(slug)
  return {
    title: `${doc?.title ?? "Docs"} | ${siteConfig.name} Docs`,
    description: doc?.description,
  }
}

// Repo-relative Markdown links → site or GitHub URLs, so the same files work
// in both renderers: ./guide.md → /docs/guide, ../FILE → the file on GitHub.
function mapHref(href: string): string {
  if (/^(https?:|mailto:|#|\/)/.test(href)) return href
  const clean = href.replace(/^\.\//, "")
  if (clean.startsWith("../")) {
    const repoUrl = siteConfig.links.github || "https://github.com/openstarterkit/nextjs-saas-starter-kit"
    return `${repoUrl}/blob/main/${clean.slice(3)}`
  }
  if (/(^|\/)README\.md$/.test(clean)) return "/docs"
  if (clean.endsWith(".md")) return `/docs/${clean.replace(/\.md$/, "")}`
  return href
}

export default async function DocPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const doc = getDoc(slug)
  if (!doc) notFound()
  const content = getDocContent(doc)
  const toc = extractToc(content)

  return (
    <div className="flex gap-10">
      <article className="prose min-w-0 max-w-none flex-1 prose-headings:scroll-mt-24 prose-headings:tracking-tight prose-a:underline-offset-4 prose-code:before:content-none prose-code:after:content-none">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            h2: ({ children }) => (
              <h2 id={slugify(nodeText(children))} className="scroll-mt-10">
                {children}
              </h2>
            ),
            h3: ({ children }) => (
              <h3 id={slugify(nodeText(children))} className="scroll-mt-10">
                {children}
              </h3>
            ),
            h4: ({ children }) => (
              <h4 id={slugify(nodeText(children))} className="scroll-mt-10">
                {children}
              </h4>
            ),
            a: ({ href, children }) => {
              const mapped = mapHref(href ?? "")
              return mapped.startsWith("/") ? (
                <Link href={mapped}>{children}</Link>
              ) : (
                <a href={mapped} target={/^https?:/.test(mapped) ? "_blank" : undefined} rel="noreferrer">
                  {children}
                </a>
              )
            },
          }}
        >
          {content}
        </ReactMarkdown>
      </article>

      <aside className="hidden w-52 shrink-0 xl:block">
        <div className="sticky top-10">
          <OnThisPage items={toc} />
        </div>
      </aside>
    </div>
  )
}
