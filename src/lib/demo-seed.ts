import type { PrismaClient, SubscriptionStatus, BillingInterval } from "@prisma/client"

/**
 * The demo dataset, and the function that (re)writes it.
 *
 * Lives here rather than inside prisma/seed-demo.ts because two callers need
 * it: the CLI script (`npm run db:seed:demo`) and the scheduled reset route
 * (`/api/cron/reset-demo`). Two copies of this would drift, and the demo would
 * end up looking different depending on which one last ran.
 *
 * ⚠️ Running it WIPES all users and everything cascading from them. That is
 * the point: it is how the public demo goes back to a known state. Never point
 * it at a database with real users.
 */

const DAY = 24 * 60 * 60 * 1000
const daysAgo = (n: number) => new Date(Date.now() - n * DAY)
const daysFromNow = (n: number) => new Date(Date.now() + n * DAY)

/** Same example plans as the regular seed (prisma/seed.ts). */
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

const fakeUsers: {
  name: string
  email: string
  signedUpDaysAgo: number
  plan?: "starter-monthly" | "pro-monthly" | "pro-yearly"
  subStatus?: SubscriptionStatus
  lifetime?: boolean
  projects: string[]
}[] = [
  { name: "Ada Lovelace", email: "ada@example.com", signedUpDaysAgo: 88, plan: "pro-yearly", subStatus: "ACTIVE", projects: ["Analytics engine", "Docs portal"] },
  { name: "Grace Hopper", email: "grace@example.com", signedUpDaysAgo: 80, plan: "pro-monthly", subStatus: "ACTIVE", projects: ["Compiler playground"] },
  { name: "Alan Turing", email: "alan@example.com", signedUpDaysAgo: 74, lifetime: true, projects: ["Enigma dashboard", "Morphogenesis lab", "Chess bot"] },
  { name: "Margaret Hamilton", email: "margaret@example.com", signedUpDaysAgo: 66, plan: "pro-monthly", subStatus: "ACTIVE", projects: ["Guidance system"] },
  { name: "Linus Chen", email: "linus@example.com", signedUpDaysAgo: 59, projects: [] },
  { name: "Sofia Almeida", email: "sofia@example.com", signedUpDaysAgo: 51, plan: "pro-monthly", subStatus: "PAST_DUE", projects: ["Churn radar"] },
  { name: "Yuki Tanaka", email: "yuki@example.com", signedUpDaysAgo: 45, plan: "pro-yearly", subStatus: "ACTIVE", projects: ["Design tokens", "Icon pipeline"] },
  { name: "Omar Haddad", email: "omar@example.com", signedUpDaysAgo: 38, projects: ["Side project"] },
  { name: "Elena Petrova", email: "elena@example.com", signedUpDaysAgo: 30, plan: "pro-monthly", subStatus: "CANCELED", projects: [] },
  { name: "Marco Rossi", email: "marco@example.com", signedUpDaysAgo: 24, plan: "starter-monthly", subStatus: "ACTIVE", projects: ["Invoice generator"] },
  { name: "Priya Sharma", email: "priya@example.com", signedUpDaysAgo: 18, plan: "pro-monthly", subStatus: "TRIALING", projects: ["Feedback widget"] },
  { name: "Tom Becker", email: "tom@example.com", signedUpDaysAgo: 12, projects: [] },
  { name: "Aisha Bello", email: "aisha@example.com", signedUpDaysAgo: 7, plan: "starter-monthly", subStatus: "ACTIVE", projects: ["Launch checklist"] },
  { name: "Jonas Weber", email: "jonas@example.com", signedUpDaysAgo: 3, projects: ["Weekend MVP"] },
  { name: "Lucia Fernandez", email: "lucia@example.com", signedUpDaysAgo: 1, projects: [] },
]

export type DemoSeedResult = {
  users: number
  subscriptions: number
  purchases: number
  projects: number
}

export async function seedDemoData(prisma: PrismaClient): Promise<DemoSeedResult> {
  // Plans first (same example plans as the regular seed)
  const planBySlug = new Map<string, { id: string; price: number }>()
  for (const plan of examplePlans) {
    const { slug, ...data } = plan
    const row = await prisma.plan.upsert({
      where: { slug },
      // keep the Stripe price ID (and copy tweaks) in sync with env on re-seed
      update: {
        stripePriceId: data.stripePriceId,
        description: data.description,
        meterEventName: data.meterEventName ?? null,
      },
      create: { slug, ...data },
    })
    planBySlug.set(slug, { id: row.id, price: row.price })
  }

  // Full reset: wipe users (cascades to subscriptions, purchases, projects,
  // accounts, sessions)
  await prisma.user.deleteMany()

  // The two shared demo accounts (the login buttons upsert these too)
  await prisma.user.create({
    data: { email: "demo-user@example.com", name: "Demo User", role: "USER", createdAt: daysAgo(10) },
  })
  await prisma.user.create({
    data: { email: "demo-admin@example.com", name: "Demo Admin", role: "ADMIN", createdAt: daysAgo(90) },
  })

  // Fake population
  let customerCounter = 0
  for (const fake of fakeUsers) {
    const createdAt = daysAgo(fake.signedUpDaysAgo)
    const hasBilling = Boolean(fake.plan || fake.lifetime)
    const user = await prisma.user.create({
      data: {
        email: fake.email,
        name: fake.name,
        role: "USER",
        createdAt,
        stripeCustomerId: hasBilling ? `cus_demo_${String(++customerCounter).padStart(3, "0")}` : null,
        projects: {
          create: fake.projects.map((name, i) => ({
            name,
            description: "Demo project (seeded data)",
            createdAt: daysAgo(Math.max(fake.signedUpDaysAgo - 1 - i * 2, 0)),
          })),
        },
      },
    })

    if (fake.plan && fake.subStatus) {
      const plan = planBySlug.get(fake.plan)!
      const periodDays = fake.plan === "pro-yearly" ? 365 : 30
      await prisma.subscription.create({
        data: {
          userId: user.id,
          planId: plan.id,
          stripeSubscriptionId: `sub_demo_${String(customerCounter).padStart(3, "0")}`,
          status: fake.subStatus,
          currentPeriodStart: daysAgo(Math.min(fake.signedUpDaysAgo, periodDays / 2)),
          currentPeriodEnd: daysFromNow(periodDays / 2),
          cancelAtPeriodEnd: fake.subStatus === "CANCELED",
        },
      })
    }

    if (fake.lifetime) {
      const plan = planBySlug.get("lifetime")!
      await prisma.purchase.create({
        data: {
          userId: user.id,
          planId: plan.id,
          stripePaymentIntentId: `pi_demo_${String(customerCounter).padStart(3, "0")}`,
          stripeCheckoutSessionId: `cs_demo_${String(customerCounter).padStart(3, "0")}`,
          amount: plan.price,
          createdAt: daysAgo(Math.max(fake.signedUpDaysAgo - 2, 0)),
        },
      })
    }
  }

  const [users, subscriptions, purchases, projects] = await Promise.all([
    prisma.user.count(),
    prisma.subscription.count(),
    prisma.purchase.count(),
    prisma.project.count(),
  ])

  return { users, subscriptions, purchases, projects }
}
