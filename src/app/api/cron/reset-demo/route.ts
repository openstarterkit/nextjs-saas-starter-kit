import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { seedDemoData } from "@/lib/demo-seed"

export const dynamic = "force-dynamic"
// Reseeding writes a few hundred rows; the default 10s is not enough.
export const maxDuration = 60

/**
 * Puts the public demo back to a known state, on a schedule.
 *
 * Wired to a Vercel cron in vercel.json (04:00 UTC daily). Visitors share the
 * demo accounts, so without this the data drifts: projects renamed, records
 * deleted, and by the second week the demo shows an empty or vandalised app.
 *
 * Two independent guards, because this endpoint deletes every user:
 *
 *  1. DEMO_MODE must be "true". A deployment serving real customers refuses
 *     even if someone hits the URL with a valid secret. This is the one that
 *     matters: a misconfigured CRON_SECRET is an inconvenience, running this
 *     against a production database is not recoverable.
 *  2. CRON_SECRET must match the Authorization header. Vercel sends it on
 *     scheduled invocations; without it the route is a public delete button.
 *     When the variable is unset the route refuses too, rather than defaulting
 *     to open.
 */
export async function GET(request: Request) {
  if (process.env.DEMO_MODE !== "true") {
    return NextResponse.json(
      { error: "Not a demo deployment: refusing to wipe data." },
      { status: 403 },
    )
  }

  const secret = process.env.CRON_SECRET
  if (!secret) {
    return NextResponse.json(
      { error: "CRON_SECRET is not set: refusing to run unauthenticated." },
      { status: 500 },
    )
  }

  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const startedAt = Date.now()
  try {
    const counts = await seedDemoData(prisma)
    return NextResponse.json({
      status: "ok",
      resetAt: new Date().toISOString(),
      durationMs: Date.now() - startedAt,
      ...counts,
    })
  } catch (error) {
    console.error("reset-demo failed:", error)
    return NextResponse.json({ error: "Reset failed" }, { status: 500 })
  }
}
