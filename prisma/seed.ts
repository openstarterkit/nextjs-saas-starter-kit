import { PrismaClient, BillingInterval } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

// ─────────────────────────────────────────────────────────────────────────────
// EXAMPLE plans — these exist so the Stripe checkout flow works out of the box.
// They are NOT OpenStarterKit's own pricing (the kit itself is free; its paid
// "Pro · Teams" tier is still in design). Replace name/description/features/price
// with YOUR product's plans, and set real Stripe price IDs via the env vars below
// (or hard-code your own). The six plans demonstrate every billing pattern the
// kit supports: monthly, yearly, one-time (lifetime) and metered (usage-based,
// seeded inactive: see docs/billing.md to enable it).
// ─────────────────────────────────────────────────────────────────────────────

const examplePlans: {
  slug: string
  name: string
  description: string
  price: number
  interval: BillingInterval
  stripePriceId: string
  features: string[]
  meterEventName?: string
  isActive?: boolean
}[] = [
  {
    slug: "starter-monthly",
    name: "Starter",
    description: "Example entry plan: replace with your own",
    price: 900,
    interval: "MONTH",
    stripePriceId: process.env.STRIPE_STARTER_PRICE_ID ?? "price_starter_placeholder",
    features: ["Up to 3 projects", "Basic analytics", "Community support"],
  },
  {
    slug: "starter-yearly",
    name: "Starter Yearly",
    description: "Example annual plan: save 2 months",
    price: 9000,
    interval: "YEAR",
    stripePriceId: process.env.STRIPE_STARTER_YEARLY_PRICE_ID ?? "price_starter_yearly_placeholder",
    features: ["Up to 3 projects", "Basic analytics", "2 months free"],
  },
  {
    slug: "pro-monthly",
    name: "Pro",
    description: "Example paid plan: replace with your own",
    price: 1900,
    interval: "MONTH",
    stripePriceId: process.env.STRIPE_PRO_PRICE_ID ?? "price_pro_placeholder",
    features: [
      "Everything in Starter",
      "Unlimited projects",
      "Advanced analytics",
      "Priority support",
    ],
  },
  {
    slug: "pro-yearly",
    name: "Pro Yearly",
    description: "Example annual plan: save 2 months",
    price: 19000,
    interval: "YEAR",
    stripePriceId: process.env.STRIPE_PRO_YEARLY_PRICE_ID ?? "price_pro_yearly_placeholder",
    features: ["Everything in Pro", "2 months free", "Priority support"],
  },
  {
    slug: "lifetime",
    name: "Lifetime",
    description: "Example one-time purchase: pay once, keep it forever",
    price: 29900,
    interval: "ONE_TIME",
    stripePriceId: process.env.STRIPE_LIFETIME_PRICE_ID ?? "price_lifetime_placeholder",
    features: ["Everything in Pro", "All future updates", "No recurring billing"],
  },
  {
    // Usage-based example, seeded INACTIVE so it never shows up in the UI until
    // you have created a Billing Meter + metered price in Stripe (docs/billing.md).
    slug: "metered-example",
    name: "Pay as you go",
    description: "Example usage-based plan billed per API request",
    price: 0,
    interval: "MONTH",
    stripePriceId: process.env.STRIPE_METERED_PRICE_ID ?? "price_metered_placeholder",
    features: ["Billed per API request", "No monthly minimum"],
    meterEventName: "api_request",
    isActive: false,
  },
]

async function main() {
  for (const plan of examplePlans) {
    const { slug, ...data } = plan
    await prisma.plan.upsert({
      where: { slug },
      // keep the Stripe price ID (and copy tweaks) in sync with env on re-seed
      update: {
        stripePriceId: data.stripePriceId,
        description: data.description,
        meterEventName: data.meterEventName ?? null,
      },
      create: { slug, ...data },
    })
  }

  console.log(`Seed complete: ${examplePlans.length} example plans upserted`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
