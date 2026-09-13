import { test, expect } from "@playwright/test"
import { createHmac } from "node:crypto"

/**
 * Two-factor authentication, end to end (2.2).
 *
 * This is the test the release exists for. With 2FA on, the password no longer
 * opens a session: the library answers with a redirect flag and a short-lived
 * cookie, and only the code creates the session. A sign-in action that ignored
 * that would send the user to a dashboard they are not signed in to — no error,
 * nothing in a log. The assertion that catches it is the plain one below:
 * signing in lands on /2fa, not on /dashboard.
 *
 * The codes are generated here rather than typed by a person, so the whole
 * round trip runs unattended: pair, confirm, sign out, sign in with a code, and
 * sign in again with a backup code.
 */

const password = "correct horse battery staple"
const freshEmail = () => `e2e-2fa-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`

/** RFC 4648 base32, the encoding an otpauth:// secret arrives in. */
function base32Decode(input: string): Buffer {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"
  let bits = ""
  for (const char of input.replace(/=+$/, "").toUpperCase()) {
    const index = alphabet.indexOf(char)
    if (index >= 0) bits += index.toString(2).padStart(5, "0")
  }
  const bytes: number[] = []
  for (let i = 0; i + 8 <= bits.length; i += 8) bytes.push(parseInt(bits.slice(i, i + 8), 2))
  return Buffer.from(bytes)
}

/** RFC 6238, with the defaults the plugin ships: SHA-1, 6 digits, 30 seconds. */
function totp(secret: string, atMs = Date.now()): string {
  const counter = Buffer.alloc(8)
  counter.writeBigUInt64BE(BigInt(Math.floor(atMs / 1000 / 30)))
  const digest = createHmac("sha1", base32Decode(secret)).update(counter).digest()
  const offset = digest[digest.length - 1] & 0x0f
  const code = (digest.readUInt32BE(offset) & 0x7fffffff) % 1_000_000
  return String(code).padStart(6, "0")
}

test("a user can turn on 2FA, and then needs a code to sign in", async ({ browser }) => {
  const email = freshEmail()

  // ── Sign up, then pair an authenticator ────────────────────────────────
  const first = await browser.newContext()
  const page = await first.newPage()
  await page.goto("/signup")
  await page.locator('input[name="email"]').fill(email)
  await page.locator('input[name="password"][type="password"]').fill(password)
  await page.getByRole("button", { name: /create account|sign up/i }).click()
  await page.waitForURL("**/dashboard", { timeout: 20_000 })

  await page.goto("/dashboard/settings")
  await page.locator("#enable-password").fill(password)
  await page.getByRole("button", { name: /turn on/i }).click()

  // The pairing key is on screen for authenticators that take it typed; the QR
  // beside it carries the same secret.
  const secret = (await page.locator("code").first().innerText()).trim()
  expect(secret.length).toBeGreaterThan(10)

  // Written down before confirming, because after this they are never shown
  // again — which is the behaviour under test as much as it is the UI copy.
  const backupCodes = await page.locator("ul.font-mono li").allInnerTexts()
  expect(backupCodes.length).toBeGreaterThan(0)

  await page.locator("#totp-code").fill(totp(secret))
  await page.getByRole("button", { name: /^confirm$/i }).click()
  await page.waitForURL(/ok=2fa-enabled/, { timeout: 20_000 })
  await first.close()

  // ── The password alone is no longer enough ─────────────────────────────
  const second = await browser.newContext()
  const returning = await second.newPage()
  await returning.goto("/login")
  await returning.locator('input[name="email"]').fill(email)
  await returning.locator('input[name="password"][type="password"]').fill(password)
  await returning.getByRole("button", { name: /sign in|log in/i }).first().click()

  // The assertion this whole file is for.
  await returning.waitForURL("**/2fa", { timeout: 20_000 })

  // A wrong code keeps you here, and says so without saying which part failed.
  await returning.locator("#code").fill("000000")
  await returning.getByRole("button", { name: /verify/i }).click()
  await returning.waitForURL(/error=code/, { timeout: 20_000 })

  await returning.locator("#code").fill(totp(secret))
  await returning.getByRole("button", { name: /verify/i }).click()
  await returning.waitForURL("**/dashboard", { timeout: 20_000 })
  await second.close()

  // ── And a backup code works when the phone does not ────────────────────
  const third = await browser.newContext()
  const lostPhone = await third.newPage()
  await lostPhone.goto("/login")
  await lostPhone.locator('input[name="email"]').fill(email)
  await lostPhone.locator('input[name="password"][type="password"]').fill(password)
  await lostPhone.getByRole("button", { name: /sign in|log in/i }).first().click()
  await lostPhone.waitForURL("**/2fa", { timeout: 20_000 })

  await lostPhone.getByRole("link", { name: /backup code/i }).click()
  await lostPhone.waitForURL(/mode=backup/, { timeout: 20_000 })

  // The screen someone reaches with no phone has to say what happens when the
  // codes are gone too, because the answer is "nothing you can do yourself".
  await expect(lostPhone.getByText(/no way to reset this yourself/i)).toBeVisible()

  await lostPhone.locator("#code").fill(backupCodes[0].trim())
  await lostPhone.getByRole("button", { name: /verify/i }).click()
  // Settings, not the dashboard: a spent code is worth saying out loud, in
  // front of the button that replaces it.
  await lostPhone.waitForURL(/ok=backup-used/, { timeout: 20_000 })
  await expect(lostPhone.getByText(/backup code, and that code is now spent/i)).toBeVisible()
  await third.close()
})
