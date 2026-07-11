import { DOCS } from "@/lib/docs"
import { DocsNav } from "@/components/docs/docs-nav"

// Two-column docs shell: sticky sidebar on the left, content on the right.
// This layout wraps the /docs overview page inside the (public) route group
// so it keeps the landing footer while still showing the docs nav.
export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 pt-10 pb-10 md:px-6 md:pt-14">
      <div className="flex flex-col gap-8 md:flex-row md:gap-12">
        <aside className="md:w-52 md:shrink-0">
          <div className="md:sticky md:top-10">
            <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Documentation
            </p>
            <DocsNav items={DOCS.map((d) => ({ slug: d.slug, title: d.title }))} />
          </div>
        </aside>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  )
}
