import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { config } from "dotenv"

// Playwright does not read .env files the way Next does, so without this the
// connection string is missing here even though the app under test has it.
config({ path: ".env.local" })
config({ path: ".env" })

/**
 * Removes the accounts the suite created.
 *
 * Signing up is the flow under test, so every run leaves real rows behind.
 * Without this the development database fills with e2e-* users, the admin
 * panel becomes unreadable, and the demo metrics stop meaning anything.
 *
 * Matches on the e2e- prefix only, so it can never touch a real account.
 */
export default async function globalTeardown() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    // Loudly: a silent return here leaves the database filling up run after
    // run, and nobody notices until the admin panel is unusable.
    console.warn("\n  teardown skipped: DATABASE_URL is not set, test accounts were left behind")
    return
  }

  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) })
  try {
    const { count } = await prisma.user.deleteMany({ where: { email: { startsWith: "e2e-" } } })
    if (count > 0) console.log(`\n  cleaned up ${count} test account(s)`)
  } finally {
    await prisma.$disconnect()
  }
}
