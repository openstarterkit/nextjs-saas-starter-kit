import type { Metadata } from "next"
import ReactMarkdown, { type Components } from "react-markdown"
import remarkGfm from "remark-gfm"
import { getChangelog, CHANGELOG_BASE_DIR } from "@/lib/changelog"
import { mapRepoHref } from "@/lib/markdown-links"
import { Badge } from "@/components/ui/badge"
import { siteConfig } from "@/config/site"

// The entries are written for the repository, where `./docs/blog.md` is the
// right link. Here the same string would ask the browser for a page that does
// not exist, so it is translated first (shared with the docs renderer).
// External links then leave the site: open those in a new tab.
const markdownComponents: Components = {
  // Only href/title/children reach the DOM: react-markdown's extra props
  // (like the mdast `node`) must not leak onto the element.
  a: ({ href, title, children }) => {
    const mapped = mapRepoHref(href ?? "", CHANGELOG_BASE_DIR)
    const isExternal = /^https?:\/\//.test(mapped)
    return (
      <a href={mapped} title={title} {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
        {children}
      </a>
    )
  },
}

export const metadata: Metadata = {
  title: `Changelog | ${siteConfig.name}`,
  description: `Every ${siteConfig.name} release: new features, changes and fixes.`,
}

function formatDate(iso: string | null) {
  if (!iso) return "Unreleased"
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  })
}

// Renders the repo root CHANGELOG.md as a release timeline. The version is
// the visual anchor of each entry: big brand-gradient pill, date beneath,
// body subordinate on the timeline rail.
export default function ChangelogPage() {
  const { intro, releases } = getChangelog()

  return (
    <section className="py-24">
      <div className="mx-auto max-w-5xl px-6">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Changelog
          </h1>
          {intro && (
            <div className="prose mt-4 max-w-none text-sm prose-p:my-2">
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{intro}</ReactMarkdown>
            </div>
          )}
        </div>

        <div className="mt-16 space-y-16">
          {releases.map((release, i) => (
            <section
              key={release.version}
              className="grid grid-cols-1 gap-x-10 gap-y-4 md:grid-cols-[190px_minmax(0,1fr)]"
            >
              {/* top-24 + 20px: clears the sticky header also when the demo
                  banner sits above the navbar and makes it taller. */}
              <div className="md:sticky md:top-[116px] md:self-start">
                <div className="flex items-center gap-2.5">
                  <span className="inline-block rounded-full px-4 py-1.5 text-lg font-bold tracking-tight text-primary-foreground shadow-soft [background-image:var(--gradient-brand)]">
                    v{release.version}
                  </span>
                  {i === 0 && <Badge variant="secondary">Latest</Badge>}
                </div>
                <p className="mt-2.5 text-sm text-muted-foreground">{formatDate(release.date)}</p>
              </div>

              <div className="relative border-l border-border pl-8 pb-2 md:pl-10">
                <span className="absolute -left-[5px] top-2.5 h-2.5 w-2.5 rounded-full bg-primary shadow-[0_0_0_4px_var(--background)]" />
                <article className="prose max-w-none prose-headings:tracking-tight prose-h3:mt-6 prose-h3:text-base prose-code:before:content-none prose-code:after:content-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{release.body}</ReactMarkdown>
                </article>
              </div>
            </section>
          ))}
        </div>
      </div>
    </section>
  )
}
