import { getTranslations } from "next-intl/server"
import { DocsSidebar } from "@/components/docs/docs-sidebar"
import { StarOnGitHub } from "@/components/docs/star-on-github"
import { ContactDialog } from "@/components/landing/contact-dialog"
import { HelpCircle } from "lucide-react"

// Two-column docs shell: sticky sidebar on the left, rendered guide on the right.
// Same paddings as the index in `(public)/docs/layout.tsx`, so moving between
// the two does not shift the column.
export default async function DocsSlugLayout({ children }: { children: React.ReactNode }) {
  const t = await getTranslations("docs")

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pt-10 pb-10 md:px-6 md:pt-14">
      <div className="flex flex-col gap-8 md:flex-row md:gap-12">
        <DocsSidebar />
        <div className="min-w-0 flex-1">{children}</div>
      </div>

      <StarOnGitHub />

      <div className="mt-16 flex items-center justify-center gap-2 text-center text-sm text-muted-foreground">
        <HelpCircle className="h-4 w-4 text-primary" />
        <span>
          {t("needHelp")}{" "}
          <ContactDialog
            trigger={
              <button type="button" className="text-foreground underline underline-offset-4 hover:text-primary transition-colors font-medium cursor-pointer">
                {t("contactSupport")}
              </button>
            }
          />
        </span>
      </div>
      {/* The attribution badge used to sit here as well. It is in the footer
          this layout now has, and two of them on one page is one too many. */}
    </div>
  )
}
