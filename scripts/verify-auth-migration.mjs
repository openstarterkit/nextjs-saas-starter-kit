#!/usr/bin/env node
/**
 * Checks that the account table matches what Better Auth expects.
 *
 *   node --env-file=.env scripts/verify-auth-migration.mjs
 *
 * Run it BEFORE upgrading to 2.1.0, to find out whether the migration can
 * succeed, and AFTER, to confirm it did. Read-only: it never writes to your
 * database.
 *
 * WHY THIS EXISTS, AND WHY IT CHECKS SOMETHING DIFFERENT THAN IT USED TO
 *
 * Better Auth 1.7.0 keyed accounts by an `issuer` column, and 2.0 of this kit
 * was built on it. Version 1.7.3 reverted that: accounts are found by
 * (providerId, accountId) again, as they were in 1.6, and the library never
 * writes `issuer` any more.
 *
 * That leaves two ways for a database upgraded to 2.0 to be wrong, and neither
 * announces itself:
 *
 *   1. The `issuer` column is still there and still NOT NULL. Nothing writes
 *      it, so every sign-up and every account link fails. Better Auth 1.7.3
 *      checks the schema when it starts and refuses authentication rather than
 *      failing one insert at a time, which is loud, but only once you deploy.
 *
 *   2. Two accounts share a (providerId, accountId) pair. On 1.7.0 through
 *      1.7.2 two provider configurations could share one issuer and collapse
 *      into a single row; from 1.7.3 each provider id keeps its own row again.
 *      A duplicate pair makes sign-in ambiguous, and it stops the 2.1.0
 *      migration from restoring the unique index.
 *
 * Both are questions about your data, so this asks your database rather than
 * comparing it against a value written here.
 */

import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set. Run with: node --env-file=.env scripts/verify-auth-migration.mjs")
  process.exit(2)
}

// Same driver adapter as src/lib/prisma.ts: Prisma 7 has no built-in engine.
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
})

const problems = []

try {
  // ── 1. Is the 1.7.0-1.7.2 column still there, and can it still block writes?
  //
  // Asked of the database rather than of the Prisma schema, because the two
  // disagreeing is exactly the situation worth catching: the schema file is
  // what you intend, the column is what you have.
  const [column] = await prisma.$queryRaw`
    SELECT is_nullable, column_default
      FROM information_schema.columns
     WHERE table_name = 'Account' AND column_name = 'issuer'
  `

  if (!column) {
    console.log('  issuer column   gone, which is what 1.7.3 expects')
  } else if (column.is_nullable === "NO" && column.column_default === null) {
    console.log('  issuer column   PRESENT, NOT NULL, no default')
    problems.push(
      'The "issuer" column is still required and Better Auth 1.7.3 never writes it, so every sign-up and account link will fail. Apply the 2.1.0 migration, or relax it by hand with: ALTER TABLE "Account" ALTER COLUMN "issuer" DROP NOT NULL;'
    )
  } else {
    console.log('  issuer column   present but nullable, so it cannot block a write')
  }

  // ── 2. Would the restored key be unique?
  const dupes = await prisma.$queryRaw`
    SELECT "providerId", "accountId", count(*)::int AS rows
      FROM "Account"
     GROUP BY "providerId", "accountId"
    HAVING count(*) > 1
     ORDER BY rows DESC
     LIMIT 20
  `

  if (dupes.length === 0) {
    console.log("  duplicate keys  none")
  } else {
    console.log(`  duplicate keys  ${dupes.length}`)
    for (const d of dupes) {
      console.log(`                  ${d.rows} rows for ${d.providerId} / ${d.accountId}`)
    }
    problems.push(
      `${dupes.length} duplicate (providerId, accountId) pair(s). Decide which row survives and delete the others before migrating: two rows for the same provider and account id are two records of one identity.`
    )
  }

  // ── 3. The counts, so a before-and-after comparison is possible.
  //
  // Nothing here can fail. It is here because the useful discipline around a
  // data migration is writing down what you expect before you run it, and this
  // gives you the numbers to write down.
  const byProvider = await prisma.account.groupBy({
    by: ["providerId"],
    _count: { _all: true },
    orderBy: { providerId: "asc" },
  })

  const users = await prisma.user.count()
  const sessions = await prisma.session.count()

  console.log("\n  accounts by provider")
  if (byProvider.length === 0) {
    console.log("                  none")
  }
  for (const row of byProvider) {
    console.log(`    ${String(row._count._all).padStart(5)}  ${row.providerId}`)
  }
  console.log(`\n  users ${users}, sessions ${sessions}`)
} finally {
  await prisma.$disconnect()
}

if (problems.length === 0) {
  console.log("\nNothing to fix. This database matches what Better Auth 1.7.3 expects.\n")
  process.exit(0)
}

console.log("")
for (const p of problems) console.log(`PROBLEM  ${p}`)
console.log('\nSee docs/upgrading.md, section "Upgrading to 2.1.0".\n')
process.exit(1)
