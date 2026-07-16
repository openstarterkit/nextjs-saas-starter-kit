"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { sections, useActiveSection } from "@/components/landing/use-active-section"

export function MobileMenu({
  signInHref,
  isAuthenticated,
}: {
  signInHref: string
  isAuthenticated: boolean
}) {
  const current = useActiveSection()
  const pathname = usePathname()

  function scrollToSection(e: React.MouseEvent, id: string) {
    if (pathname !== "/") return
    e.preventDefault()
    const el = document.getElementById(id)
    if (el) {
      setTimeout(() => {
        el.scrollIntoView({ behavior: "smooth" })
        history.replaceState(null, "", `/#${id}`)
      }, 150)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          aria-label="Open menu"
          className="flex h-11 w-11 items-center justify-center rounded-[var(--radius)] text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground md:hidden"
        >
          <Menu size={24} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60 md:hidden">
        {sections.map(({ id, label }) => (
          <DropdownMenuItem key={id} asChild>
            <Link
              href={`/#${id}`}
              onClick={(e) => scrollToSection(e, id)}
              className={cn(
                current === id && "bg-primary/10 font-medium text-primary"
              )}
            >
              {label}
            </Link>
          </DropdownMenuItem>
        ))}
        <DropdownMenuItem asChild>
          <Link href="/docs">Docs</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/changelog">Changelog</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {isAuthenticated ? (
          <DropdownMenuItem asChild>
            <Link href="/dashboard">Dashboard</Link>
          </DropdownMenuItem>
        ) : (
          <>
            <DropdownMenuItem asChild>
              <Link href={signInHref}>Sign in</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link
                href="/#pricing"
                onClick={(e) => scrollToSection(e, "pricing")}
                className="font-semibold text-primary"
              >
                Get started
              </Link>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
