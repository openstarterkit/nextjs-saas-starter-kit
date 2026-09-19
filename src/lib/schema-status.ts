import { MIGRATIONS } from "@/generated/migrations"
import { prisma } from "@/lib/prisma"

/**
 * Whether the database this deployment talks to has every migration the code
 * was built with.
 *
 * Builds do not run migrations (docs/deployment.md), and a database that is
 * behind does not fail on its own. Every query that does not name the missing
 * column keeps working, until one does. That is how a deployment can answer
 * every public page correctly and then fail the first sign-in.
 *
 * What this reports, and what it deliberately does not:
 *
 * - A boolean and a count, never the migration names. It feeds /api/health,
 *   which is public, and which migrations a deployment is missing is nobody
 *   else's business.
 * - null when the database cannot be asked. Unknown is a different answer from
 *   behind, and a health endpoint that turns red on every database hiccup stops
 *   being useful as a sign of life.
 */

export type SchemaStatus = { aligned: boolean | null; pending: number | null }

/** Reads the migrations recorded as applied; null when no migration table exists. */
export type AppliedMigrationsReader = () => Promise<string[] | null>

/** The migrations in `expected` that `applied` lacks, in the order they were written. */
export function missingMigrations(expected: readonly string[], applied: Iterable<string>): string[] {
  const done = new Set(applied)
  return expected.filter((name) => !done.has(name))
}

export function createSchemaStatus(
  expected: readonly string[],
  read: AppliedMigrationsReader,
  timeoutMs = 2000,
): () => Promise<SchemaStatus> {
  // Aligned is remembered for the life of the instance, which keeps the
  // endpoint at one query per instance: a deploy cannot un-apply a migration.
  // Behind and unknown are never remembered. The next thing that happens after
  // a failed check is somebody applying the migration and checking again, and a
  // warm instance that kept its old answer would fail a database that is now
  // fine.
  let aligned = false

  return async () => {
    if (aligned) return { aligned: true, pending: 0 }
    try {
      const applied = await withTimeout(read(), timeoutMs)
      const missing = missingMigrations(expected, applied ?? [])
      if (missing.length === 0) aligned = true
      return { aligned: missing.length === 0, pending: missing.length }
    } catch {
      return { aligned: null, pending: null }
    }
  }
}

/**
 * True when an error means the migrations table does not exist, however the
 * driver chose to wrap it: Postgres code 42P01, carried in the message of a raw
 * query failure, in `meta`, or in the `cause` of a driver adapter error.
 */
export function isUndefinedTable(error: unknown): boolean {
  const seen = new Set<unknown>()
  const visit = (value: unknown): boolean => {
    if (!value || typeof value !== "object" || seen.has(value)) return false
    seen.add(value)
    const e = value as Record<string, unknown>
    if (e.code === "42P01" || e.originalCode === "42P01" || e.kind === "TableDoesNotExist") return true
    if (typeof e.message === "string" && (e.message.includes("42P01") || /"?_prisma_migrations"? does not exist/.test(e.message))) {
      return true
    }
    return visit(e.meta) || visit(e.cause)
  }
  return visit(error)
}

async function readAppliedFromDatabase(): Promise<string[] | null> {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set")
  try {
    const rows = await prisma.$queryRaw<{ migration_name: string }[]>`
      SELECT migration_name FROM "_prisma_migrations"
       WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL
    `
    return rows.map((row) => row.migration_name)
  } catch (error) {
    // No table means migrations were never applied to this database at all.
    if (isUndefinedTable(error)) return null
    throw error
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`no answer within ${ms} ms`)), ms)
  })
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer))
}

export const getSchemaStatus = createSchemaStatus(MIGRATIONS, readAppliedFromDatabase)
