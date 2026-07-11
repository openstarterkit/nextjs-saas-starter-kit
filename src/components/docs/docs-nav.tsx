"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

// Sidebar of the /docs section. Client component so the current page can
// stay highlighted (same pattern as the dashboard SidebarNav).
export function DocsNav({ items }: { items: { slug: string; title: string }[] }) {
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
        Overview
      </Link>
      {items.map((d) => (
        <Link key={d.slug} href={`/docs/${d.slug}`} className={linkClass(pathname === `/docs/${d.slug}`)}>
          {d.title}
        </Link>
      ))}
    </nav>
  )
}
