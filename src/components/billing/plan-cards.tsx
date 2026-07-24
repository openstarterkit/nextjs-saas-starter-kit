"use client"

import { useState } from "react"
import Link from "next/link"
import { Check } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UpgradeButton } from "@/components/billing/upgrade-button"
import { ContactDialog } from "@/components/landing/contact-dialog"

// Plain serializable shape: this is a client component, the server page maps
// Plan rows into it.
export type PlanCardData = {
  id: string
  slug: string
  name: string
  description: string | null
  price: number
  interval: "MONTH" | "YEAR" | "ONE_TIME"
  stripePriceId: string
  features: string[]
}

// A "talk to sales" tier with no self-serve price: rendered as the last card,
// visible on both sides of the billing interval toggle. The CTA opens the
// contact dialog (copyable address + mail-app handoff), not a bare mailto.
export type ContactCardData = {
  name: string
  description: string
  priceLabel: string
  note?: string
  /**
   * What the price block shows while the toggle is on Yearly. Set it when this
   * tier is priced rather than "Custom", so an annual figure can differ from
   * the monthly one; anything left out falls back to the values above.
   */
  yearly?: { priceLabel?: string; note?: string }
  features: string[]
  ctaLabel: string
  /** Pre-filled subject/body for the dialog's mail-app handoff. */
  ctaSubject?: string
  ctaBody?: string
}

// Monthly and yearly variants of the same tier, paired by slug convention
// ("starter-monthly" / "starter-yearly"). The card itself never changes when
// the interval toggle flips: only the price block swaps.
type Tier = {
  key: string
  monthly?: PlanCardData
  yearly?: PlanCardData
}

function formatPrice(cents: number) {
  return cents % 100 === 0 ? `$${cents / 100}` : `$${(cents / 100).toFixed(2)}`
}

function FeatureList({ features }: { features: string[] }) {
  return (
    <ul className="space-y-2.5">
      {features.map((feature) => (
        <li key={feature} className="flex items-start gap-2.5 text-sm">
          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Check className="h-3 w-3" strokeWidth={3} />
          </span>
          <span className="text-foreground">{feature}</span>
        </li>
      ))}
    </ul>
  )
}

// The sales-led tier. Its price block follows the interval toggle just like the
// priced tiers: with no `yearly` values set both sides render the same thing,
// so it stays put and never animates.
function ContactTierCard({ card, onYearly }: { card: ContactCardData; onYearly: boolean }) {
  const priceLabel = (onYearly ? card.yearly?.priceLabel : undefined) ?? card.priceLabel
  const note = (onYearly ? card.yearly?.note : undefined) ?? card.note

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="text-lg">{card.name}</CardTitle>
        <CardDescription>{card.description}</CardDescription>
        <div key={`${priceLabel}-${note ?? ""}`} className="animate-price-swap pt-2">
          <span className="text-4xl font-extrabold text-foreground">{priceLabel}</span>
          {/* Own line, rendered on both sides of the toggle, so swapping the
              text can't reflow the card the way an inline note would. Mirrors
              the "billed monthly / billed yearly" line on the priced tiers. */}
          <p className="mt-1 text-xs text-muted-foreground">{note ?? " "}</p>
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        <FeatureList features={card.features} />
      </CardContent>
      <CardFooter>
        <ContactDialog
          subject={card.ctaSubject}
          body={card.ctaBody}
          trigger={
            <Button variant="outline" className="w-full">
              {card.ctaLabel}
            </Button>
          }
        />
      </CardFooter>
    </Card>
  )
}

