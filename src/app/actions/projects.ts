"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { z } from "zod"

export type ProjectState = { error?: string; success?: boolean }

/**
 * Built per call rather than once at import time, because the messages it
 * carries end up in front of the user (`toast.error(state.error)`), and a
 * translation can only be resolved inside a request.
 */
async function projectSchema() {
  const t = await getTranslations("errors")
  return z.object({
    name: z.string().min(1, t("nameRequired")).max(60, t("nameTooLong")),
    description: z.string().max(280, t("descriptionTooLong")).optional(),
  })
}

export async function createProject(
  _prevState: ProjectState,
  formData: FormData
): Promise<ProjectState> {
  const t = await getTranslations("errors")
  const session = await auth()
  if (!session?.user) return { error: t("unauthorized") }

  const result = (await projectSchema()).safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
  })
  if (!result.success) {
    return { error: result.error.issues[0].message }
  }

  await prisma.project.create({
    data: {
      name: result.data.name,
      description: result.data.description ?? null,
      userId: session.user.id,
    },
  })

  revalidatePath("/dashboard/projects")
  revalidatePath("/dashboard")
  return { success: true }
}

export async function updateProject(
  _prevState: ProjectState,
  formData: FormData
): Promise<ProjectState> {
  const t = await getTranslations("errors")
  const session = await auth()
  if (!session?.user) return { error: t("unauthorized") }

  const id = String(formData.get("id") ?? "")
  const result = (await projectSchema()).safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
  })
  if (!result.success) {
    return { error: result.error.issues[0].message }
  }

  // Ownership check — never trust the client-supplied id.
  const existing = await prisma.project.findUnique({ where: { id } })
  if (!existing || existing.userId !== session.user.id) {
    return { error: t("projectNotFound") }
  }

  await prisma.project.update({
    where: { id },
    data: {
      name: result.data.name,
      description: result.data.description ?? null,
    },
  })

  revalidatePath("/dashboard/projects")
  revalidatePath(`/dashboard/projects/${id}`)
  return { success: true }
}

export async function deleteProject(formData: FormData): Promise<void> {
  const session = await auth()
  if (!session?.user) return

  const id = String(formData.get("id") ?? "")

  // Ownership check — only delete a project that belongs to the current user.
  const existing = await prisma.project.findUnique({ where: { id } })
  if (!existing || existing.userId !== session.user.id) return

  await prisma.project.delete({ where: { id } })

  revalidatePath("/dashboard/projects")
  revalidatePath("/dashboard")
  redirect("/dashboard/projects")
}
