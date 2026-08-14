"use client"

import { useTranslations } from "next-intl"

import Link from "next/link"
import { usePathname } from "@/i18n/navigation"
import { cn } from "@/lib/utils"
import { sections, useActiveSection } from "@/components/landing/use-active-section"

export function NavLinks() {
  const t = useTranslations("nav")
  const current = useActiveSection()
  const pathname = usePathname()

  const linkClass = (active: boolean) =>
    cn(
      "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
      active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent hover:text-foreground"
    )

  return (
    <nav className="hidden items-center gap-1 md:flex">
      {sections.map(({ id }) => (
        <Link key={id} href={`/#${id}`} className={linkClass(current === id)}>
          {t(id)}
        </Link>
      ))}
      <Link href="/docs" className={linkClass(pathname.startsWith("/docs"))}>
        {t("docs")}
      </Link>
      <Link href="/blog" className={linkClass(pathname.startsWith("/blog"))}>
        {t("blog")}
      </Link>
      <Link href="/changelog" className={linkClass(pathname.startsWith("/changelog"))}>
        {t("changelog")}
      </Link>
    </nav>
  )
}
