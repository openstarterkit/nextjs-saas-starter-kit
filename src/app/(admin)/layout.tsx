import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { ThemeToggle } from "@/components/theme-toggle"
import { UserMenu } from "@/components/dashboard/user-menu"
import { Logo } from "@/components/logo"
import { MobileNav } from "@/components/dashboard/mobile-nav"
import { SidebarNav } from "@/components/dashboard/sidebar-nav"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect("/login")
  if (session.user.role !== "ADMIN") redirect("/dashboard")

  return (
    <div className="flex min-h-screen bg-muted/20">
      <aside className="sticky top-0 hidden h-screen w-60 flex-col border-r border-border bg-background md:flex">
        <div className="flex h-16 items-center border-b border-border px-5">
          <Link href="/" className="flex items-center gap-2 font-bold text-foreground">
            <Logo />
          </Link>
          <span className="ml-2 rounded bg-destructive/10 px-1.5 py-0.5 text-xs font-semibold text-destructive">Admin</span>
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

      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border bg-background px-4 md:px-6">
          <div className="flex items-center gap-1 md:hidden">
            <MobileNav variant="admin" />
            <Logo wordmarkClassName="text-base font-bold text-foreground" />
            <span className="ml-1 rounded bg-destructive/10 px-1.5 py-0.5 text-xs font-semibold text-destructive">Admin</span>
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
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  )
}
