"use server"

import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { APIError } from "better-auth/api"
import { z } from "zod"
import { auth } from "@/auth"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { passwordSchema } from "@/lib/password"
import { stripe } from "@/lib/stripe"
import { checkRateLimit } from "@/lib/rate-limit"

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
  // Linking is its own call now, not a sign-in that happens to attach: the
  // library returns the provider URL and this hands the browser over to it.
  const { url } = await auth.api.linkSocialAccount({
    body: { provider, callbackURL: SETTINGS },
    headers: await headers(),
  })
  if (url) redirect(url)
  redirect(`${SETTINGS}?error=unlink`)
}

export async function unlinkProvider(formData: FormData) {
  const currentUser = await getCurrentUser()
  if (!currentUser) redirect("/login")

  const user = await prisma.user.findUnique({
    where: { id: currentUser.id },
    select: { accounts: { select: { id: true, providerId: true } } },
  })
  if (!user) redirect("/login")

  const accountId = String(formData.get("accountId") ?? "")
  // The password now lives in Account too, as a row with providerId
  // "credential". So the OAuth accounts are everything except that one, and
  // the password is that one existing: both counts come from the same list.
  const oauthAccounts = user.accounts.filter((a) => a.providerId !== "credential")
  const hasPassword = user.accounts.some((a) => a.providerId === "credential")

  // Ownership check: only the user's own OAuth rows can be unlinked, and the
  // credential row is not something this form may delete.
  if (!oauthAccounts.some((a) => a.id === accountId)) redirect(`${SETTINGS}?error=unlink`)

  // Lock-out guard: after unlinking there must still be a way in — another
  // provider, a password, or the magic link (which needs Resend configured).
  const remainingMethods =
    oauthAccounts.length - 1 + (hasPassword ? 1 : 0) + (process.env.RESEND_API_KEY ? 1 : 0)
  if (remainingMethods < 1) redirect(`${SETTINGS}?error=last-method`)

  await prisma.account.delete({ where: { id: accountId } })
  redirect(`${SETTINGS}?ok=unlinked`)
}

export async function updatePassword(formData: FormData) {
  const currentUser = await getCurrentUser()
  if (!currentUser) redirect("/login")

  const parsed = passwordSchema.safeParse(String(formData.get("password") ?? ""))
  if (!parsed.success) redirect(`${SETTINGS}?error=policy`)

  const credential = await prisma.account.findFirst({
    where: { userId: currentUser.id, providerId: "credential" },
    select: { id: true },
  })

  // Changing an existing password requires proving you know the current one;
  // setting the first password doesn't (the live session is the proof). The
  // library draws the same line with two different calls, so the branch that
  // used to compare hashes here is now the choice of which one to make.
  try {
    if (credential) {
      await auth.api.changePassword({
        body: {
          newPassword: parsed.data,
          currentPassword: String(formData.get("currentPassword") ?? ""),
          revokeOtherSessions: true,
        },
        headers: await headers(),
      })
    } else {
      await auth.api.setPassword({
        body: { newPassword: parsed.data },
        headers: await headers(),
      })
    }
  } catch {
    redirect(`${SETTINGS}?error=current`)
  }
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
  // The session rows go with the user (onDelete: Cascade), so this only clears
  // the cookie that now points at nothing.
  await auth.api.signOut({ headers: await headers() })
  redirect("/")
}

/**
 * Moving the account to another address.
 *
 * The work is Better Auth's, in two hops (see `user.changeEmail` in
 * src/auth.ts): a confirmation to the current address, then a verification to
 * the new one, and only then does the email change. What this action adds is
 * the two refusals that belong to us, and one careful silence.
 *
 * The silence: when the new address already belongs to somebody else, the
 * library answers exactly as it does on success. We keep that, and say the same
 * thing back either way. Anything more helpful here would turn a settings form
 * into a way to ask which addresses have accounts — the same property the
 * sign-in page and the password reset defend.
 */
export async function changeEmail(formData: FormData) {
  const currentUser = await getCurrentUser()
  if (!currentUser) redirect("/login")

  // Shared demo accounts, restored nightly: moving one would take the showcase
  // with it until the reset.
  if (process.env.DEMO_MODE === "true") redirect(`${SETTINGS}?error=demo`)

  const parsed = z
    .email()
    .safeParse(String(formData.get("email") ?? "").trim().toLowerCase())
  if (!parsed.success) redirect(`${SETTINGS}?error=email-invalid`)

  // Asking to move to the address you already have is a no-op that would
  // otherwise send you an email about nothing.
  if (parsed.data === currentUser.email?.toLowerCase()) redirect(`${SETTINGS}?error=email-same`)

  // Rate limited by address, like the other flows that send mail: what is being
  // protected here is somebody else's inbox, not a password.
  if (!(await checkRateLimit(`change-email:${currentUser.id}`, 3))) redirect(`${SETTINGS}?error=rate`)

  try {
    await auth.api.changeEmail({
      body: { newEmail: parsed.data, callbackURL: SETTINGS },
      headers: await headers(),
    })
  } catch (error) {
    if (error instanceof APIError) redirect(`${SETTINGS}?error=email-change`)
    throw error
  }
  redirect(`${SETTINGS}?ok=email-sent`)
}
