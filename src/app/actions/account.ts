"use server"

import { redirect } from "next/navigation"
import { signIn, signOut } from "@/auth"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { hashPassword, verifyPassword, passwordSchema } from "@/lib/password"
import { stripe } from "@/lib/stripe"

// Account-management actions behind a session: link/unlink OAuth providers
// and set or change the password. Outcomes surface as query params on the
// settings page (same redirect-with-code pattern as the auth pages).

const SETTINGS = "/dashboard/settings"
const LINKABLE_PROVIDERS = ["google", "github"]

// A subscription in any of these still bills, or is about to: deleting the
// account under it would leave Stripe charging a customer who no longer exists
// here. CANCELED, UNPAID and INCOMPLETE never resume on their own.
const BILLING_STATUSES = ["ACTIVE", "PAST_DUE", "TRIALING"]

export async function linkProvider(formData: FormData) {
  const provider = String(formData.get("provider") ?? "")
  if (!LINKABLE_PROVIDERS.includes(provider)) redirect(SETTINGS)
  // Starting an OAuth flow while signed in makes the adapter link the new
  // account to the current user instead of creating a fresh one.
  await signIn(provider, { redirectTo: SETTINGS })
}

export async function unlinkProvider(formData: FormData) {
  const currentUser = await getCurrentUser()
  if (!currentUser) redirect("/login")

  const user = await prisma.user.findUnique({
    where: { id: currentUser.id },
    select: { passwordHash: true, accounts: { select: { id: true } } },
  })
  if (!user) redirect("/login")

  const accountId = String(formData.get("accountId") ?? "")
  // Ownership check: only the user's own Account rows can be deleted.
  if (!user.accounts.some((a) => a.id === accountId)) redirect(`${SETTINGS}?error=unlink`)

  // Lock-out guard: after unlinking there must still be a way in — another
  // provider, a password, or the magic link (which needs Resend configured).
  const remainingMethods =
    user.accounts.length - 1 + (user.passwordHash ? 1 : 0) + (process.env.RESEND_API_KEY ? 1 : 0)
  if (remainingMethods < 1) redirect(`${SETTINGS}?error=last-method`)

  await prisma.account.delete({ where: { id: accountId } })
  redirect(`${SETTINGS}?ok=unlinked`)
}

export async function updatePassword(formData: FormData) {
  const currentUser = await getCurrentUser()
  if (!currentUser) redirect("/login")

  const parsed = passwordSchema.safeParse(String(formData.get("password") ?? ""))
  if (!parsed.success) redirect(`${SETTINGS}?error=policy`)

  const user = await prisma.user.findUnique({
    where: { id: currentUser.id },
    select: { passwordHash: true },
  })
  if (!user) redirect("/login")

  // Changing an existing password requires proving you know the current one;
  // setting the first password doesn't (the live session is the proof).
  if (user.passwordHash) {
    const current = String(formData.get("currentPassword") ?? "")
    if (!(await verifyPassword(current, user.passwordHash))) {
      redirect(`${SETTINGS}?error=current`)
    }
  }

  await prisma.user.update({
    where: { id: currentUser.id },
    data: { passwordHash: await hashPassword(parsed.data) },
  })
  redirect(`${SETTINGS}?ok=password`)
}

/**
 * Deletes the signed-in user's account.
 *
 * Every relation to User is declared onDelete: Cascade, so a single delete
 * clears sessions, linked provider accounts, projects, password reset tokens
 * and the subscription row with it. What needs care is not the data, it is the
 * order of operations around it, hence the four refusals below.
 */
export async function deleteAccount(formData: FormData) {
  const currentUser = await getCurrentUser()
  if (!currentUser) redirect("/login")

  // A demo deployment runs on seeded accounts that a cron restores. Letting a
  // visitor delete one would empty the showcase until the next reset.
  if (process.env.DEMO_MODE === "true") redirect(`${SETTINGS}?error=demo`)

  const user = await prisma.user.findUnique({
    where: { id: currentUser.id },
    select: {
      email: true,
      role: true,
      subscription: { select: { status: true, stripeSubscriptionId: true } },
    },
  })
  if (!user) redirect("/login")

  // The address has to be typed back, so no single click can destroy an
  // account and no stray form submission can either.
  const typed = String(formData.get("confirm") ?? "").trim().toLowerCase()
  if (typed !== user.email.toLowerCase()) redirect(`${SETTINGS}?error=confirm`)

  // A live subscription is cancelled at Stripe before anything is deleted here,
  // immediately rather than at period end: someone closing their account is not
  // asking to keep paying until the month runs out.
  //
  // The order matters and it is deliberate. If Stripe refuses, nothing is
  // deleted and the user is pointed at the billing portal, because the opposite
  // failure is the unforgivable one: an account gone from here while Stripe
  // keeps charging a customer who can no longer even sign in to stop it.
  //
  // Stripe is only touched when there is something to cancel, so a deployment
  // without billing configured never reaches this call.
  if (user.subscription && BILLING_STATUSES.includes(user.subscription.status)) {
    try {
      await stripe.subscriptions.cancel(user.subscription.stripeSubscriptionId)
    } catch (error) {
      // Already gone at Stripe is the outcome we wanted, not a failure: the
      // row here is simply stale, and the delete below clears it.
      const code = (error as { code?: string })?.code
      if (code !== "resource_missing") {
        console.error("[account] subscription cancel failed:", error)
        redirect(`${SETTINGS}?error=subscription`)
      }
    }
  }

  // The last administrator cannot remove themselves, or the deployment is left
  // with no way back into the admin panel.
  if (user.role === "ADMIN") {
    const admins = await prisma.user.count({ where: { role: "ADMIN" } })
    if (admins <= 1) redirect(`${SETTINGS}?error=last-admin`)
  }

  await prisma.user.delete({ where: { id: currentUser.id } })
  await signOut({ redirectTo: "/" })
}
