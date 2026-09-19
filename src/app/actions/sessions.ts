"use server"

import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

/**
 * Ending sessions from Settings.
 *
 * The form sends the session's **id**, never its token. That distinction is the
 * reason this file exists rather than calling the library straight from the
 * component: `revokeSession` identifies a session by token, and a token is the
 * session — anything holding it can act as that user. Putting the tokens of
 * every one of your devices into the HTML of a page would turn a list meant to
 * reassure you into the most valuable thing on the screen.
 *
 * So the id travels, the server looks up the token, and the lookup is scoped to
 * the caller's own rows: `where: { id, userId }` cannot reach somebody else's
 * session even if the id is guessed or tampered with.
 *
 * Ending a session does not ask for a recent sign-in: the library guards these
 * three endpoints by reading the session from the database rather than from the
 * cookie cache, which is the check that matters here. Listing them was the one
 * call that wanted a fresh session, and it is not made any more
 * (src/components/settings/active-sessions.tsx).
 */

const SETTINGS = "/dashboard/settings"

export async function revokeSession(formData: FormData) {
  const currentUser = await getCurrentUser()
  if (!currentUser) redirect("/login")

  const id = String(formData.get("sessionId") ?? "")
  if (!id) redirect(`${SETTINGS}?error=session`)

  // Ownership is enforced by the query, not by a check after the fact.
  const session = await prisma.session.findFirst({
    where: { id, userId: currentUser.id },
    select: { token: true },
  })
  if (!session) redirect(`${SETTINGS}?error=session`)

  await auth.api.revokeSession({ body: { token: session.token }, headers: await headers() })
  redirect(`${SETTINGS}?ok=session-revoked`)
}

/**
 * Everything except the one you are using. This is the button for the moment
 * somebody suspects a device is not theirs any more, so it does not ask which:
 * it ends all of them and leaves the person who pressed it signed in.
 */
export async function revokeOtherSessions() {
  const currentUser = await getCurrentUser()
  if (!currentUser) redirect("/login")

  await auth.api.revokeOtherSessions({ headers: await headers() })
  redirect(`${SETTINGS}?ok=sessions-revoked`)
}
