"use client"

import Link from "next/link"
import { useRenderedPathname } from "@/hooks/use-rendered-pathname"
import {
  ArrowLeft,
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
    { href: "/dashboard", label: "Dashboard", icon: LayoutGrid, exact: true },
    { href: "/dashboard/projects", label: "Projects", icon: FolderKanban },
    { href: "/dashboard/billing", label: "Billing", icon: CreditCard },
    { href: "/dashboard/settings", label: "Settings", icon: Settings },
  ],
  admin: [{ href: "/admin", label: "Overview", icon: LayoutGrid, exact: true }],
}

function linkClass(active: boolean) {
  return cn(
    "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
    active
      ? "bg-primary/10 text-primary"
      : "text-muted-foreground hover:bg-muted hover:text-foreground"
  )
}

export function SidebarNav({
  variant,
  showAdminLink = false,
}: {
  variant: keyof typeof menus
  showAdminLink?: boolean
}) {
  const pathname = useRenderedPathname()
  const isActive = (item: { href: string; exact?: boolean }) =>
    item.exact
      ? pathname === item.href
      : pathname === item.href || pathname.startsWith(`${item.href}/`)

  return (
    <nav className="flex-1 space-y-1 overflow-y-auto p-3">
      {menus[variant].map((item) => {
        const Icon = item.icon
        return (
          <Link key={item.href} href={item.href} className={linkClass(isActive(item))}>
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        )
      })}
      {variant === "dashboard" && showAdminLink && (
        <div className="mt-4 border-t border-border pt-4">
          <Link href="/admin" className={linkClass(false)}>
            <Shield className="h-4 w-4" />
            Admin Panel
          </Link>
        </div>
      )}
      {variant === "admin" && (
        <div className="mt-4 border-t border-border pt-4">
          <Link href="/dashboard" className={linkClass(false)}>
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>
      )}
    </nav>
  )
}
