import Link from "next/link"
import {
  ArrowRight,
  Sparkles,
  LayoutGrid,
  FolderKanban,
  CreditCard,
  Settings,
  type LucideIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/logo"
import { siteConfig } from "@/config/site"
import { isKitSite } from "@/config/kit"

/**
 * Headline support copy. The first block is the placeholder your clone
 * ships with: say what your product does and who it is for, then replace the
 * trust line with whatever is true of your offer. The second block is the
 * kit's own site (KIT_SITE="true").
 *
 * `headline` overrides how the H1 is split: give it the plain part and the
 * gradient part, and it renders them on two lines. Leave it null and the H1
 * follows `tagline` from src/config/site.ts, accenting the last word, so
 * rebranding from env still reshapes the headline for you.
 */
type Headline = { head: string; accent: string } | null

const copy: {
  headline: Headline
  subtitle: string
  cta: string
  trust: string
  pill: string
} = isKitSite
  ? {
      headline: { head: "Ship your SaaS", accent: "this weekend." },
      subtitle:
        "Production-ready boilerplate with auth, payments, dashboard, and admin panel. No vendor lock-in, swap any component without rewriting everything.",
      cta: "Start free",
      trust: "Free & open source · No credit card required · Pro (teams) coming soon",
      pill: "Now open source & free",
    }
  : {
      headline: null,
      subtitle:
        "One workspace for your projects, your customers and your billing. Invite your team and get back to the work that matters.",
      cta: "Get started",
      trust: "Set up in minutes · No credit card required · Cancel anytime",
      pill: "Now in public beta",
    }

const mockNav: { label: string; icon: LucideIcon; active?: boolean }[] = [
  { label: "Dashboard", icon: LayoutGrid, active: true },
  { label: "Projects", icon: FolderKanban },
  { label: "Billing", icon: CreditCard },
  { label: "Settings", icon: Settings },
]

const mockStats = [
  { label: "Current Plan", value: "Pro" },
  { label: "Status", value: "Active", badge: true },
  { label: "Next Billing", value: "Jul 24" },
]

// Decorative revenue bars (% heights) for the mock chart
const mockBars = [38, 52, 45, 63, 58, 74, 69, 85, 78, 92, 88, 100]

export function Hero() {
  // Explicit split when `headline` is set, otherwise derive it from the
  // tagline with the last word gradient-accented.
  const words = siteConfig.tagline.split(" ")
  const taglineLast = words.pop() ?? ""
  const headline = copy.headline ?? { head: words.join(" "), accent: taglineLast }

  return (
    <section className="relative overflow-hidden pb-24 pt-16 md:pb-32 md:pt-24">
      {/* Decorative background layers */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-grid" />
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[600px] bg-glow" />

      <div className="mx-auto max-w-5xl px-6 text-center">
        {/* Announcement pill: the current version, then what is new in it.
            The badge reads `version` from src/config/site.ts, so it moves with
            your releases; swap the sentence for whatever you are shipping. */}
        <div className="mb-7 inline-flex animate-fade-in-up items-center gap-2 rounded-full border border-border bg-card/70 py-1.5 pl-2 pr-4 text-sm font-medium shadow-soft backdrop-blur">
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
            <Sparkles className="h-3 w-3" /> v{siteConfig.version}
          </span>
          <span className="text-muted-foreground">{copy.pill}</span>
        </div>

        <h1
          className="animate-fade-in-up text-5xl font-extrabold tracking-tight text-foreground sm:text-6xl md:text-7xl lg:text-8xl"
          style={{ animationDelay: "60ms" }}
        >
          {headline.head}
          <br />
          <span className="text-gradient-brand">{headline.accent}</span>
        </h1>

        <p
          className="mx-auto mt-6 max-w-2xl animate-fade-in-up text-lg text-muted-foreground md:text-xl"
          style={{ animationDelay: "120ms" }}
        >
          {copy.subtitle}
        </p>

        <div
          className="mt-10 flex animate-fade-in-up flex-col items-center gap-4 sm:flex-row sm:justify-center"
          style={{ animationDelay: "180ms" }}
        >
          <Button asChild variant="gradient" size="xl">
            <a href="#pricing">
              {copy.cta} <ArrowRight className="h-5 w-5" />
            </a>
          </Button>
          <Button asChild variant="outline" size="xl">
            <Link href={siteConfig.links.demo ?? "/login"}>Live demo</Link>
          </Button>
        </div>

        <p
          className="mt-5 animate-fade-in-up text-sm text-muted-foreground"
          style={{ animationDelay: "240ms" }}
        >
          {copy.trust}
        </p>

        {/* Dashboard mockup — mirrors the real app shell */}
        <div
          className="mx-auto mt-16 max-w-4xl animate-fade-in-up text-left"
          style={{ animationDelay: "320ms" }}
        >
          <div className="overflow-hidden rounded-2xl border border-border bg-background shadow-[var(--shadow-soft-lg)] ring-1 ring-white/10 md:animate-float">
            {/* Browser chrome */}
            <div className="flex items-center gap-2 border-b border-border bg-card px-4 py-3">
              <span className="h-3 w-3 rounded-full bg-red-400" />
              <span className="h-3 w-3 rounded-full bg-yellow-400" />
              <span className="h-3 w-3 rounded-full bg-green-400" />
              <span className="mx-auto rounded-md bg-background px-3 py-0.5 text-xs text-muted-foreground ring-1 ring-border">
                dashboard.yoursaas.com
              </span>
            </div>

            {/* App shell: sidebar + main */}
            <div className="flex">
              {/* Sidebar */}
              <aside className="hidden w-52 flex-col border-r border-border bg-background sm:flex">
                <div className="flex h-14 items-center border-b border-border px-4 text-sm font-bold tracking-tight">
                  {/* Generic on purpose: this mockup is the customer's own
                      product (dashboard.yoursaas.com, alex@acme.io), not ours.
                      Greying the tile was not enough, because the mark itself
                      is our bolt on the kit's site: `generic` swaps the symbol
                      too, in both themes. */}
                  <Logo generic markClassName="h-6 w-6" />
                </div>
                <nav className="flex-1 space-y-1 p-3">
                  {mockNav.map(({ label, icon: Icon, active }) => (
                    <div
                      key={label}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium ${
                        active ? "bg-primary/10 text-primary" : "text-muted-foreground"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                    </div>
                  ))}
                </nav>
                <div className="flex items-center gap-2.5 border-t border-border p-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-2 text-xs font-semibold text-primary-foreground">
                    AR
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-foreground">Alex Rivera</p>
                    <p className="truncate text-[11px] text-muted-foreground">alex@acme.io</p>
                  </div>
                </div>
              </aside>

              {/* Main column */}
              <div className="flex-1 bg-muted/20">
                {/* Top bar */}
                <div className="flex h-14 items-center justify-end gap-4 border-b border-border bg-background px-5 text-xs text-muted-foreground">
                  <span>Docs</span>
                  <span>Sign out</span>
                </div>

                {/* Content */}
                <div className="space-y-4 p-5">
                  <div>
                    <p className="text-base font-bold text-foreground">Welcome back, Alex 👋</p>
                    <p className="text-xs text-muted-foreground">Here&apos;s what&apos;s happening with your account.</p>
                  </div>

                  {/* Stat cards */}
                  <div className="grid grid-cols-3 gap-3">
                    {mockStats.map(({ label, value, badge }) => (
                      <div key={label} className="rounded-xl border border-border bg-card p-3">
                        <p className="text-[11px] text-muted-foreground">{label}</p>
                        {badge ? (
                          <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-600 ring-1 ring-emerald-500/20 dark:text-emerald-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            {value}
                          </span>
                        ) : (
                          <p className="mt-1 text-lg font-bold text-foreground">{value}</p>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Revenue chart card */}
                  <div className="rounded-xl border border-border bg-card p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-foreground">Revenue</p>
                      <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">+12.5%</span>
                    </div>
                    <div className="mt-3 flex h-20 items-end gap-1.5">
                      {mockBars.map((h, i) => (
                        <div
                          key={i}
                          className="flex-1 rounded-t bg-gradient-to-t from-primary/40 to-primary-2"
                          style={{ height: `${h}%` }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Projects row */}
                  <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
                    <div>
                      <p className="text-sm font-semibold text-foreground">Projects</p>
                      <p className="text-xs text-muted-foreground">You have 3 projects.</p>
                    </div>
                    <span className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground">
                      View all
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
