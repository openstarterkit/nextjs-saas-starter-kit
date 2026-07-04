"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function toggleUserRole(userId: string) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized")
  }

  // Read the current role from the DB — never trust a client-supplied role.
  // The client only renders a hint; the source of truth is the database.
  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  })
  if (!target) {
    throw new Error("User not found")
  }

  const newRole = target.role === "ADMIN" ? "USER" : "ADMIN"

  await prisma.user.update({
    where: { id: userId },
    data: { role: newRole },
  })

  revalidatePath("/admin")
  return { role: newRole }
}
