import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { ThemeToggle } from "@/components/theme-toggle"
import { UserMenu } from "@/components/dashboard/user-menu"
import { PoweredBy } from "@/components/powered-by"
import { Logo } from "@/components/logo"
import { MobileNav } from "@/components/dashboard/mobile-nav"
import { SidebarNav } from "@/components/dashboard/sidebar-nav"
import { SidebarCollapseToggle } from "@/components/dashboard/sidebar-collapse-toggle"
import { SignOutDialog } from "@/components/dashboard/sign-out-dialog"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect("/login")

  return (
    <div className="flex min-h-screen bg-muted/20">
      <aside className="sticky top-0 hidden h-screen w-60 flex-col border-r border-border bg-background transition-[width] duration-200 md:flex sidebar-collapsed:w-16">
        <div className="flex h-16 items-center border-b border-border px-5 sidebar-collapsed:justify-center sidebar-collapsed:px-0">
          <Link href="/" className="flex items-center gap-2 font-bold text-foreground">
            <Logo wordmarkClassName="sidebar-collapsed:hidden" />
          </Link>
        </div>
        <SidebarNav variant="dashboard" showAdminLink={session.user.role === "ADMIN"} />
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
            <MobileNav variant="dashboard" showAdminLink={session.user.role === "ADMIN"} />
            <Logo wordmarkClassName="text-base font-bold text-foreground" />
          </div>
          <div className="flex items-center gap-3 ml-auto">
            <ThemeToggle />
            <SignOutDialog
              trigger={
                <button className="hidden text-sm text-muted-foreground transition-colors hover:text-foreground md:block">
                  Sign out
                </button>
              }
            />
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
        {/* Same container as the public pages (mx-auto max-w-6xl px-6). Without the cap the
            content stretched to the full viewport, so on a wide screen the three stat cards
            were over 400px each to hold one word. */}
        <main className="mx-auto w-full max-w-6xl flex-1 p-6">{children}</main>
        <footer className="flex items-center justify-center border-t border-border px-6 py-4">
          <PoweredBy />
        </footer>
      </div>
    </div>
  )
}
