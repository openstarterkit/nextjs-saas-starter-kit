import { headers } from "next/headers"
import { redirect } from "next/navigation"
import type { Role } from "@prisma/client"

import { auth } from "@/auth"

/**
 * The boundary between this application and whatever library handles
 * authentication.
 *
 * Everything outside `src/auth.ts`, the sign-in flow and the route handler asks
 * these functions rather than the library directly. The point is the release
 * after this one: 2.0 moves authentication to a different library, and a
 * codebase that reads the session in twenty pages has twenty places to change,
 * each with its own chance of being missed. With the boundary in place that
 * migration edits this file.
 *
 * It exists now, working on the current library, so the version that adopts the
 * new one changes as little as possible and the guide for it can be written and
 * tested before anyone needs it.
 *
 * The shape returned here is deliberately small: id, email, name, image, role.
 * Anything a specific library adds on top stays behind this line, or it becomes
 * a dependency that has to be reproduced later.
 */
export type CurrentUser = {
  id: string
  role: Role
  email?: string | null
  name?: string | null
  image?: string | null
}

/** The signed-in user, or null. Never throws and never redirects. */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user?.id) return null

  const { id, role, email, name, image } = session.user
  return { id, role: (role ?? "USER") as Role, email, name, image }
}

/**
 * The signed-in user, or a redirect to the sign-in page.
 *
 * For a page or an action that has no meaning without an account: reading the
 * session and redirecting on a miss was repeated at the top of nearly every one
 * of them, and repeated code is where a check eventually goes missing.
 */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser()
  if (!user) redirect("/login")
  return user
}

/** True when someone is signed in. For a branch that needs nothing else. */
export async function isSignedIn(): Promise<boolean> {
  return (await getCurrentUser()) !== null
}
