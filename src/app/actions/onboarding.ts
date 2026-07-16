"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function dismissOnboarding() {
  const session = await auth()
  if (!session?.user) return

  await prisma.user.update({
    where: { id: session.user.id },
    data: { onboardingDismissedAt: new Date() },
  })

  revalidatePath("/dashboard")
}
