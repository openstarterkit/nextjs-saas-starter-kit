import { test, expect } from "@playwright/test"

/**
 * Signing in as an existing user with email and password.
 *
 * This looks like it should already be covered by signup.spec.ts, and it is
 * not: signing up issues the session itself, so the credentials path is never
 * actually walked there. That left the one flow that a database migration can
 * break in silence with no end to end test at all, which is how it stayed
 * unnoticed until 2.0 moved the password hashes into another table.
 *
 * A second browser context takes the place of signing out. It is the pattern
 * signup.spec.ts already uses, and it keeps this test independent of how the
 * sign-out dialog is wired.
 */

const password = "correct horse battery staple"
const freshEmail = () => `e2e-login-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`

test("an existing user can sign in with email and password", async ({ browser }) => {
  const email = freshEmail()

  // Create the account, then throw the session away with the context.
  const signup = await browser.newContext()
  const signupPage = await signup.newPage()
  await signupPage.goto("/signup")
  await signupPage.locator('input[name="email"]').fill(email)
  await signupPage.locator('input[name="password"][type="password"]').fill(password)
  await signupPage.getByRole("button", { name: /create account|sign up/i }).click()
  await signupPage.waitForURL("**/dashboard", { timeout: 20_000 })
  await signup.close()

  // A visitor with no cookies, who knows the password.
  const returning = await browser.newContext()
  const page = await returning.newPage()

  // The wrong one first: it must not get in, and it must not say why.
  await page.goto("/login")
  // The type matters: in development the dev-login form carries a hidden field
  // with the same name, so input[name=password] alone matches two elements.
  await page.locator('input[name="email"]').fill(email)
  await page.locator('input[name="password"][type="password"]').fill("not the password")
  await page.getByRole("button", { name: /sign in|log in/i }).first().click()
  // Waiting for the error parameter, not just for /login: the URL is already
  // /login, so a looser pattern matches before the navigation happens and the
  // fields below get refilled on a page that is about to be replaced.
  await page.waitForURL(/error=credentials/, { timeout: 20_000 })

  // Then the right one.
  await page.locator('input[name="email"]').fill(email)
  await page.locator('input[name="password"][type="password"]').fill(password)
  await page.getByRole("button", { name: /sign in|log in/i }).first().click()

  await page.waitForURL("**/dashboard", { timeout: 20_000 })
  await expect(page.getByRole("heading", { name: /welcome back/i })).toBeVisible()
  await returning.close()
})
