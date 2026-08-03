import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { seedDemoData } from "../src/lib/demo-seed"

// ─────────────────────────────────────────────────────────────────────────────
// DEMO seed — fills an ISOLATED demo database with believable fake data so a
// public demo deployment (DEMO_MODE="true") has something to show: users for
// the admin panel, subscriptions for the MRR metrics, projects for the CRUD,
// and a lifetime purchase so the one-time billing state is visible too.
//
// The dataset and the writing logic live in src/lib/demo-seed.ts, shared with
// the scheduled reset at /api/cron/reset-demo so the two cannot drift.
//
// ⚠️ Running it WIPES all users/subscriptions/projects and recreates them —
// that's the point: re-run it to reset the demo. Never point it at a database
// with real users.
// ─────────────────────────────────────────────────────────────────────────────

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

seedDemoData(prisma)
  .then(({ users, subscriptions, purchases, projects }) => {
    console.log(
      `Demo seed complete: ${users} users, ${subscriptions} subscriptions, ${purchases} purchases, ${projects} projects`
    )
  })
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
