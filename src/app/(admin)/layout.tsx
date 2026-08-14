import { auth } from "@/auth"
import { getTranslations } from "next-intl/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { ThemeToggle } from "@/components/theme-toggle"
import { UserMenu } from "@/components/dashboard/user-menu"
import { Logo } from "@/components/logo"
import { MobileNav } from "@/components/dashboard/mobile-nav"
import { SidebarNav } from "@/components/dashboard/sidebar-nav"
import { SidebarCollapseToggle } from "@/components/dashboard/sidebar-collapse-toggle"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  const t = await getTranslations("admin")
  if (!session) redirect("/login")
  if (session.user.role !== "ADMIN") redirect("/dashboard")

  return (
    <div className="flex min-h-screen bg-muted/20">
      <aside className="sticky top-0 hidden h-screen w-60 flex-col border-r border-border bg-background transition-[width] duration-200 md:flex sidebar-collapsed:w-16">
        <div className="flex h-16 items-center border-b border-border px-5 sidebar-collapsed:justify-center sidebar-collapsed:px-0">
          <Link href="/" className="flex items-center gap-2 font-bold text-foreground">
            <Logo wordmarkClassName="sidebar-collapsed:hidden" />
          </Link>
          <span className="ml-2 rounded bg-destructive/10 px-1.5 py-0.5 text-xs font-semibold text-destructive sidebar-collapsed:hidden">{t("badge")}</span>
        </div>
        <SidebarNav variant="admin" />
        <div className="border-t border-border p-3">
          <UserMenu
            name={session.user.name}
            email={session.user.email}
            image={session.user.image}
          />
        </div>
      </aside>

      {/* min-w-0: without it this flex item keeps `min-width: auto`, so any wide
          child (a table) inflates the whole column past the viewport instead of
          scrolling inside its own container. */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border bg-background px-4 md:px-6">
          <SidebarCollapseToggle />
          <div className="flex items-center gap-1 md:hidden">
            <MobileNav variant="admin" />
            <Logo wordmarkClassName="text-base font-bold text-foreground" />
            <span className="ml-1 rounded bg-destructive/10 px-1.5 py-0.5 text-xs font-semibold text-destructive">{t("badge")}</span>
          </div>
          <div className="flex items-center gap-3 ml-auto">
            <ThemeToggle />
            <div className="md:hidden">
              <UserMenu
                name={session.user.name}
                email={session.user.email}
                image={session.user.image}
                side="bottom"
                hideDetails
              />
            </div>
          </div>
        </header>
        {/* Same container as the public pages and the dashboard, so the two consoles match. */}
        <main className="mx-auto w-full max-w-6xl flex-1 p-6">{children}</main>
      </div>
    </div>
  )
}
