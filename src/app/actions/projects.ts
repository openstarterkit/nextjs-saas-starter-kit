"use server"

import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { projectSchema } from "@/lib/schemas/project"

export type ProjectState = { error?: string; success?: boolean }

/**
 * Built per call rather than once at import time, because the messages it
 * carries end up in front of the user (`toast.error(state.error)`), and a
 * translation can only be resolved inside a request.
 *
 * The shape itself lives in src/lib/schemas/project.ts so the form in the
 * browser validates against the same rules instead of a second copy.
 */
async function schema() {
  const t = await getTranslations("errors")
  return projectSchema({
    nameRequired: t("nameRequired"),
    nameTooLong: t("nameTooLong"),
    descriptionTooLong: t("descriptionTooLong"),
  })
}

export async function createProject(
  _prevState: ProjectState,
  formData: FormData
): Promise<ProjectState> {
  const t = await getTranslations("errors")
  const user = await getCurrentUser()
  if (!user) return { error: t("unauthorized") }

  const result = (await schema()).safeParse({
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
      userId: user.id,
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
  const user = await getCurrentUser()
  if (!user) return { error: t("unauthorized") }

  const id = String(formData.get("id") ?? "")
  const result = (await schema()).safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
  })
  if (!result.success) {
    return { error: result.error.issues[0].message }
  }

  // Ownership check — never trust the client-supplied id.
  const existing = await prisma.project.findUnique({ where: { id } })
  if (!existing || existing.userId !== user.id) {
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
  const user = await getCurrentUser()
  if (!user) return

  const id = String(formData.get("id") ?? "")

  // Ownership check — only delete a project that belongs to the current user.
  const existing = await prisma.project.findUnique({ where: { id } })
  if (!existing || existing.userId !== user.id) return

  await prisma.project.delete({ where: { id } })

  revalidatePath("/dashboard/projects")
  revalidatePath("/dashboard")
  redirect("/dashboard/projects")
}
