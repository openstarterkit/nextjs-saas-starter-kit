"use client"

import { useTranslations } from "next-intl"

import Link from "next/link"
import { useRenderedPathname } from "@/hooks/use-rendered-pathname"
import {
  ArrowLeft,
  ArrowUpRight,
  Code,
  CreditCard,
  FolderKanban,
  LayoutGrid,
  Settings,
  Shield,
} from "lucide-react"
import { cn } from "@/lib/utils"

// Keep in sync with mobile-nav.tsx — same sections, rendered as the `md`+
// sidebar. Client component so the current route can stay highlighted.
const menus = {
  dashboard: [
    // `exact`: section roots match only themselves, otherwise "Dashboard"
    // would light up on every sub-page too.
    { href: "/dashboard", key: "dashboard", icon: LayoutGrid, exact: true },
    { href: "/dashboard/projects", key: "projects", icon: FolderKanban },
    { href: "/dashboard/billing", key: "billing", icon: CreditCard },
    { href: "/dashboard/settings", key: "settings", icon: Settings },
  ],
  admin: [{ href: "/admin", key: "overview", icon: LayoutGrid, exact: true }],
}

/** The kit's manual, published with every release: the same text as docs/ in your clone. */
export const KIT_DOCS_URL = "https://openstarterkit.dev/docs"

function linkClass(active: boolean) {
  return cn(
    "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors sidebar-collapsed:justify-center sidebar-collapsed:px-2",
    active
      ? "bg-primary/10 text-primary"
      : "text-muted-foreground hover:bg-muted hover:text-foreground"
  )
}

// Hidden while the sidebar is collapsed to icons; the link keeps a `title`
// so the label survives as a tooltip.
function NavLabel({ children }: { children: React.ReactNode }) {
  return <span className="sidebar-collapsed:hidden">{children}</span>
}

export function SidebarNav({
  variant,
  showAdminLink = false,
  showDevDocsLink = false,
}: {
  variant: keyof typeof menus
  showAdminLink?: boolean
  /** The kit's manual, while developing and in the demo: see the layout. */
  showDevDocsLink?: boolean
}) {
  const t = useTranslations("dashboard.nav")
  // Rendered route, not the URL: with Settings open as a modal over the
  // dashboard this stays "/dashboard", so Dashboard keeps the highlight and
  // Settings does not take it. Deliberate, decided 10 Sep 2026, not an
  // oversight to fix: see the note on the hook. Switching to `usePathname`
  // would light Settings during the modal, and would reintroduce the stale
  // path after server-action redirects that this hook exists to avoid.
  const pathname = useRenderedPathname()
  const isActive = (item: { href: string; exact?: boolean }) =>
    item.exact
      ? pathname === item.href
      : pathname === item.href || pathname.startsWith(`${item.href}/`)

  return (
    <>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {menus[variant].map((item) => {
          const Icon = item.icon
          const active = isActive(item)
          return (
            <Link
              key={item.href}
              href={item.href}
              title={t(item.key)}
              // Which entry is current was visible and not announced: the
              // styling said it and nothing else did, so anyone not looking at
              // the colours had no way to know where they were. Deferred here on
              // purpose when the modal behaviour was settled, because this is
              // the release that goes through accessibility.
              aria-current={active ? "page" : undefined}
              className={linkClass(active)}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <NavLabel>{t(item.key)}</NavLabel>
            </Link>
          )
        })}
        {variant === "admin" && (
          <div className="mt-4 border-t border-border pt-4">
            <Link href="/dashboard" title={t("backToDashboard")} className={linkClass(false)}>
              <ArrowLeft className="h-4 w-4 shrink-0" />
              <NavLabel>{t("backToDashboard")}</NavLabel>
            </Link>
          </div>
        )}
      </nav>
      {/* The Admin Panel and the kit's manual sit at the bottom of the sidebar,
          under a rule, apart from the entries you use every day: they are
          other places, not more sections of this one. */}
      {variant === "dashboard" && (showAdminLink || showDevDocsLink) && (
        <nav aria-label={t("more")} className="space-y-1 border-t border-border p-3">
          {showAdminLink && (
            <Link href="/admin" title={t("adminPanel")} className={linkClass(false)}>
              <Shield className="h-4 w-4 shrink-0" />
              <NavLabel>{t("adminPanel")}</NavLabel>
            </Link>
          )}
          {showDevDocsLink && (
            <a href={KIT_DOCS_URL} target="_blank" rel="noreferrer" title={t("devDocs")} className={linkClass(false)}>
              <Code className="h-4 w-4 shrink-0" />
              <NavLabel>{t("devDocs")}</NavLabel>
              {/* It leaves the app, for another site in a new tab: said by the
                  arrow, and in words for whoever does not see it. */}
              <ArrowUpRight className="ml-auto h-3.5 w-3.5 shrink-0 sidebar-collapsed:hidden" aria-hidden="true" />
              <span className="sr-only">{t("newTab")}</span>
            </a>
          )}
        </nav>
      )}
    </>
  )
}
