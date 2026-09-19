import { NextResponse } from "next/server"
import { siteConfig } from "@/config/site"
import { getSchemaStatus } from "@/lib/schema-status"

// Always fresh: a cached health check reports the version of whatever build
// happened to fill the cache, which is the opposite of what it is for.
export const dynamic = "force-dynamic"

/**
 * What is actually running here, and whether its database can run it.
 *
 * The release smoke calls this first and compares `version` with the version
 * being shipped, which is the check that would have caught the deploy that
 * silently kept serving the previous build. `commit` comes from Vercel and is
 * null on a local run.
 *
 * `schema` is the one internal thing reported here, and the exception is
 * deliberate. This stays a cheap, unauthenticated endpoint that anyone can hit,
 * so it says nothing about third-party services: if Stripe or Resend are down,
 * the app is alive and degraded, and a public health check has no business
 * listing your vendors. A database that is behind the code is a different kind
 * of failure. The app is alive and wrong: public pages render and the first
 * sign-in fails. That is precisely what a health check exists to catch, and a
 * smoke test that does not sign in has no other way to see it.
 *
 * It costs one query per instance, reports a boolean and a count (never the
 * migration names), and says null rather than false when the database cannot
 * be asked. The details are in src/lib/schema-status.ts.
 */
export async function GET() {
  const schema = await getSchemaStatus()

  return NextResponse.json(
    {
      status: "ok",
      version: siteConfig.version,
      commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null,
      environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "unknown",
      // Not a secret: a demo deployment announces itself with a banner anyway.
      // It lets the release smoke expect the right thing about indexing rather
      // than being told which mode it is looking at.
      demo: process.env.DEMO_MODE === "true",
      schema,
      timestamp: new Date().toISOString(),
    },
    { headers: { "cache-control": "no-store" } },
  )
}
