import { requireUser } from "@/lib/auth"
import { getTranslations } from "next-intl/server"
import Link from "next/link"
import { ThemeToggle } from "@/components/theme-toggle"
import { UserMenu } from "@/components/dashboard/user-menu"
import { PoweredBy } from "@/components/powered-by"
import { Logo } from "@/components/logo"
import { MobileNav } from "@/components/dashboard/mobile-nav"
import { SidebarNav } from "@/components/dashboard/sidebar-nav"
import { SidebarCollapseToggle } from "@/components/dashboard/sidebar-collapse-toggle"
import { HeaderBreadcrumbs } from "@/components/dashboard/header-breadcrumbs"
import { LayoutGrid } from "lucide-react"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser()
  const tNav = await getTranslations("dashboard.nav")
  // The kit's manual, for whoever is building: while developing, and in the
  // demo, where the visitor is a developer weighing the kit. Never in your
  // production app, whose users would find setup instructions instead of help.
  const showDevDocs = process.env.NODE_ENV === "development" || process.env.DEMO_MODE === "true"

  return (
    <div className="flex min-h-screen bg-muted/20">
      <aside className="sticky top-0 hidden h-screen w-60 flex-col border-r border-border bg-background transition-[width] duration-200 md:flex sidebar-collapsed:w-16">
        <div className="flex h-16 items-center border-b border-border px-5 sidebar-collapsed:justify-center sidebar-collapsed:px-0">
          <Link href="/" className="flex items-center gap-2 font-bold text-foreground">
            <Logo animated wordmarkClassName="sidebar-collapsed:hidden" />
          </Link>
        </div>
        <SidebarNav variant="dashboard" showAdminLink={user.role === "ADMIN"} showDevDocsLink={showDevDocs} />
      </aside>

      {/* min-w-0: without it this flex item keeps `min-width: auto`, so any wide
          child (a table) inflates the whole column past the viewport instead of
          scrolling inside its own container. */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border bg-background px-4 md:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <SidebarCollapseToggle />
            <HeaderBreadcrumbs
              icon={<LayoutGrid className="h-4 w-4" />}
              base={{ name: tNav("dashboard"), href: "/dashboard" }}
              labels={{ projects: tNav("projects"), billing: tNav("billing"), settings: tNav("settings") }}
            />
          </div>
          <div className="flex items-center gap-1 md:hidden">
            <MobileNav variant="dashboard" showAdminLink={user.role === "ADMIN"} showDevDocsLink={showDevDocs} />
            <Logo animated wordmarkClassName="text-base font-bold text-foreground" />
          </div>
          <div className="flex items-center gap-3 ml-auto">
            <ThemeToggle />
            {/* Who you are, top right, where most apps keep it: the avatar opens
                Settings, Billing and Sign out, on every screen size. */}
            <UserMenu name={user.name} email={user.email} image={user.image} side="bottom" inHeader />
          </div>
        </header>
        {/* Narrower than the public pages on purpose. Here the sidebar already
            takes 240px, so at 1440 the content area is 1200: capping at
            max-w-5xl leaves 88px of automatic margin on each side, and with the
            48px of padding the gap between the sidebar rule and the first card
            comes to ~136px instead of 72. Without any cap the content stretched
            to the full viewport and the three stat cards were over 400px each
            to hold one word. */}
        <main className="mx-auto w-full max-w-5xl flex-1 p-6 lg:px-14">{children}</main>
        <footer className="flex items-center justify-center px-6 py-4">
          <PoweredBy />
        </footer>
      </div>
    </div>
  )
}
