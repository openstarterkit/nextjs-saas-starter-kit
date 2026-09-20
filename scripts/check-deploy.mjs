#!/usr/bin/env node
/**
 * Tells you whether a database is ready for the code in this checkout.
 *
 *   npm run check:deploy
 *   DATABASE_URL="postgresql://..." npm run check:deploy
 *
 * The first form checks the database in your .env.local (or .env). The second
 * checks any other one, production included: a DATABASE_URL set in the shell
 * wins over the env files. Read-only, always. It never writes to the database
 * and never applies anything; it tells you what to run.
 *
 * WHY THIS EXISTS
 *
 * Builds do not run migrations, on purpose (docs/deployment.md), so a deploy
 * can put new code in front of a database that is still behind it. Nothing
 * fails when that happens. Every query that does not name what is missing keeps
 * working, public pages render, and the first sign-in or checkout that touches
 * the new column fails with a database error that does not say "a migration
 * was never applied". Run this before a deploy and it says so in one line.
 *
 * It checks, in order:
 *
 *   1. that the database answers;
 *   2. that every folder in prisma/migrations has been applied, and that none
 *      started and never finished;
 *   3. the account table: which shape it is in, and, on a database upgraded
 *      from 2.0.x, the two problems the 2.1.0 migration refuses to run over.
 *      This part used to be scripts/verify-auth-migration.mjs.
 *
 * Exit code 0: ready. 1: something to fix, and the output says what. 2: the
 * check could not run, which is a different answer from "not ready".
 */

import { existsSync, readdirSync } from "node:fs"
import path from "node:path"
import pg from "pg"
import { accountTableShape } from "./account-shape.mjs"

// The migration that converts the account table. Named here so the shape and
// the migration list do not report the same thing twice.
const CONVERTS_ACCOUNT_TABLE = "20260828100000_better_auth"

const root = path.resolve(import.meta.dirname, "..")
const LABEL = 15
const line = (label, text = "") => console.log(`  ${label.padEnd(LABEL)}${text}`)
const more = (text) => console.log(`  ${"".padEnd(LABEL)}${text}`)

const url = process.env.DATABASE_URL
if (!url) {
  console.error('\nDATABASE_URL is not set. Put it in .env.local, or run:\n  DATABASE_URL="postgresql://..." npm run check:deploy\n')
  process.exit(2)
}