export function PlanCards({
  plans,
  currentPlanId,
  checkoutDisabled,
  disabledNote,
  ctaHref,
  contactCard,
}: {
  plans: PlanCardData[]
  currentPlanId?: string | null
  // True when checkout can't work here (no Stripe key, or demo mode): buttons
  // render disabled and disabledNote explains why.
  checkoutDisabled?: boolean
  disabledNote?: string
  // When set, cards link here instead of starting a checkout: used on public
  // pages (demo landing) where the visitor has no session yet.
  ctaHref?: string
  contactCard?: ContactCardData
}) {
  const recurring = plans.filter((p) => p.interval !== "ONE_TIME")
  const oneTime = plans.filter((p) => p.interval === "ONE_TIME")

  const tiers: Tier[] = []
  for (const plan of recurring) {
    const key = plan.slug.replace(/-(monthly|yearly)$/, "")
    let tier = tiers.find((t) => t.key === key)
    if (!tier) {
      tier = { key }
      tiers.push(tier)
    }
    if (plan.interval === "YEAR") tier.yearly = plan
    else tier.monthly = plan
  }

  const hasBothIntervals = tiers.some((t) => t.monthly && t.yearly)
  const [interval, setInterval] = useState<"MONTH" | "YEAR">("MONTH")

  return (
    <div className="space-y-4">
      {hasBothIntervals && (
        <Tabs value={interval} onValueChange={(v) => setInterval(v as "MONTH" | "YEAR")}>
          <TabsList>
            <TabsTrigger value="MONTH">Monthly</TabsTrigger>
            <TabsTrigger value="YEAR">Yearly</TabsTrigger>
          </TabsList>
        </Tabs>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {tiers.map((tier) => {
          // Name, description, features and button label come from the base
          // variant and stay put across the toggle; only the price swaps.
          const base = (tier.monthly ?? tier.yearly)!
          const active = (interval === "YEAR" ? tier.yearly : tier.monthly) ?? base
          const isCurrent =
            currentPlanId != null &&
            (tier.monthly?.id === currentPlanId || tier.yearly?.id === currentPlanId)
          // Yearly prices are shown as their monthly equivalent.
          const monthlyPrice = active.interval === "YEAR" ? Math.round(active.price / 12) : active.price
          return (
            <Card key={tier.key} className="flex flex-col">
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-lg">{base.name}</CardTitle>
                  {isCurrent && <Badge>Current plan</Badge>}
                </div>
                {base.description && <CardDescription>{base.description}</CardDescription>}
                <div key={active.id} className="animate-price-swap pt-2">
                  <span className="text-4xl font-extrabold text-foreground">
                    {formatPrice(monthlyPrice)}
                  </span>
                  <span className="ml-1.5 text-sm text-muted-foreground">/ month</span>
                  {tier.monthly && tier.yearly && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {active.interval === "YEAR" ? "billed yearly" : "billed monthly"}
                    </p>
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <FeatureList features={base.features} />
              </CardContent>
              <CardFooter>
                {ctaHref ? (
                  <Button asChild className="w-full">
                    <Link href={ctaHref}>{`Choose ${base.name}`}</Link>
                  </Button>
                ) : (
                  <UpgradeButton
                    priceId={active.stripePriceId}
                    disabled={checkoutDisabled || isCurrent}
                    className="w-full"
                  >
                    {isCurrent ? "Current plan" : `Upgrade to ${base.name}`}
                  </UpgradeButton>
                )}
              </CardFooter>
            </Card>
          )
        })}

        {oneTime.map((plan) => {
          const isCurrent = plan.id === currentPlanId
          return (
            <Card key={plan.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                  {isCurrent ? <Badge>Current plan</Badge> : <Badge variant="secondary">Pay once</Badge>}
                </div>
                {plan.description && <CardDescription>{plan.description}</CardDescription>}
                <div className="pt-2">
                  <span className="text-4xl font-extrabold text-foreground">
                    {formatPrice(plan.price)}
                  </span>
                  <span className="ml-1.5 text-sm text-muted-foreground">one time</span>
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <FeatureList features={plan.features} />
              </CardContent>
              <CardFooter>
                {ctaHref ? (
                  <Button asChild className="w-full">
                    <Link href={ctaHref}>{`Get ${plan.name}`}</Link>
                  </Button>
                ) : (
                  <UpgradeButton
                    priceId={plan.stripePriceId}
                    disabled={checkoutDisabled || isCurrent}
                    className="w-full"
                  >
                    {isCurrent ? "Current plan" : `Get ${plan.name}`}
                  </UpgradeButton>
                )}
              </CardFooter>
            </Card>
          )
        })}

        {contactCard && (
          <ContactTierCard
            card={contactCard}
            onYearly={hasBothIntervals && interval === "YEAR"}
          />
        )}
      </div>

      {checkoutDisabled && disabledNote && (
        <p className="text-sm text-muted-foreground">{disabledNote}</p>
      )}
    </div>
  )
}
