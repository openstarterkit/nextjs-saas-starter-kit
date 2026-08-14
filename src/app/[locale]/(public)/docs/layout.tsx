import { DocsSidebar } from "@/components/docs/docs-sidebar"
import { StarOnGitHub } from "@/components/docs/star-on-github"

// Two-column docs shell: sticky sidebar on the left, content on the right.
// This layout wraps the /docs overview page inside the (public) route group
// so it keeps the landing footer while still showing the docs nav.
export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 pt-10 pb-10 md:px-6 md:pt-14">
      <div className="flex flex-col gap-8 md:flex-row md:gap-12">
        <DocsSidebar />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
      {/* Every page of the docs ends with it, the index included: it is the
          one place a reader is asked for anything. */}
      <StarOnGitHub />
    </div>
  )
}
