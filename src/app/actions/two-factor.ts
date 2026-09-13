"use server"

import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { APIError } from "better-auth/api"
import { auth } from "@/auth"
import { getCurrentUser } from "@/lib/auth"
import { checkRateLimit } from "@/lib/rate-limit"

/**
 * Two-factor authentication, from the settings page.
 *
 * Everything runs server side, like the rest of authentication in this kit: the
 * secret and the backup codes are generated, encrypted and stored without ever
 * being handled by browser code. What reaches the page is a QR image, the key
 * to type by hand, and the codes to write down once.
 *
 * Turning it on is two steps on purpose. `enable` stores an unverified secret
 * and hands back the pairing data; only a correct code from the authenticator
 * flips it on (skipVerificationOnEnable is false in src/auth.ts). A setup
 * abandoned halfway therefore leaves the account exactly as it was, which is
 * the difference between a feature and a lock-out.
 */

const SETTINGS = "/dashboard/settings"

export type SetupState = {
  error?: string
  setup?: {
    /** Inline SVG of the pairing QR code. */
    qrSvg: string
    /** The same secret, for authenticators that take it typed. */
    secret: string
    /** Shown once, never retrievable again. */
    backupCodes: string[]
  }
  /** Fresh codes after a regeneration, shown in place of the old ones. */
  backupCodes?: string[]
}

/** Pulls the base32 secret out of the otpauth:// URI, for manual entry. */
function secretFromUri(totpURI: string): string {
  try {
    return new URL(totpURI).searchParams.get("secret") ?? ""
  } catch {
    return ""
  }
}

async function renderQr(totpURI: string): Promise<string> {
  // Imported here rather than at the top so the QR renderer is only loaded when
  // somebody actually sets up 2FA. It never reaches the browser either way:
  // this file is server-only, and the page receives finished markup.
  const { renderSVG } = await import("uqr")
  return renderSVG(totpURI, { border: 1 })
}

/**
 * Step one: prove the password, get the pairing data.
 *
 * The password is required by Better Auth and the requirement is a good one:
 * without it, anyone who walked up to an unlocked screen could bind their own
 * authenticator to the account. It also means an OAuth-only user has to set a
 * password first, which the card says in as many words.
 */
export async function startTwoFactorSetup(
  _prev: SetupState,
  formData: FormData
): Promise<SetupState> {
  const currentUser = await getCurrentUser()
  if (!currentUser) redirect("/login")

  // The demo signs visitors into a shared account that a cron resets every
  // night. A second factor set up here would outlive the reset for nobody and
  // lock the next visitor out of the showcase.
  if (process.env.DEMO_MODE === "true") return { error: "demo" }

  const password = String(formData.get("password") ?? "")
  if (!password) return { error: "password" }
  if (!(await checkRateLimit(`2fa-setup:${currentUser.id}`, 5))) return { error: "rate" }

  try {
    const result = await auth.api.enableTwoFactor({
      // The plugin can also issue codes by email ("otp"); this kit pairs an
      // authenticator app, which is the form that keeps working with no email
      // configured and nothing to deliver. Asked for explicitly rather than
      // left to the default, because the answer's shape depends on it.
      body: { password, method: "totp" },
      headers: await headers(),
    })
    if (result.method !== "totp") return { error: "generic" }
    return {
      setup: {
        qrSvg: await renderQr(result.totpURI),
        secret: secretFromUri(result.totpURI),
        backupCodes: result.backupCodes,
      },
    }
  } catch (error) {
    if (error instanceof APIError) return { error: "password" }
    throw error
  }
}

/**
 * Step two: one correct code turns it on.
 *
 * Better Auth flips `twoFactorEnabled` and marks the row verified inside this
 * call, and issues a new session while it is at it.
 */
export async function confirmTwoFactorSetup(
  _prev: SetupState,
  formData: FormData
): Promise<SetupState> {
  const currentUser = await getCurrentUser()
  if (!currentUser) redirect("/login")

  const code = String(formData.get("code") ?? "").replace(/\s/g, "")
  if (!code) return { error: "code" }
  if (!(await checkRateLimit(`2fa-confirm:${currentUser.id}`, 10))) return { error: "rate" }

  try {
    await auth.api.verifyTOTP({ body: { code }, headers: await headers() })
  } catch (error) {
    if (error instanceof APIError) return { error: "code" }
    throw error
  }
  redirect(`${SETTINGS}?ok=2fa-enabled`)
}

/**
 * Replaces every backup code with a new set. The old ones stop working the
 * moment this returns, which is the point: it is what you do after using one,
 * or after losing the piece of paper.
 */
export async function regenerateBackupCodes(
  _prev: SetupState,
  formData: FormData
): Promise<SetupState> {
  const currentUser = await getCurrentUser()
  if (!currentUser) redirect("/login")
  if (process.env.DEMO_MODE === "true") return { error: "demo" }

  const password = String(formData.get("password") ?? "")
  if (!password) return { error: "password" }
  if (!(await checkRateLimit(`2fa-codes:${currentUser.id}`, 5))) return { error: "rate" }

  try {
    const result = await auth.api.generateBackupCodes({
      body: { password },
      headers: await headers(),
    })
    return { backupCodes: result.backupCodes }
  } catch (error) {
    if (error instanceof APIError) return { error: "password" }
    throw error
  }
}

/**
 * Turns it off and deletes the secret with it. Re-enabling later pairs a new
 * authenticator from scratch, because the old secret is gone rather than
 * parked.
 */
export async function disableTwoFactor(formData: FormData) {
  const currentUser = await getCurrentUser()
  if (!currentUser) redirect("/login")
  if (process.env.DEMO_MODE === "true") redirect(`${SETTINGS}?error=demo`)

  const password = String(formData.get("password") ?? "")
  if (!password) redirect(`${SETTINGS}?error=2fa-password`)

  try {
    await auth.api.disableTwoFactor({
      body: { password },
      headers: await headers(),
    })
  } catch (error) {
    if (error instanceof APIError) redirect(`${SETTINGS}?error=2fa-password`)
    throw error
  }
  redirect(`${SETTINGS}?ok=2fa-disabled`)
}