let target
try {
  const parsed = new URL(url)
  target = { host: parsed.hostname, database: parsed.pathname.replace(/^\//, "") || "(default)" }
} catch {
  console.error("\nDATABASE_URL is not a valid connection string.\n")
  process.exit(2)
}

// Which database, before anything else. Checking the development database while
// believing it is production is the easiest way to be reassured by this tool.
console.log(`\nChecking ${target.host} / ${target.database}\n`)

const client = new pg.Client({ connectionString: url, connectionTimeoutMillis: 10_000 })

// The counts, so a before-and-after comparison around a migration is possible:
// write them down before you run one that moves data. These three tables have
// been there since the first migration, so this answers whatever shape the
// account table is in, which is the point of calling it from every branch.
const reportRowCounts = async () => {
  const {
    rows: [counts],
  } = await client.query(
    `SELECT (SELECT count(*) FROM "User")::int AS users,
            (SELECT count(*) FROM "Account")::int AS accounts,
            (SELECT count(*) FROM "Session")::int AS sessions`,
  )
  line("rows", `${counts.users} users, ${counts.accounts} accounts, ${counts.sessions} sessions`)
}

try {
  await client.connect()
} catch (error) {
  line("connection", "FAILED")
  more(error.message)
  console.log("\nThe database did not answer, so nothing else was checked.\n")
  process.exit(2)
}

const problems = []

try {
  // ── 1. Connection ─────────────────────────────────────────────────────────
  await client.query("SELECT 1")
  line("connection", "ok")
  if (target.host.includes("-pooler")) {
    more("this is a pooled connection: fine for checking, but apply")
    more("migrations over the direct one (the same host without -pooler)")
  }

  // ── 2. Migrations ─────────────────────────────────────────────────────────
  const dir = path.join(root, "prisma", "migrations")
  const expected = readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && existsSync(path.join(dir, entry.name, "migration.sql")))
    .map((entry) => entry.name)
    .sort()

  let recorded = []
  try {
    const result = await client.query(
      `SELECT migration_name, finished_at, rolled_back_at FROM "_prisma_migrations"`,
    )
    recorded = result.rows
  } catch (error) {
    // No migrations table: nothing was ever applied to this database.
    if (error.code !== "42P01") throw error
  }

  const applied = new Set(recorded.filter((r) => r.finished_at && !r.rolled_back_at).map((r) => r.migration_name))
  const stuck = recorded.filter((r) => !r.finished_at && !r.rolled_back_at).map((r) => r.migration_name)
  const missing = expected.filter((name) => !applied.has(name))
  const elsewhere = [...applied].filter((name) => !expected.includes(name)).sort()

  if (missing.length === 0 && stuck.length === 0) {
    line("migrations", `${expected.length} of ${expected.length} applied`)
  }
  if (stuck.length > 0) {
    line("migrations", `${stuck.length} started and never finished:`)
    for (const name of stuck) more(`  ${name}`)
    more("fix what stopped it, then record the outcome with")
    more("npx prisma migrate resolve (https://pris.ly/d/migrate-resolve)")
    problems.push("a migration is stuck half way")
  }
  if (missing.length > 0) {
    line(stuck.length > 0 ? "" : "migrations", `${missing.length} of ${expected.length} not applied:`)
    for (const name of missing) more(`  ${name}`)
    more("-> npx prisma migrate deploy")
    problems.push(`${missing.length} migration(s) not applied`)
  }
  // Not a problem on its own: a database that ran a migration from another
  // branch, or a newer checkout. Worth seeing before you deploy this one on it.
  if (elsewhere.length > 0) {
    more(`${elsewhere.length} applied here that this checkout does not have:`)
    for (const name of elsewhere) more(`  ${name}`)
  }

  // ── 3. The account table ──────────────────────────────────────────────────
  //
  // Asked of the database rather than of the Prisma schema, because the two
  // disagreeing is exactly the situation worth catching.
  //
  // The shape comes first, and it is the whole reason this section is arranged
  // this way. Before 2.0 the table is still Auth.js's, with no providerId, so
  // the two checks below are asking about columns that do not exist: they used
  // to end the run with "the check stopped on an unexpected error", on the
  // databases that most needed the answer.
  let accountProblems = 0
  try {
    const { rows: columns } = await client.query(
      `SELECT column_name, is_nullable, column_default FROM information_schema.columns
        WHERE table_schema = current_schema() AND table_name = 'Account'`,
    )
    const shape = accountTableShape(columns.map((c) => c.column_name))

    if (shape === "absent") {
      // A new database, covered by the migrations above.
      line("account table", "not created yet")
    } else if (shape === "before-2.0") {
      line("account table", "still the shape it had before 2.0:")
      more("provider / providerAccountId, and no providerId. The 2.0")
      more("migration converts it, and moves every password while it")
      more("does (docs/upgrading.md, 2.0.0). Nothing else about this")
      more("table can be checked until then")
      // Only when the migration list did not already say so, which it does on
      // every database that simply has not been migrated yet.
      if (!missing.includes(CONVERTS_ACCOUNT_TABLE)) {
        problems.push("the account table is still the shape it had before 2.0")
      }
      await reportRowCounts()
    } else {
      const issuer = columns.find((c) => c.column_name === "issuer")
      if (issuer && issuer.is_nullable === "NO" && issuer.column_default === null) {
        line("account table", 'the "issuer" column is still required, and nothing writes it:')
        more("every sign-up and every account link fails until the 2.1.0")
        more("migration is applied (docs/upgrading.md, 2.1.0)")
        accountProblems++
      }

      const { rows: dupes } = await client.query(
        `SELECT "providerId", "accountId", count(*)::int AS rows FROM "Account"
          GROUP BY "providerId", "accountId" HAVING count(*) > 1
          ORDER BY rows DESC LIMIT 20`,
      )
      if (dupes.length > 0) {
        line(accountProblems ? "" : "account table", `${dupes.length} duplicate (providerId, accountId) pair(s):`)
        for (const d of dupes) more(`  ${d.rows} rows for ${d.providerId} / ${d.accountId}`)
        more("decide which row survives and delete the others: the 2.1.0")
        more("migration refuses to run over them")
        accountProblems++
      }

      if (accountProblems === 0) line("account table", "ok")
      else problems.push("the account table needs attention")

      await reportRowCounts()
    }
  } catch (error) {
    // A shape no version of this kit has produced. Say so and keep the answer
    // above, rather than turning a useful run into "could not check".
    if (error.code !== "42P01" && error.code !== "42703") throw error
    line("account table", "could not be read on this database:")
    more(error.message)
    more("apply the migrations above, then run this again")
  }
} catch (error) {
  console.log(`\nThe check stopped on an unexpected error: ${error.message}\n`)
  await client.end()
  process.exit(2)
}

await client.end()

if (problems.length === 0) {
  console.log("\nReady: this database can run the code in this checkout.\n")
  process.exit(0)
}

console.log(`\nNot ready: ${problems.join("; ")}. Fix these before you deploy.\n`)
process.exit(1)
