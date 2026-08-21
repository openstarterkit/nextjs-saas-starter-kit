"use server"

import type { Role } from "@prisma/client"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

/**
 * Sets a user's role to an explicit value.
 *
 * `seenRole` is the role the admin was looking at when they clicked. The write
 * only lands if the row still holds it, which is what stops a stale page from
 * undoing someone else's change: this used to flip whatever it found, so a
 * second admin clicking "Make Admin" on an already promoted user demoted them
 * instead, and said "promoted" while doing it.
 *
 * The role a session carries is re-read from the database at most a minute
 * after this returns (see the jwt callback in src/auth.ts), so the change
 * reaches the other person without them signing out.
 */
export async function setUserRole(userId: string, nextRole: Role, seenRole: Role) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized")
  }
  if (nextRole === seenRole) {
    throw new Error("Role is already set to that value")
  }

  // updateMany, not update: `where` has to carry the expected role, and that
  // is not a unique constraint. A count of zero means the row moved under us.
  const { count } = await prisma.user.updateMany({
    where: { id: userId, role: seenRole },
    data: { role: nextRole },
  })
  if (count === 0) {
    throw new Error("This user's role changed since the page was loaded")
  }

  revalidatePath("/admin")
  return { role: nextRole }
}
