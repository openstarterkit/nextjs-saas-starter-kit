import { prisma } from "@/lib/prisma"
import { PlanCards, type PlanCardData } from "@/components/billing/plan-cards"
import { exampleEnterpriseCard } from "@/components/billing/enterprise-card"
import { Reveal } from "@/components/landing/reveal"

/**
 * Demo-only replacement for the static <Pricing /> section (DEMO_MODE="true"):
 * renders the seeded example plans straight from the Plan table, so visitors
 * see the dynamic multi-tier pricing without signing in. The marketing
 * deployment keeps the hand-written OpenStarterKit section.
 */
export async function DemoPricing() {
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
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Pricing, driven by your database
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            These are the kit&apos;s seeded example plans, rendered live from the Plan table
            with monthly and yearly tiers. Sign in to the demo to see the full billing flow,
            including a one-time lifetime purchase.
          </p>
        </Reveal>

        <Reveal delay={100}>
          <div className="mx-auto max-w-5xl">
            <PlanCards plans={plans} ctaHref="/login" contactCard={exampleEnterpriseCard} />
          </div>
        </Reveal>
      </div>
    </section>
  )
}
