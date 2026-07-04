"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"
import { sections, useActiveSection } from "@/components/landing/use-active-section"

export function NavLinks() {
  const current = useActiveSection()

  return (
    <nav className="hidden items-center gap-1 md:flex">
      {sections.map(({ id, label }) => (
        <Link
          key={id}
          href={`/#${id}`}
          className={cn(
            "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
            current === id
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-accent hover:text-foreground"
          )}
        >
          {label}
        </Link>
      ))}
    </nav>
  )
}
