import Link from "next/link"
import {
  ArrowRight,
  Sparkles,
  LayoutGrid,
  FolderKanban,
  CreditCard,
  Settings,
  ChevronsUpDown,
  type LucideIcon,
} from "lucide-react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/logo"
import { PreviewThemeFrame, PreviewThemeToggle } from "@/components/landing/hero-preview-theme"
import { siteConfig } from "@/config/site"

/**
 * The hero copy lives in the message files, under two parallel namespaces:
 * `hero.product` is the placeholder your clone ships with, `hero.kit` is the
 * kit's own site (KIT_SITE="true"). Editing either one is a translation file,
 * not a component.
 *
 * `headlineHead` / `headlineAccent` override how the H1 is split: the plain
 * part and the gradient part, rendered on two lines. Leave them empty and the
 * H1 follows `tagline` from src/config/site.ts, accenting the last word, so
 * rebranding from env still reshapes the headline for you.
 */

// The fake dashboard behind the headline. Labels are keys like everywhere
// else: it is a picture of a product, but the words in it are still read.
const mockNav: { key: string; icon: LucideIcon; active?: boolean }[] = [
  { key: "navDashboard", icon: LayoutGrid, active: true },
  { key: "navProjects", icon: FolderKanban },
  { key: "navBilling", icon: CreditCard },
  { key: "navSettings", icon: Settings },
]

const mockStats = [
  { key: "statPlan", value: "Pro" },
  { key: "statStatus", valueKey: "statStatusValue", badge: true },
  { key: "statBilling", value: "Jul 24" },
]

// Decorative revenue bars (% heights) for the mock chart
const mockBars = [38, 52, 45, 63, 58, 74, 69, 85, 78, 92, 88, 100]

