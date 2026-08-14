"use client"

import { useTranslations } from "next-intl"

import { useActionState, useEffect, useRef } from "react"
import { createProject, type ProjectState } from "@/app/actions/projects"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/sonner"

export function CreateProjectForm() {
  const t = useTranslations("dashboard.createProject")
  const [state, action, isPending] = useActionState<ProjectState, FormData>(createProject, {})
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state.success) {
      toast.success(t("created"))
      formRef.current?.reset()
    } else if (state.error) {
      toast.error(state.error)
    }
  }, [state, t])

  return (
    <form ref={formRef} action={action} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="name">{t("name")}</Label>
        <Input
          id="name"
          name="name"
          placeholder="My new project"
          error={state.error}
          maxLength={60}
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">{t("description")}</Label>
        <textarea
          id="description"
          name="description"
          placeholder={t("descriptionPlaceholder")}
          maxLength={280}
          rows={3}
          className="flex w-full rounded-[var(--radius)] border border-border bg-secondary px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>

      <Button type="submit" loading={isPending} className="w-full sm:w-auto">
        Create project
      </Button>
    </form>
  )
}
