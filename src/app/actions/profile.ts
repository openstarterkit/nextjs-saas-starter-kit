"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { getTranslations } from "next-intl/server"
import { z } from "zod"

export type ProfileState = { error?: string; success?: boolean }

// Per call, not per import: the messages are shown to the user and a
// translation only resolves inside a request.
async function profileSchema() {
  const t = await getTranslations("errors")
  return z.object({
    name: z.string().min(1, t("nameRequired")).max(50, t("nameTooLong")),
  })
}

export async function updateProfile(
  _prevState: ProfileState,
  formData: FormData
): Promise<ProfileState> {
  const t = await getTranslations("errors")
  const session = await auth()
  if (!session?.user) return { error: t("unauthorized") }

  const result = (await profileSchema()).safeParse({ name: formData.get("name") })
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
