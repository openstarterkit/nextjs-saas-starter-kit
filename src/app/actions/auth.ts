"use server"

import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { APIError } from "better-auth/api"
import { z } from "zod"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { passwordSchema } from "@/lib/password"
import { checkRateLimit } from "@/lib/rate-limit"

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
  try {
    await auth.api.signInEmail({ body: { email, password }, headers: await headers() })
  } catch (error) {
    // One generic message for every failure mode: never reveal whether the
    // email exists or has a password.
    if (error instanceof APIError) redirect("/login?error=credentials")
    throw error
  }
  redirect("/dashboard")
}

export async function signInWithMagicLink(formData: FormData) {
  const parsed = emailSchema.safeParse(
    String(formData.get("email") ?? "")
      .trim()
      .toLowerCase()
  )
  if (!parsed.success) redirect("/login?error=email")
  if (!checkRateLimit(`magic:${parsed.data}`, 3)) redirect("/login?error=rate")

  await auth.api.signInMagicLink({
    body: { email: parsed.data, callbackURL: "/dashboard" },
    headers: await headers(),
  })
  redirect("/verify-request")
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
  if (!checkRateLimit(`signup:${email}`, 3)) redirect("/signup?error=rate")

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
  if (parsed.success && checkRateLimit(`reset:${parsed.data}`, 3) && process.env.RESEND_API_KEY) {
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
