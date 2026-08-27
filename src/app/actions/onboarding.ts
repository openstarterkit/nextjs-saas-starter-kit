"use server"

import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function dismissOnboarding() {
  const user = await getCurrentUser()
  if (!user) return

  await prisma.user.update({
    where: { id: user.id },
    data: { onboardingDismissedAt: new Date() },
  })

  revalidatePath("/dashboard")
}
