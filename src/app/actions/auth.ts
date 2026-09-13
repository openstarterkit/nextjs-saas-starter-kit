"use server"

import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { APIError } from "better-auth/api"
import { z } from "zod"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { passwordSchema } from "@/lib/password"
import { checkRateLimit, rateLimitKeyFromIp } from "@/lib/rate-limit"
import { BACKUP_CODE_LENGTH, normalizeBackupCode } from "@/lib/backup-codes"

// Every action here calls auth.api.* and then redirects OUTSIDE the try block.
// redirect() works by throwing, so a redirect inside a try is caught by the
// catch meant for authentication errors and turns a success into an error page.

// Signs out via POST (CSRF-safe) and redirects home.
export async function signOutAction() {
  await auth.api.signOut({ headers: await headers() })
  redirect("/")
}

const emailSchema = z.email()

const signupSchema = z.object({
  name: z.string().trim().max(100).optional(),
  email: emailSchema,
  password: passwordSchema,
})

// ─── Sign in ──────────────────────────────────────────────────────────────────

export async function signInWithPassword(formData: FormData) {
  // Trimmed and lowercased, because registration stores it that way. The 1.x
  // credentials provider normalised it inside authorize(); moving to the
  // library moved that responsibility here, and losing it would have made
  // sign-in quietly case sensitive for anyone who types their address with a
  // capital letter.
  const email = String(formData.get("email") ?? "").trim().toLowerCase()
  const password = String(formData.get("password") ?? "")
  // Set inside the try, acted on outside it, because redirect() throws.
  let needsSecondFactor = false
  try {
    const result = await auth.api.signInEmail({
      body: { email, password },
      headers: await headers(),
    })
    // With two-factor on, the password alone does NOT open a session: the
    // library answers with this flag and a short-lived cookie instead, and the
    // second factor is what creates the session. Ignoring it would send the
    // user to a dashboard they are not signed in to, which is the quiet
    // failure this kit has already paid for once (2.0.2).
    needsSecondFactor = "twoFactorRedirect" in result && result.twoFactorRedirect === true
  } catch (error) {
    // One generic message for every failure mode: never reveal whether the
    // email exists or has a password.
    if (error instanceof APIError) redirect("/login?error=credentials")
    throw error
  }
  redirect(needsSecondFactor ? "/2fa" : "/dashboard")
}

export async function signInWithMagicLink(formData: FormData) {
  const parsed = emailSchema.safeParse(
    String(formData.get("email") ?? "")
      .trim()
      .toLowerCase()
  )
  if (!parsed.success) redirect("/login?error=email")
  if (!(await checkRateLimit(`magic:${parsed.data}`, 3))) redirect("/login?error=rate")

  // Two-factor accounts do not get a magic link, and this is the one place in
  // the kit where that has to be enforced by hand.
  //
  // Better Auth applies the second factor to /sign-in/email only. A magic link
  // opens a session directly, so for an account with 2FA on it would be a way
  // around the very thing that was turned on: ask for a link, click it, and
  // the authenticator is never consulted. Password reset is NOT the same hole,
  // because signing in afterwards still goes through /sign-in/email and still
  // asks for the code.
  //
  // Nobody is locked out by this: enabling 2FA requires a password, so every
  // account that reaches this branch has one and can sign in with it.
  //
  // The response is deliberately identical to the normal one — same redirect,
  // no message — so this cannot be used to ask whether an address has an
  // account, or whether that account has 2FA. What replaces the explanation is
  // a line on the sign-in page, shown to everyone rather than to the accounts
  // it applies to.
  const user = await prisma.user.findUnique({
    where: { email: parsed.data },
    select: { twoFactorEnabled: true },
  })
  if (!user?.twoFactorEnabled) {
    await auth.api.signInMagicLink({
      body: { email: parsed.data, callbackURL: "/dashboard" },
      headers: await headers(),
    })
  }
  redirect("/verify-request")
}

// ─── Second factor, at sign-in ────────────────────────────────────────────────
//
// These run between the password and the session. The password step answered
// with `twoFactorRedirect` and set a short-lived cookie instead of signing
// anyone in; the calls below read that cookie from the incoming headers, and
// it is the successful verification that creates the session.
//
// The rate limit here is ours and sits on top of the library's own account
// lockout (ten consecutive failures, in src/auth.ts). Two different scopes:
// theirs counts per account, ours counts per caller, so neither a single
// account nor a single machine can grind through six digit codes.

export async function verifyTwoFactorCode(formData: FormData) {
  const code = String(formData.get("code") ?? "").replace(/\s/g, "")
  if (!code) redirect("/2fa?error=code")
  if (!(await checkRateLimit(await rateLimitKeyFromIp("2fa"), 10))) redirect("/2fa?error=rate")

  try {
    await auth.api.verifyTOTP({ body: { code }, headers: await headers() })
  } catch (error) {
    // Wrong code, expired code, or an expired challenge cookie: the page says
    // the same thing for all three, and none of them reveals anything about
    // the account.
    if (error instanceof APIError) redirect("/2fa?error=code")
    throw error
  }
  redirect("/dashboard")
}

