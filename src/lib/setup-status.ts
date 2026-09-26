import { prisma } from "@/lib/prisma"

/**
 * What the first run is still missing, so the public pages can say it instead
 * of failing. The landing and the pricing page read their plans from the
 * database: before one exists they used to render a stack trace, which is the
 * first thing a new clone showed.
 *
 * Development only. In production a missing database is a real fault, not a
 * setup step: a visitor must never read installation instructions, and
 * `/api/health` and `npm run check:deploy` are what report it there.
 */
export type SetupStep = "database-url" | "database-unreachable" | "migrations"

/**
 * Maps the failure of the first cheap query onto the step that fixes it.
 * P1000 (authentication failed), P1001 (server unreachable) and P1013 (the
 * URL itself is malformed) are about the connection; anything else at this
 * point means the connection worked and the tables are not there yet.
 */
export function stepFromError(error: unknown): SetupStep {
  const code = (error as { code?: string } | null)?.code
  return code === "P1000" || code === "P1001" || code === "P1013"
    ? "database-unreachable"
    : "migrations"
}

/** The step to show, or null when there is nothing to say. */
export async function pendingSetup(): Promise<SetupStep | null> {
  if (process.env.NODE_ENV === "production") return null
  if (!process.env.DATABASE_URL) return "database-url"
  try {
    await prisma.plan.count()
    return null
  } catch (error) {
    return stepFromError(error)
  }
}
