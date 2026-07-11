"use server"

import { createHash, randomBytes } from "node:crypto"
import { redirect } from "next/navigation"
import { AuthError } from "next-auth"
import { z } from "zod"
import { signIn, signOut } from "@/auth"
import { prisma } from "@/lib/prisma"
import { hashPassword, passwordSchema } from "@/lib/password"
import { checkRateLimit } from "@/lib/rate-limit"

// Signs out via POST (CSRF-safe) and redirects home — skipping the unstyled
// Auth.js confirmation page that a plain GET link to /api/auth/signout shows.
export async function signOutAction() {
  await signOut({ redirectTo: "/" })
}

const emailSchema = z.email()

const signupSchema = z.object({
  name: z.string().trim().max(100).optional(),
  email: emailSchema,
  password: passwordSchema,
})

// ─── Sign in ──────────────────────────────────────────────────────────────────

export async function signInWithPassword(formData: FormData) {
  const email = String(formData.get("email") ?? "")
  const password = String(formData.get("password") ?? "")
  try {
    await signIn("credentials", { email, password, redirectTo: "/dashboard" })
  } catch (error) {
    // One generic message for every failure mode (see authorize in src/auth.ts):
    // never reveal whether the email exists or has a password.
    if (error instanceof AuthError) redirect("/login?error=credentials")
    // Success surfaces as a NEXT_REDIRECT throw — let it through.
    throw error
  }
}

export async function signInWithMagicLink(formData: FormData) {
  const parsed = emailSchema.safeParse(
    String(formData.get("email") ?? "")
      .trim()
      .toLowerCase()
  )
  if (!parsed.success) redirect("/login?error=email")
  if (!checkRateLimit(`magic:${parsed.data}`, 3)) redirect("/login?error=rate")
  // Redirects to /verify-request after sending the email.
  await signIn("resend", { email: parsed.data, redirectTo: "/dashboard" })
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

  const passwordHash = await hashPassword(password)
  await prisma.user.create({ data: { email, name, passwordHash } })

  if (process.env.RESEND_API_KEY) {
    // Verify the email and complete the first sign-in in one step: the magic
    // link doubles as the verification email (sets emailVerified on click).
    await signIn("resend", { email, redirectTo: "/dashboard" })
  } else {
    // No email configured (bare-bones local setup): sign straight in.
    await signIn("credentials", { email, password, redirectTo: "/dashboard" })
  }
}

// ─── Password reset ───────────────────────────────────────────────────────────

const RESET_TOKEN_TTL_MS = 30 * 60 * 1000

const sha256 = (value: string) => createHash("sha256").update(value).digest("hex")

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
  if (parsed.success && checkRateLimit(`reset:${parsed.data}`, 3)) {
    const user = await prisma.user.findUnique({ where: { email: parsed.data } })
    if (user && process.env.RESEND_API_KEY) {
      // The raw token only travels in the emailed link; the DB stores its hash.
      const token = randomBytes(32).toString("hex")
      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash: sha256(token),
          expires: new Date(Date.now() + RESET_TOKEN_TTL_MS),
        },
      })
      const { sendPasswordResetEmail } = await import("@/lib/email")
      await sendPasswordResetEmail(
        parsed.data,
        `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`
      )
    }
  }
  redirect("/forgot-password?sent=1")
}

export async function resetPassword(formData: FormData) {
  const token = String(formData.get("token") ?? "")
  if (!token) redirect("/reset-password?error=expired")

  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: sha256(token) },
  })
  if (!record || record.usedAt || record.expires < new Date()) {
    redirect("/reset-password?error=expired")
  }

  const parsed = passwordSchema.safeParse(String(formData.get("password") ?? ""))
  if (!parsed.success) redirect(`/reset-password?token=${token}&error=policy`)

  const passwordHash = await hashPassword(parsed.data)
  // Swap the hash and burn the token atomically: a replayed link must fail.
  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
    prisma.passwordResetToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
  ])
  redirect("/login?reset=1")
}