export function Hero() {
  const t = useTranslations("hero")
  const tm = useTranslations("hero.mock")
  // Explicit split when the message provides one, otherwise derive it from
  // the tagline with the last word gradient-accented.
  const words = siteConfig.tagline.split(" ")
  const taglineLast = words.pop() ?? ""
  const headline = t("headlineHead")
    ? { head: t("headlineHead"), accent: t("headlineAccent") }
    : { head: words.join(" "), accent: taglineLast }

  return (
    <section className="relative overflow-hidden pb-24 pt-16 md:pb-32 md:pt-24">
      {/* Decorative background layers */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-grid" />
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[600px] bg-glow" />

      <div className="mx-auto max-w-5xl px-6 lg:px-12 text-center">
        {/* Announcement pill: the current version, then what is new in it.
            The badge reads `version` from src/config/site.ts, so it moves with
            your releases; swap the sentence for whatever you are shipping. */}
        <div className="mb-7 inline-flex animate-fade-in-up items-center gap-2 rounded-full border border-border bg-card/70 py-1.5 pl-2 pr-4 text-sm font-medium shadow-soft backdrop-blur">
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
            <Sparkles className="h-3 w-3" /> v{siteConfig.version}
          </span>
          <span className="text-muted-foreground">{t("pill")}</span>
        </div>

        {/* Two lines of the same size, weight 550 and tight tracking: tall,
            narrow letters, so the headline can be large and still sit on one
            line each. From xl up both lines may use the footer's full content
            width (66rem, hence -mx-16 out of the 58rem column). 550 in both
            themes, between medium (thin on a white page) and semibold; Geist
            is variable, so the weight is exact. The longer line is 1032px of
            1056: if you change the words, check it still fits at 5.25rem. */}
        <h1
          className="animate-fade-in-up text-foreground"
          style={{ animationDelay: "60ms" }}
        >
          <span className="block text-3xl font-[550] leading-[1.05] tracking-tighter sm:text-4xl md:text-5xl xl:-mx-16 xl:text-[length:5.25rem] xl:leading-none">
            {headline.head}
          </span>
          <span className="block text-3xl font-[550] leading-[1.05] tracking-tighter text-gradient-brand sm:text-4xl md:text-5xl xl:-mx-16 xl:text-[length:5.25rem] xl:leading-none">
            {headline.accent}
          </span>
        </h1>

        <p
          className="mx-auto mt-6 max-w-4xl animate-fade-in-up text-lg text-muted-foreground md:text-xl"
          style={{ animationDelay: "120ms" }}
        >
          {t("subtitle")}
        </p>

        <div
          className="mt-10 flex animate-fade-in-up flex-col items-center gap-4 sm:flex-row sm:justify-center"
          style={{ animationDelay: "180ms" }}
        >
          <Button asChild variant="gradient" size="xl">
            <a href="#pricing">
              {t("cta")} <ArrowRight className="h-5 w-5" />
            </a>
          </Button>
          <Button asChild variant="outline" size="xl">
            <Link href={siteConfig.links.demo ?? "/login"}>Live demo</Link>
          </Button>
        </div>

        {/* The kit's own site has no line here (the pill above says it);
            a clone shows its own from hero.$product.trust. */}
        {t.has("trust") && (
          <p
            className="mt-5 animate-fade-in-up text-sm text-muted-foreground"
            style={{ animationDelay: "240ms" }}
          >
            {t("trust")}
          </p>
        )}

        {/* Dashboard mockup — mirrors the real app shell.

            Hidden from assistive technology, and that is the accurate
            description of it rather than a way to quiet the audit: this is a
            picture of the product, drawn in markup instead of exported as an
            image. A screen reader was reading out "Welcome back, Alex, Current
            Plan Pro, Next Billing Jul 24" in the middle of the home page,
            which tells nobody anything. The same markup also accounted for 23
            of the page's contrast findings, because a deliberately faint
            illustration was being measured as if it were text to read. The
            headline above already says what the product is. */}
        {/* Scaled as a whole from xl up, so it spans the same width as the
            menu above and the footer below (56rem x 1.1786 = 66rem) while
            every proportion inside stays as it is. `zoom`, not `transform`:
            the scaled size is the one the layout makes room for. The column
            it sits in is 58rem wide, so it reaches out 4rem on each side
            (the negative margins, divided by the zoom because they are
            scaled too). Below xl there is not 66rem to fill, and it keeps
            its own size. */}
        <div
          aria-hidden="true"
          className="mx-auto mt-16 max-w-4xl animate-fade-in-up text-left xl:mx-[-3.394rem] xl:max-w-none xl:[zoom:1.1786]"
          style={{ animationDelay: "320ms" }}
        >
          <PreviewThemeFrame className="overflow-hidden rounded-2xl border border-border bg-background shadow-[var(--shadow-soft-lg)] ring-1 ring-white/10 transition-colors md:animate-float">
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
                <div className="flex h-14 items-center border-b border-border px-5 text-sm font-bold tracking-tight">
                  {/* Generic on purpose: this mockup is the customer's own
                      product (dashboard.yoursaas.com, alex@acme.io), not ours.
                      A neutral tile was not enough, because the mark itself
                      is our bolt on the kit's site: `generic` swaps the symbol
                      too, in both themes. */}
                  <Logo generic />
                </div>
                {/* The account menu under the logo, as in the real sidebar. */}
                <div className="border-b border-border p-3">
                  <div className="flex items-center gap-2 rounded-lg px-2 py-1.5">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-2 text-xs font-semibold text-primary-foreground">
                      AR
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-foreground">Alex Rivera</p>
                      <p className="truncate text-[11px] text-muted-foreground">alex@acme.io</p>
                    </div>
                    <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  </div>
                </div>
                <nav className="flex-1 space-y-1 p-3">
                  {mockNav.map(({ key, icon: Icon, active }) => (
                    <div
                      key={key}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium ${
                        active ? "bg-primary/10 text-primary" : "text-muted-foreground"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {tm(key)}
                    </div>
                  ))}
                </nav>
              </aside>

              {/* Main column */}
              <div className="flex-1 bg-muted/20">
                {/* Top bar */}
                {/* As in the real header: the theme switch and Sign out. The
                    switch turns only this preview light or dark. */}
                <div className="flex h-14 items-center justify-end gap-3 border-b border-border bg-background px-5 text-xs text-muted-foreground">
                  <PreviewThemeToggle />
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
                    {mockStats.map(({ key, value, valueKey, badge }) => (
                      <div key={key} className="rounded-xl border border-border bg-card p-3">
                        <p className="text-[11px] text-muted-foreground">{tm(key)}</p>
                        {badge ? (
                          <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-500/20 dark:text-emerald-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            {valueKey ? tm(valueKey) : value}
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
                      <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">+12.5%</span>
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
          </PreviewThemeFrame>
        </div>
      </div>
    </section>
  )
}
