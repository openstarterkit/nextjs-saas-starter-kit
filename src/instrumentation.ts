/**
 * Runs once when the server starts, before it serves anything.
 *
 * A misconfigured deployment should announce itself here, in the boot logs,
 * rather than three days later when the first customer tries to pay. The check
 * is skipped on the edge runtime, which has no access to the server-only
 * variables in the first place.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return

  const { validateEnv } = await import("@/lib/env")
  validateEnv()
}
