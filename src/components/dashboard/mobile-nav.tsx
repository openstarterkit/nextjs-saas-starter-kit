"use client"

import Link from "next/link"
import { useRenderedPathname } from "@/hooks/use-rendered-pathname"
import {
  ArrowLeft,
  CreditCard,
  FolderKanban,
  LayoutGrid,
  Menu,
  Settings,
  Shield,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

// Keep in sync with the sidebar navItems in (dashboard)/layout.tsx and
// (admin)/layout.tsx — the sidebar is hidden below `md` and this menu
// takes over.
const menus = {
  dashboard: [
    { href: "/dashboard", label: "Dashboard", icon: LayoutGrid },
    { href: "/dashboard/projects", label: "Projects", icon: FolderKanban },
    { href: "/dashboard/billing", label: "Billing", icon: CreditCard },
    { href: "/dashboard/settings", label: "Settings", icon: Settings },
  ],
  admin: [{ href: "/admin", label: "Overview", icon: LayoutGrid }],
}

/** Hamburger nav for the app areas below `md`, where the sidebar is hidden. */
export function MobileNav({
  variant,
  showAdminLink = false,
}: {
  variant: keyof typeof menus
  showAdminLink?: boolean
}) {
  const pathname = useRenderedPathname()
  const isActive = (href: string) =>
    href === "/dashboard" || href === "/admin"
      ? pathname === href
      : pathname === href || pathname.startsWith(`${href}/`)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          aria-label="Open navigation"
          className="flex h-11 w-11 items-center justify-center rounded-[var(--radius)] text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground md:hidden"
        >
          <Menu size={24} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-60 md:hidden">
        {menus[variant].map(({ href, label, icon: Icon }) => (
          <DropdownMenuItem key={href} asChild>
            <Link href={href} className={isActive(href) ? "bg-primary/10 font-medium text-primary" : undefined}>
              <Icon />
              {label}
            </Link>
          </DropdownMenuItem>
        ))}
        {variant === "dashboard" && showAdminLink && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/admin">
                <Shield />
                Admin Panel
              </Link>
            </DropdownMenuItem>
          </>
        )}
        {variant === "admin" && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/dashboard">
                <ArrowLeft />
                Back to Dashboard
              </Link>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
