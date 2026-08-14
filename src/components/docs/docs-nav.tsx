"use client"

import { useTranslations } from "next-intl"
import { Link, usePathname } from "@/i18n/navigation"
import { cn } from "@/lib/utils"

// Sidebar of the /docs section. Client component so the current page can
// stay highlighted (same pattern as the dashboard SidebarNav).
//
// Links and pathname come from `@/i18n/navigation`, not from `next/link`: a
// reader on `/it/docs` has to stay in Italian when moving between guides, and
// the highlight has to compare `/docs/billing` against a pathname that has
// already had the prefix taken off it.
export function DocsNav({ items }: { items: { slug: string; title: string }[] }) {
  const t = useTranslations("docs")
  const pathname = usePathname()
  const linkClass = (active: boolean) =>
    cn(
      "block rounded-lg px-3 py-1.5 text-sm transition-colors",
      active
        ? "bg-primary/10 font-medium text-primary"
        : "text-muted-foreground hover:bg-muted hover:text-foreground"
    )

  return (
    <nav className="flex flex-col gap-1">
      <Link href="/docs" className={linkClass(pathname === "/docs")}>
        {t("overview")}
      </Link>
      {items.map((d) => (
        <Link key={d.slug} href={`/docs/${d.slug}`} className={linkClass(pathname === `/docs/${d.slug}`)}>
          {d.title}
        </Link>
      ))}
    </nav>
  )
}
