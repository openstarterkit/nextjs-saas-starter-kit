"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { sections, useActiveSection } from "@/components/landing/use-active-section"

export function NavLinks() {
  const current = useActiveSection()
  const pathname = usePathname()

  const linkClass = (active: boolean) =>
    cn(
      "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
      active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent hover:text-foreground"
    )

  return (
    <nav className="hidden items-center gap-1 md:flex">
      {sections.map(({ id, label }) => (
        <Link key={id} href={`/#${id}`} className={linkClass(current === id)}>
          {label}
        </Link>
      ))}
      <Link href="/docs" className={linkClass(pathname.startsWith("/docs"))}>
        Docs
      </Link>
      <Link href="/changelog" className={linkClass(pathname.startsWith("/changelog"))}>
        Changelog
      </Link>
    </nav>
  )
}
