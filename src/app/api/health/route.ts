import { NextResponse } from "next/server"
import { siteConfig } from "@/config/site"

// Always fresh: a cached health check reports the version of whatever build
// happened to fill the cache, which is the opposite of what it is for.
export const dynamic = "force-dynamic"

/**
 * What is actually running here.
 *
 * The release smoke calls this first and compares `version` with the version
 * being shipped, which is the check that would have caught the deploy that
 * silently kept serving the previous build. `commit` comes from Vercel and is
 * null on a local run.
 *
 * Deliberately says nothing about the database or third-party services: this
 * has to stay a cheap, unauthenticated endpoint that anyone can hit, so it
 * reports identity, not internals.
 */
export function GET() {
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
      timestamp: new Date().toISOString(),
    },
    { headers: { "cache-control": "no-store" } },
  )
}
