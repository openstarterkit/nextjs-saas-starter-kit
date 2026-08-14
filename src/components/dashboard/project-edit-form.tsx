"use client"

import { useTranslations } from "next-intl"

import { useActionState, useEffect } from "react"
import { updateProject, type ProjectState } from "@/app/actions/projects"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/sonner"

interface ProjectEditFormProps {
  id: string
  name: string
  description: string | null
}

export function ProjectEditForm({ id, name, description }: ProjectEditFormProps) {
  const t = useTranslations("dashboard.projectEdit")
  const [state, action, isPending] = useActionState<ProjectState, FormData>(updateProject, {})

  useEffect(() => {
    if (state.success) toast.success(t("updated"))
    else if (state.error) toast.error(state.error)
  }, [state, t])

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="id" value={id} />

      <div className="space-y-1.5">
        <Label htmlFor="name">{t("name")}</Label>
        <Input
          id="name"
          name="name"
          defaultValue={name}
          placeholder={t("name")}
          error={state.error}
          maxLength={60}
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Description</Label>
        <textarea
          id="description"
          name="description"
          defaultValue={description ?? ""}
          placeholder={t("descriptionPlaceholder")}
          maxLength={280}
          rows={3}
          className="flex w-full rounded-[var(--radius)] border border-border bg-secondary px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>

      <Button type="submit" loading={isPending} className="w-full sm:w-auto">
        Save changes
      </Button>
    </form>
  )
}
