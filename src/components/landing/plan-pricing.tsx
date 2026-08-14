import { getTranslations } from "next-intl/server"
import { prisma } from "@/lib/prisma"
import { PlanCards, type PlanCardData } from "@/components/billing/plan-cards"
import { exampleEnterpriseCard } from "@/components/billing/enterprise-card"
import { Reveal } from "@/components/landing/reveal"

/**
 * The pricing section, rendered from your `Plan` rows: this is what the kit
 * ships by default, so changing your pricing means editing data, not
 * components. Visitors have no session yet, so the cards link to sign-in
 * instead of opening a checkout.
 *
 * Selling an open source project instead of a product? `<Pricing />` in
 * `pricing.tsx` is a hand-written alternative (free tier plus a waitlist for
 * a paid one), enabled with KIT_SITE="true".
 */
export async function PlanPricing({ heading = "h2" }: { heading?: "h1" | "h2" }) {
  const t = await getTranslations("planPricing")
  const isDemo = process.env.DEMO_MODE === "true"
  // See `Pricing`: h2 under the hero on the landing, h1 when it is the
  // heading of /pricing. The styling does not change.
  const Heading = heading

  // Metered plans stay docs-only; one-time plans (Lifetime) live on the
  // billing page, the landing shows the classic recurring triad.
  const planRows = await prisma.plan.findMany({
    where: { isActive: true, meterEventName: null, interval: { not: "ONE_TIME" } },
    orderBy: { price: "asc" },
  })
  if (planRows.length === 0) return null

  const plans: PlanCardData[] = planRows.map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    description: p.description,
    price: p.price,
    interval: p.interval,
    stripePriceId: p.stripePriceId,
    features: p.features,
  }))

  return (
    <section id="pricing" className="bg-muted/30 py-24">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal className="mb-16 text-center">
          <Heading className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {t("title")}
          </Heading>
          <p className="mt-4 text-lg text-muted-foreground">
            {isDemo ? t("subtitleDemo") : t("subtitle")}
          </p>
        </Reveal>

        <Reveal delay={100}>
          <div className="mx-auto max-w-5xl">
            <PlanCards plans={plans} ctaHref="/login" contactCard={await exampleEnterpriseCard()} />
          </div>
        </Reveal>
      </div>
    </section>
  )
}
