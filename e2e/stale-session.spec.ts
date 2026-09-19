import { test, expect } from "@playwright/test"
import pg from "pg"

/**
 * The state every other test is blind to: signed in, but not recently.
 *
 * Sessions stay valid for days; the library calls a session "fresh" only for
 * `freshAge` after it was created, a day by default. So somebody who signed in
 * yesterday is signed in and not fresh, which is the ordinary case rather than
 * an edge one. Every other test signs up first and therefore never leaves that
 * first day: this one moves the clock on the row instead.
 *
 * What it pins down is the settings page rendering at all, which it used to
 * answer with a crash: the list came from the library's `listSessions`, the one
 * call in the kit that wanted a fresh session. It is read from our own rows
 * now. Ending a device is checked from the same old session, because that is
 * the moment the feature exists for: nobody suspects a device on the day they
 * signed in.
 */

const password = "correct horse battery staple"

test("settings works when the session is old, and a device can still be ended", async ({ page, context }) => {
  test.setTimeout(120_000)
  const email = `e2e-stale-${Date.now()}@example.com`
  const db = new pg.Client({ connectionString: process.env.DATABASE_URL })
  await db.connect()

  try {
    await page.goto("/signup")
    await page.getByPlaceholder("you@example.com").fill(email)
    await page.getByPlaceholder(/Password/).fill(password)
    await page.getByRole("button", { name: "Create account" }).click()
    await page.waitForURL("**/dashboard", { timeout: 20_000 })

    const user = (await db.query('SELECT id FROM "User" WHERE email = $1', [email])).rows[0]

    // A second device, so there is something to end, and the whole account
    // moved three days into the past.
    await db.query(
      `INSERT INTO "Session" (id, "userId", token, "expiresAt", "createdAt", "updatedAt", "ipAddress", "userAgent")
       VALUES ($1, $2, $3, now() + interval '4 days', now() - interval '3 days', now(), '203.0.113.7', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1')`,
      [`stale${Date.now()}`, user.id, `tok_stale_${Date.now()}`]
    )
    await db.query(`UPDATE "Session" SET "createdAt" = now() - interval '3 days' WHERE "userId" = $1`, [user.id])

    // The cached copy in the cookie still carries the old timestamps, and it is
    // what the freshness check would read for up to a minute. Dropping it sends
    // the next request to the database instead of waiting out the cache.
    const cookies = await context.cookies()
    await context.clearCookies()
    await context.addCookies(cookies.filter((c) => !c.name.includes("session_data")))

    // 1. The page renders. It used to throw "Session is not fresh" here.
    await page.goto("/dashboard/settings")
    await expect(page.getByRole("heading", { name: /settings/i })).toBeVisible()
    await expect(page.getByText("Safari on iOS")).toBeVisible()
    await expect(page.getByText("203.0.113.7")).toBeVisible()

    // 2. And ending the other device works, from that same old session.
    await page.getByRole("button", { name: /end all other sessions/i }).click()
    await page.waitForURL(/\/dashboard\/settings\?ok=sessions-revoked/, { timeout: 20_000 })
    await expect(page.getByText("Safari on iOS")).toHaveCount(0)

    // 3. The row is gone from the database, not just from the page.
    const left = (await db.query('SELECT count(*)::int AS n FROM "Session" WHERE "userId" = $1', [user.id])).rows[0].n
    expect(left).toBe(1)
  } finally {
    await db.end()
  }
})
