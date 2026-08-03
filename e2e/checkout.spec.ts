import { test, expect } from "@playwright/test"

/**
 * Starting a checkout.
 *
 * The test stops where our responsibility stops: at the handoff to Stripe.
 * Driving Stripe's own hosted page would test Stripe, not this kit, and it
 * would need live test keys and a card number in CI. What has to work here is
 * that a signed-in user reaches the billing page, presses upgrade, and the app
 * answers with a Stripe checkout URL instead of an error.
 *
 * Without STRIPE_SECRET_KEY configured the endpoint cannot produce a session,
 * so those assertions are skipped rather than failed: a clone with no Stripe
 * account should not see a red suite.
 */

const password = "correct horse battery staple"
const freshEmail = () => `e2e-pay-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`

async function signUp(page: import("@playwright/test").Page) {
  await page.goto("/signup")
  await page.getByPlaceholder("you@example.com").fill(freshEmail())
  await page.getByPlaceholder(/Password/).fill(password)
  await page.getByRole("button", { name: "Create account" }).click()
  await page.waitForURL("**/dashboard", { timeout: 20_000 })
}

test("a signed-in user can reach the billing page", async ({ page }) => {
  await signUp(page)
  await page.goto("/dashboard/billing")

  await expect(page.getByRole("heading", { name: /billing/i })).toBeVisible()
  await expect(page.getByText(/current plan/i)).toBeVisible()
})

test("checkout is refused to an anonymous visitor", async ({ page }) => {
  await page.context().clearCookies()

  const response = await page.request.post("/api/checkout", {
    data: { priceId: "price_whatever" },
    failOnStatusCode: false,
    // Without this the client follows the redirect to the login page and the
    // assertion would see its 200, hiding the fact that access was refused.
    maxRedirects: 0,
  })

  // Two layers guard this route and either is a pass: the proxy bounces the
  // request to /login, and the handler answers 401 if it ever gets through.
  // What must never happen is reaching Stripe.
  const status = response.status()
  expect([301, 302, 307, 308, 401]).toContain(status)
  if (status !== 401) {
    expect(response.headers()["location"] ?? "").toContain("/login")
  }
})

test("pressing upgrade hands off to Stripe", async ({ page }) => {
  await signUp(page)

  const priceId = process.env.STRIPE_PRO_PRICE_ID
  test.skip(!priceId, "STRIPE_PRO_PRICE_ID is not set in this environment")

  const response = await page.request.post("/api/checkout", {
    data: { priceId },
    failOnStatusCode: false,
  })

  // 503 is the kit saying billing is not configured, which is a valid state
  // for a fresh clone with no Stripe account.
  test.skip(response.status() === 503, "Stripe is not configured in this environment")

  expect(response.ok()).toBeTruthy()
  const body = await response.json()
  expect(body.url ?? "").toMatch(/^https:\/\/(checkout\.)?stripe\.com\//)
})
