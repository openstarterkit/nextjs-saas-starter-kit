import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

// ─────────────────────────────────────────────────────────────────────────────
// EXAMPLE plans — these exist so the Stripe checkout flow works out of the box.
// They are NOT OpenStarterKit's own pricing (the kit itself is free; its paid
// "Pro · Teams" tier is still in design). Replace name/description/features/price
// with YOUR product's plans, and set real Stripe price IDs via the env vars below
// (or hard-code your own). Two plans are seeded to demonstrate the monthly/yearly
// BillingInterval pattern.
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  const proPriceId = process.env.STRIPE_PRO_PRICE_ID ?? "price_pro_placeholder"
  const proYearlyPriceId = process.env.STRIPE_PRO_YEARLY_PRICE_ID ?? "price_pro_yearly_placeholder"

  await prisma.plan.upsert({
    where: { slug: "pro-monthly" },
    // keep the Stripe price ID in sync with env on re-seed
    update: { stripePriceId: proPriceId },
    create: {
      name: "Pro",
      slug: "pro-monthly",
      description: "Example paid plan — replace with your own",
      price: 1900,
      interval: "MONTH",
      stripePriceId: proPriceId,
      features: [
        "Everything in your free tier",
        "Unlimited projects",
        "Advanced analytics",
        "Priority support",
      ],
    },
  })

  await prisma.plan.upsert({
    where: { slug: "pro-yearly" },
    update: { stripePriceId: proYearlyPriceId },
    create: {
      name: "Pro Yearly",
      slug: "pro-yearly",
      description: "Example annual plan — save 2 months",
      price: 19000,
      interval: "YEAR",
      stripePriceId: proYearlyPriceId,
      features: [
        "Everything in Pro",
        "2 months free",
        "Priority support",
      ],
    },
  })

  console.log("Seed complete — example plans created")
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
