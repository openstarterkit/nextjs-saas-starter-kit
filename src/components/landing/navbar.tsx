import Link from "next/link"
import { auth } from "@/auth"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { Logo } from "@/components/logo"
import { LogoLink } from "@/components/landing/logo-link"
import { MobileMenu } from "@/components/landing/mobile-menu"
import { NavLinks } from "@/components/landing/nav-links"
import { siteConfig } from "@/config/site"

export async function Navbar() {
  const session = await auth()

  return (
    <header className="sticky top-0 z-50 w-full px-4 pt-4">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 rounded-full border border-border bg-background/70 px-4 pl-5 shadow-soft backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
        <LogoLink className="flex items-center gap-2">
          <Logo wordmarkClassName="text-base font-bold" />
        </LogoLink>

        <NavLinks />

        <div className="flex items-center gap-2">
          <ThemeToggle />
          {session ? (
            <Button asChild size="sm" className="hidden md:inline-flex">
              <Link href="/dashboard">Dashboard</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden md:inline-flex">
                <Link href={siteConfig.links.demo ?? "/login"}>Sign in</Link>
              </Button>
              <Button asChild variant="gradient" size="sm" className="hidden md:inline-flex">
                <Link href="/#pricing">Get started</Link>
              </Button>
            </>
          )}
          <MobileMenu signInHref={siteConfig.links.demo ?? "/login"} isAuthenticated={!!session} />
        </div>
      </div>
    </header>
  )
}
