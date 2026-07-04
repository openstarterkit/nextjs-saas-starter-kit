"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"

export type ProfileState = { error?: string; success?: boolean }

const profileSchema = z.object({
  name: z.string().min(1, "Name is required").max(50, "Name too long"),
})

export async function updateProfile(
  _prevState: ProfileState,
  formData: FormData
): Promise<ProfileState> {
  const session = await auth()
  if (!session?.user) return { error: "Unauthorized" }

  const result = profileSchema.safeParse({ name: formData.get("name") })
  if (!result.success) {
    return { error: result.error.issues[0].message }
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { name: result.data.name },
  })

  revalidatePath("/dashboard")
  revalidatePath("/dashboard/settings")
  return { success: true }
}
