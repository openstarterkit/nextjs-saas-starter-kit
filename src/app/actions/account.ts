"use server"

import { redirect } from "next/navigation"
import { auth, signIn } from "@/auth"
import { prisma } from "@/lib/prisma"
import { hashPassword, verifyPassword, passwordSchema } from "@/lib/password"

// Account-management actions behind a session: link/unlink OAuth providers
// and set or change the password. Outcomes surface as query params on the
// settings page (same redirect-with-code pattern as the auth pages).

const SETTINGS = "/dashboard/settings"
const LINKABLE_PROVIDERS = ["google", "github"]

export async function linkProvider(formData: FormData) {
  const provider = String(formData.get("provider") ?? "")
  if (!LINKABLE_PROVIDERS.includes(provider)) redirect(SETTINGS)
  // Starting an OAuth flow while signed in makes the adapter link the new
  // account to the current user instead of creating a fresh one.
  await signIn(provider, { redirectTo: SETTINGS })
}

export async function unlinkProvider(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
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
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const parsed = passwordSchema.safeParse(String(formData.get("password") ?? ""))
  if (!parsed.success) redirect(`${SETTINGS}?error=policy`)

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
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
    where: { id: session.user.id },
    data: { passwordHash: await hashPassword(parsed.data) },
  })
  redirect(`${SETTINGS}?ok=password`)
}
