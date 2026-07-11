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
          <Link key={item.href} href={item.href} title={item.label} className={linkClass(isActive(item))}>
            <Icon className="h-4 w-4 shrink-0" />
            <NavLabel>{item.label}</NavLabel>
          </Link>
        )
      })}
      {variant === "dashboard" && showAdminLink && (
        <div className="mt-4 border-t border-border pt-4">
          <Link href="/admin" title="Admin Panel" className={linkClass(false)}>
            <Shield className="h-4 w-4 shrink-0" />
            <NavLabel>Admin Panel</NavLabel>
          </Link>
        </div>
      )}
      {variant === "admin" && (
        <div className="mt-4 border-t border-border pt-4">
          <Link href="/dashboard" title="Back to Dashboard" className={linkClass(false)}>
            <ArrowLeft className="h-4 w-4 shrink-0" />
            <NavLabel>Back to Dashboard</NavLabel>
          </Link>
        </div>
      )}
    </nav>
  )
}
