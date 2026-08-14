"use client"

import { useTranslations } from "next-intl"

import Link from "next/link"
import { usePathname } from "@/i18n/navigation"
import { Menu } from "lucide-react"
import { GithubIcon } from "@/components/icons/github"
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
  starHref,
  isAuthenticated,
}: {
  signInHref: string
  /** Set only on the kit's own site: see the comment in `navbar.tsx`. */
  starHref?: string | null
  isAuthenticated: boolean
}) {
  const t = useTranslations("nav")
  const tCommon = useTranslations("common")
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
          aria-label={t("openMenu")}
          className="flex h-11 w-11 items-center justify-center rounded-[var(--radius)] text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground md:hidden"
        >
          <Menu size={24} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60 md:hidden">
        {sections.map(({ id }) => (
          <DropdownMenuItem key={id} asChild>
            <Link
              href={`/#${id}`}
              onClick={(e) => scrollToSection(e, id)}
              className={cn(
                current === id && "bg-primary/10 font-medium text-primary"
              )}
            >
              {t(id)}
            </Link>
          </DropdownMenuItem>
        ))}
        <DropdownMenuItem asChild>
          <Link href="/docs">Docs</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/blog">Blog</Link>
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
              <Link href={signInHref}>{t("signIn")}</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              {starHref ? (
                <a
                  href={starHref}
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-primary"
                >
                  <GithubIcon className="h-4 w-4" />
                  {tCommon("starOnGitHub")}
                </a>
              ) : (
                <Link
                  href="/#pricing"
                  onClick={(e) => scrollToSection(e, "pricing")}
                  className="font-semibold text-primary"
                >
                  {t("getStarted")}
                </Link>
              )}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
