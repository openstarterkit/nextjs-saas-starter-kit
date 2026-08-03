import { test, expect } from "@playwright/test"

/**
 * Signing up with email and password, the whole way through: form, account
 * creation, session, dashboard.
 *
 * The kit signs the user in with credentials right after registering, so no
 * inbox is involved and the flow really does end on the dashboard. Each run
 * uses a fresh address, because a second signup with the same email is
 * supposed to be refused (and there is a test for that below).
 */

const password = "correct horse battery staple"
const freshEmail = () => `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`

test("a new visitor can sign up and lands on the dashboard", async ({ page }) => {
  await page.goto("/signup")

  await page.getByPlaceholder("Name (optional)").fill("E2E Tester")
  await page.getByPlaceholder("you@example.com").fill(freshEmail())
  await page.getByPlaceholder(/Password/).fill(password)
  await page.getByRole("button", { name: /create account|sign up/i }).click()

  await page.waitForURL("**/dashboard", { timeout: 20_000 })
  await expect(page.getByRole("heading", { name: /welcome back/i })).toBeVisible()
})

test("the same email cannot be registered twice", async ({ browser }) => {
  const email = freshEmail()

  const signUpIn = async (context: import("@playwright/test").BrowserContext) => {
    const page = await context.newPage()
    await page.goto("/signup")
    await page.getByPlaceholder("you@example.com").fill(email)
    await page.getByPlaceholder(/Password/).fill(password)
    await page.getByRole("button", { name: "Create account" }).click()
    return page
  }

  // A second browser context rather than signing out: a fresh visitor is what
  // this is about, and it avoids depending on how sign-out is wired.
  const first = await browser.newContext()
  const firstPage = await signUpIn(first)
  await firstPage.waitForURL("**/dashboard", { timeout: 20_000 })
  await first.close()

  const second = await browser.newContext()
  const secondPage = await signUpIn(second)
  await secondPage.waitForURL(/\/signup\?error=exists/, { timeout: 20_000 })
  await second.close()
})

test("a password under the minimum is refused", async ({ page }) => {
  await page.goto("/signup")
  await page.getByPlaceholder("you@example.com").fill(freshEmail())
  await page.getByPlaceholder(/Password/).fill("short")
  await page.getByRole("button", { name: /create account|sign up/i }).click()

  // Either the browser blocks it or the action bounces back with an error:
  // both are acceptable, landing on the dashboard is not.
  await page.waitForTimeout(2000)
  expect(page.url()).not.toContain("/dashboard")
})

test("the dashboard is not reachable without signing in", async ({ page }) => {
  await page.context().clearCookies()
  await page.goto("/dashboard")
  await expect(page).toHaveURL(/\/login/)
})
