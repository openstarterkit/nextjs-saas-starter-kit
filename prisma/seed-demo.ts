import { PrismaClient, Role, SubscriptionStatus } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

// ─────────────────────────────────────────────────────────────────────────────
// DEMO seed — fills an ISOLATED demo database with believable fake data so a
// public demo deployment (DEMO_MODE="true") has something to show: users for
// the admin panel, subscriptions for the MRR metrics, projects for the CRUD.
//
// ⚠️ Running it WIPES all users/subscriptions/projects and recreates them —
// that's the point: re-run it to reset the demo. Never point it at a database
// with real users.
// ─────────────────────────────────────────────────────────────────────────────

const DAY = 24 * 60 * 60 * 1000

function daysAgo(n: number) {
  return new Date(Date.now() - n * DAY)
}

function daysFromNow(n: number) {
  return new Date(Date.now() + n * DAY)
}

const fakeUsers: {
  name: string
  email: string
  signedUpDaysAgo: number
  plan?: "pro-monthly" | "pro-yearly"
  subStatus?: SubscriptionStatus
  projects: string[]
}[] = [
  { name: "Ada Lovelace", email: "ada@example.com", signedUpDaysAgo: 88, plan: "pro-yearly", subStatus: "ACTIVE", projects: ["Analytics engine", "Docs portal"] },
  { name: "Grace Hopper", email: "grace@example.com", signedUpDaysAgo: 80, plan: "pro-monthly", subStatus: "ACTIVE", projects: ["Compiler playground"] },
  { name: "Alan Turing", email: "alan@example.com", signedUpDaysAgo: 74, projects: ["Enigma dashboard", "Morphogenesis lab", "Chess bot"] },
  { name: "Margaret Hamilton", email: "margaret@example.com", signedUpDaysAgo: 66, plan: "pro-monthly", subStatus: "ACTIVE", projects: ["Guidance system"] },
  { name: "Linus Chen", email: "linus@example.com", signedUpDaysAgo: 59, projects: [] },
  { name: "Sofia Almeida", email: "sofia@example.com", signedUpDaysAgo: 51, plan: "pro-monthly", subStatus: "PAST_DUE", projects: ["Churn radar"] },
  { name: "Yuki Tanaka", email: "yuki@example.com", signedUpDaysAgo: 45, plan: "pro-yearly", subStatus: "ACTIVE", projects: ["Design tokens", "Icon pipeline"] },
  { name: "Omar Haddad", email: "omar@example.com", signedUpDaysAgo: 38, projects: ["Side project"] },
  { name: "Elena Petrova", email: "elena@example.com", signedUpDaysAgo: 30, plan: "pro-monthly", subStatus: "CANCELED", projects: [] },
  { name: "Marco Rossi", email: "marco@example.com", signedUpDaysAgo: 24, plan: "pro-monthly", subStatus: "ACTIVE", projects: ["Invoice generator"] },
  { name: "Priya Sharma", email: "priya@example.com", signedUpDaysAgo: 18, plan: "pro-monthly", subStatus: "TRIALING", projects: ["Feedback widget"] },
  { name: "Tom Becker", email: "tom@example.com", signedUpDaysAgo: 12, projects: [] },
  { name: "Aisha Bello", email: "aisha@example.com", signedUpDaysAgo: 7, plan: "pro-monthly", subStatus: "ACTIVE", projects: ["Launch checklist"] },
  { name: "Jonas Weber", email: "jonas@example.com", signedUpDaysAgo: 3, projects: ["Weekend MVP"] },
  { name: "Lucia Fernandez", email: "lucia@example.com", signedUpDaysAgo: 1, projects: [] },
]

async function main() {
  // Plans first (same example plans as the regular seed)
  const proPriceId = process.env.STRIPE_PRO_PRICE_ID ?? "price_pro_placeholder"
  const proYearlyPriceId = process.env.STRIPE_PRO_YEARLY_PRICE_ID ?? "price_pro_yearly_placeholder"

  const monthly = await prisma.plan.upsert({
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
      features: ["Everything in your free tier", "Unlimited projects", "Advanced analytics", "Priority support"],
    },
  })

  const yearly = await prisma.plan.upsert({
    where: { slug: "pro-yearly" },
    update: { stripePriceId: proYearlyPriceId },
    create: {
      name: "Pro Yearly",
      slug: "pro-yearly",
      description: "Example annual plan — save 2 months",
      price: 19000,
      interval: "YEAR",
      stripePriceId: proYearlyPriceId,
      features: ["Everything in Pro", "2 months free", "Priority support"],
    },
  })

  const planBySlug = { "pro-monthly": monthly, "pro-yearly": yearly }

  // Full reset: wipe users (cascades to subscriptions, projects, accounts, sessions)
  await prisma.user.deleteMany()

  // The two shared demo accounts (the login buttons upsert these too)
  await prisma.user.create({
    data: { email: "demo-user@example.com", name: "Demo User", role: Role.USER, createdAt: daysAgo(10) },
  })
  await prisma.user.create({
    data: { email: "demo-admin@example.com", name: "Demo Admin", role: Role.ADMIN, createdAt: daysAgo(90) },
  })

  // Fake population
  let subCounter = 0
  for (const fake of fakeUsers) {
    const createdAt = daysAgo(fake.signedUpDaysAgo)
    const user = await prisma.user.create({
      data: {
        email: fake.email,
        name: fake.name,
        role: Role.USER,
        createdAt,
        stripeCustomerId: fake.plan ? `cus_demo_${String(++subCounter).padStart(3, "0")}` : null,
        projects: {
          create: fake.projects.map((name, i) => ({
            name,
            description: "Demo project — seeded data",
            createdAt: daysAgo(Math.max(fake.signedUpDaysAgo - 1 - i * 2, 0)),
          })),
        },
      },
    })

    if (fake.plan && fake.subStatus) {
      const plan = planBySlug[fake.plan]
      const periodDays = fake.plan === "pro-yearly" ? 365 : 30
      await prisma.subscription.create({
        data: {
          userId: user.id,
          planId: plan.id,
          stripeSubscriptionId: `sub_demo_${String(subCounter).padStart(3, "0")}`,
          status: fake.subStatus,
          currentPeriodStart: daysAgo(Math.min(fake.signedUpDaysAgo, periodDays / 2)),
          currentPeriodEnd: daysFromNow(periodDays / 2),
          cancelAtPeriodEnd: fake.subStatus === "CANCELED",
        },
      })
    }
  }

  const users = await prisma.user.count()
  const subs = await prisma.subscription.count()
  const projects = await prisma.project.count()
  console.log(`Demo seed complete — ${users} users, ${subs} subscriptions, ${projects} projects`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