export async function verifyTwoFactorBackupCode(formData: FormData) {
  // Forgives lower case, stray spaces and a missing dash, because these are
  // copied off paper by someone who has already lost their phone.
  const code = normalizeBackupCode(String(formData.get("code") ?? ""))
  if (!code) redirect("/2fa?mode=backup&error=backup")
  // Pasting all ten is the single most likely mistake here, because the card
  // that showed them has a Copy button that takes the lot. Answering "wrong
  // code" to that is true and sends the reader looking for the wrong problem:
  // they conclude the codes are broken rather than that one was wanted.
  if (code.replace(/-/g, "").length >= BACKUP_CODE_LENGTH * 2) {
    redirect("/2fa?mode=backup&error=multiple")
  }
  if (!(await checkRateLimit(await rateLimitKeyFromIp("2fa-backup"), 10))) {
    redirect("/2fa?mode=backup&error=rate")
  }

  try {
    await auth.api.verifyBackupCode({ body: { code }, headers: await headers() })
  } catch (error) {
    if (error instanceof APIError) redirect("/2fa?mode=backup&error=backup")
    throw error
  }
  // Settings rather than the dashboard, and it is the one place in the kit
  // where a sign-in does not land where every other sign-in lands. Someone who
  // just spent a backup code has one fewer way back in and does not necessarily
  // know it; this puts them in front of the button that makes more, with the
  // reason written above it.
  redirect("/dashboard/settings?ok=backup-used")
}

// ─── Sign up ──────────────────────────────────────────────────────────────────

export async function registerUser(formData: FormData) {
  // The demo showcases this page with the form disabled; reject direct POSTs too.
  if (process.env.DEMO_MODE === "true") redirect("/login")
  const parsed = signupSchema.safeParse({
    name: String(formData.get("name") ?? "").trim() || undefined,
    email: String(formData.get("email") ?? "")
      .trim()
      .toLowerCase(),
    password: String(formData.get("password") ?? ""),
  })
  if (!parsed.success) redirect("/signup?error=invalid")
  const { name, email, password } = parsed.data
  if (!(await checkRateLimit(`signup:${email}`, 3))) redirect("/signup?error=rate")

  const existing = await prisma.user.findUnique({ where: { email } })
  // Nudge existing accounts to /login (they can add a password from Settings
  // or via the reset flow). Message stays generic about which methods exist.
  if (existing) redirect("/signup?error=exists")

  try {
    // `name` is optional on this form but required by the library, so an empty
    // one falls back to the local part of the address. That is the same rule
    // the 2.0 migration uses to backfill users who never had a name, and the
    // two agreeing is deliberate: a name is never blank anywhere.
    //
    // Signing up also signs in (autoSignIn) and, when email is configured,
    // sends the verification email (emailVerification.sendOnSignUp). The 1.x
    // flow achieved both by sending a magic link instead; the destination is
    // the same and there is one fewer trick in the middle.
    await auth.api.signUpEmail({
      body: { email, password, name: name ?? email.split("@")[0] },
      headers: await headers(),
    })
  } catch (error) {
    if (error instanceof APIError) redirect("/signup?error=invalid")
    throw error
  }
  redirect("/dashboard")
}

// ─── Password reset ───────────────────────────────────────────────────────────
//
// The tokens, their hashing and their expiry all belong to the library now.
// What used to be here — a PasswordResetToken table, a SHA-256 of the raw
// token, a single-use flag and a sessionVersion bump to revoke live sessions —
// is gone: Better Auth stores the token in Verification, and
// `revokeSessionsOnPasswordReset` in src/auth.ts ends the other sessions,
// which is what the bump was imitating.

export async function requestPasswordReset(formData: FormData) {
  // The demo showcases this page with the form disabled; reject direct POSTs too.
  if (process.env.DEMO_MODE === "true") redirect("/login")
  const parsed = emailSchema.safeParse(
    String(formData.get("email") ?? "")
      .trim()
      .toLowerCase()
  )
  // Whatever happens, land on the same confirmation: the response must not
  // reveal whether an account exists.
  if (parsed.success && (await checkRateLimit(`reset:${parsed.data}`, 3)) && process.env.RESEND_API_KEY) {
    try {
      await auth.api.requestPasswordReset({
        body: { email: parsed.data, redirectTo: "/reset-password" },
        headers: await headers(),
      })
    } catch (error) {
      // Swallowed on purpose: an unknown address must look exactly like a known
      // one. Anything else here is an enumeration oracle.
      if (!(error instanceof APIError)) throw error
    }
  }
  redirect("/forgot-password?sent=1")
}

export async function resetPassword(formData: FormData) {
  const token = String(formData.get("token") ?? "")
  if (!token) redirect("/reset-password?error=expired")

  const parsed = passwordSchema.safeParse(String(formData.get("password") ?? ""))
  if (!parsed.success) redirect(`/reset-password?token=${token}&error=policy`)

  try {
    await auth.api.resetPassword({
      body: { newPassword: parsed.data, token },
      headers: await headers(),
    })
  } catch (error) {
    // Expired, already used, or never existed: the page says the same thing for
    // all three, which is also what it said before.
    if (error instanceof APIError) redirect("/reset-password?error=expired")
    throw error
  }
  redirect("/login?reset=1")
}
