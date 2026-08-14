import NextLink from "next/link"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Languages } from "lucide-react"
import { getDocs, getDoc, getDocContent, extractToc, slugify, translatedLocales } from "@/lib/docs"
import { OnThisPage } from "@/components/docs/on-this-page"
import { mapRepoHref } from "@/lib/markdown-links"
import { Link } from "@/i18n/navigation"
import { localeAlternates } from "@/i18n/alternates"
import { languageName } from "@/i18n/language-name"
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

// Every guide exists in every locale: one without a translation falls back to
// the English text rather than disappearing from the language it lacks.
export function generateStaticParams() {
  return getDocs().map((d) => ({ slug: d.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}): Promise<Metadata> {
  const { locale, slug } = await params
  const doc = getDoc(slug, locale)
  const t = await getTranslations({ locale, namespace: "docs" })
  return {
    title: `${doc?.title ?? t("title")} | ${siteConfig.name} ${t("title")}`,
    description: doc?.description,
    alternates: localeAlternates(`/docs/${slug}`, locale, translatedLocales(slug)),
  }
}

// These files live in docs/, so that is where their relative links resolve
// from. The mapping itself is shared with the changelog renderer, which reads
// files from the repository root: see src/lib/markdown-links.ts.
const mapHref = (href: string) => mapRepoHref(href, "docs")

export default async function DocPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  const doc = getDoc(slug, locale)
  if (!doc) notFound()
  const content = getDocContent(doc)
  const toc = extractToc(content)
  // The reader asked for a language this page does not have yet. Serving the
  // English text unannounced would read as a translation that stopped halfway;
  // saying so turns a gap into a stated fallback.
  const untranslated = doc.locale !== locale
  const tLanguage = await getTranslations("language")

  return (
    <div className="flex gap-10">
      {/* `lang` follows the text, not the URL: on a page that fell back, the
          prose is English inside an Italian document, and the notice above it
          is the one part actually written in the reader's language. */}
      <article
        lang={doc.locale}
        className="prose min-w-0 max-w-none flex-1 prose-headings:scroll-mt-24 prose-headings:tracking-tight prose-a:underline-offset-4 prose-code:before:content-none prose-code:after:content-none"
      >
        {untranslated && (
          <div
            className="not-prose mb-8 flex items-start gap-2.5 rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground"
            lang={locale}
          >
            <Languages className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <p>{tLanguage("notTranslated", { language: languageName(locale) })}</p>
          </div>
        )}
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
              // A link from one guide to another keeps the reader's language;
              // a link out of the section does not, because outside the docs
              // there is nothing translated to land on.
              if (mapped.startsWith("/docs")) return <Link href={mapped}>{children}</Link>
              return mapped.startsWith("/") ? (
                <NextLink href={mapped}>{children}</NextLink>
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
        {/* Same treatment as the guide list on the other side: pinned under
            the header, scrolling on its own when the outline is long. */}
        <div className="sticky top-[calc(var(--header-h,4.5rem)+2rem)] max-h-[calc(100dvh-var(--header-h,4.5rem)-4rem)] overflow-y-auto">
          <OnThisPage items={toc} />
        </div>
      </aside>
    </div>
  )
}
