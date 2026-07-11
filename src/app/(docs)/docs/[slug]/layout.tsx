import { DOCS } from "@/lib/docs"
import { DocsNav } from "@/components/docs/docs-nav"
import { PoweredBy } from "@/components/powered-by"
import { ContactDialog } from "@/components/landing/contact-dialog"
import { HelpCircle } from "lucide-react"

// Two-column docs shell: sticky sidebar on the left, rendered guide on the right.
export default function DocsSlugLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 pt-10 pb-8 md:px-6 md:pt-14 md:pb-12">
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

      <div className="mt-48 flex items-center justify-center gap-2 text-center text-sm text-muted-foreground">
        <HelpCircle className="h-4 w-4 text-primary" />
        <span>
          Need help?{" "}
          <ContactDialog
            trigger={
              <button type="button" className="text-foreground underline underline-offset-4 hover:text-primary transition-colors font-medium cursor-pointer">
                Contact Support
              </button>
            }
          />
        </span>
      </div>

      <div className="mt-24 flex justify-center border-t border-border/40 pt-12">
        <PoweredBy />
      </div>
    </div>
  )
}
