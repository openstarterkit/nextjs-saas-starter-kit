import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Reveal } from "@/components/landing/reveal"
import { WaitlistForm } from "@/components/landing/waitlist-form"
import { useTranslations } from "next-intl"
import { siteConfig } from "@/config/site"



function CheckIcon() {
  return (
    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
      <Check className="h-3 w-3" strokeWidth={3} />
    </span>
  )
}

/**
 * `heading` is the level of the section title, not its look: on the landing
 * page this block sits under the hero and stays an h2, on /pricing it is the
 * page's own heading and must be the h1. Same styling either way.
 */
export function Pricing({ heading = "h2" }: { heading?: "h1" | "h2" }) {
  const t = useTranslations("pricing")
  const Heading = heading
  const freeFeatures = t.raw("freeFeatures") as string[]
  const proFeatures = t.raw("proFeatures") as string[]
  // Production gate (COO #007 §5): the waitlist must not collect real emails
  // until the real privacy policy is live on the showcase. Off by default,
  // so a deploy that forgets the overlay ships a disabled form, not a live
  // one. Set WAITLIST_ENABLED="true" on the showcase once /privacy is real.
  const isDemo = process.env.DEMO_MODE === "true"
  const waitlistOn = process.env.WAITLIST_ENABLED === "true"
  return (
    <section id="pricing" className="bg-muted/30 py-24">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal className="mb-16 text-center">
          <Heading className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {t("title")}
          </Heading>
          <p className="mt-4 text-lg text-muted-foreground">
            {t("subtitle")}
          </p>
        </Reveal>

        <div className="mx-auto grid max-w-4xl grid-cols-1 items-stretch gap-6 md:grid-cols-2">
          {/* Free */}
          <Reveal>
            <Card className="flex h-full flex-col">
              <CardHeader className="pt-8">
                <CardTitle className="text-2xl">{t("freeTitle")}</CardTitle>
                <CardDescription>{t("freeDescription")}</CardDescription>
                <div className="mt-4">
                  <span className="text-5xl font-extrabold text-foreground">$0</span>
                  <span className="ml-2 text-muted-foreground">{t("forever")}</span>
                </div>
              </CardHeader>

              <CardContent className="flex-1 px-8">
                <ul className="space-y-3">
                  {freeFeatures.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm">
                      <CheckIcon />
                      <span className="text-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter className="flex-col gap-3 px-8 pb-8">
                <Button asChild variant="outline" size="lg" className="w-full">
                  <a
                    href={siteConfig.links.github ?? "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {t("getOnGithub")}
                  </a>
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  {t("noSignup")}
                </p>
              </CardFooter>
            </Card>
          </Reveal>

          {/* Pro / Teams — in design, feedback-gathering */}
          <Reveal delay={100}>
            <Card className="border-gradient-brand relative flex h-full flex-col overflow-hidden shadow-[var(--shadow-glow)]">
              <CardHeader className="pt-8">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl">{t("proTitle")}</CardTitle>
                  <Badge>{t("comingSoon")}</Badge>
                </div>
                <CardDescription>{t("proDescription")}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-extrabold text-foreground">{t("comingSoon")}</span>
                  <p className="mt-1 text-sm text-muted-foreground">{t("youTellUs")}</p>
                </div>
              </CardHeader>

              <CardContent className="flex-1 px-8">
                <ul className="space-y-3">
                  {proFeatures.map((feature, i) => (
                    <li key={feature} className="flex items-start gap-3 text-sm">
                      {i === 0 ? <span className="mt-0.5 h-5 w-5 shrink-0" /> : <CheckIcon />}
                      <span className={i === 0 ? "font-medium text-foreground" : "text-foreground"}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter className="flex-col gap-3 px-8 pb-8">
                <WaitlistForm
                  source="pricing-card"
                  disabled={isDemo || !waitlistOn}
                  cta={t("waitlistCta")}
                  // No cadence on purpose: a weekly promise starts a clock on
                  // the first confirmed subscriber, and there is not a week's
                  // worth of real news between here and the Pro launch. Say
                  // what we will actually do. Same wording on the confirm page
                  // and in the welcome email: change all three together.
                  note={t("waitlistNote")}
                  disabledNote={
                    isDemo
                      ? t("formsDisabled")
                      : "The waitlist opens shortly - check back soon."
                  }
                />
              </CardFooter>
            </Card>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
