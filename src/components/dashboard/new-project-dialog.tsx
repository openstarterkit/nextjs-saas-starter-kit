"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Plus } from "lucide-react"

import { CreateProjectForm } from "@/components/dashboard/create-project-form"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

/**
 * "New project" button and the dialog it opens.
 *
 * Creating a project is not a place you can be linked to, so this is a plain
 * dialog rather than an intercepting route: no URL to keep, nothing to come
 * back to. The settings modal earns its route because account actions redirect
 * to that address and the OAuth round trip leaves the app entirely.
 *
 * The dialog closes on success, driven by the form rather than by the click:
 * the row appears in the grid behind it because the server action revalidates
 * the list.
 */
export function NewProjectDialog() {
  const t = useTranslations("dashboard.projects")
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="w-full sm:w-auto">
          <Plus className="h-4 w-4" />
          {t("newTitle")}
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("newTitle")}</DialogTitle>
          <DialogDescription>{t("newDescription")}</DialogDescription>
        </DialogHeader>
        <CreateProjectForm onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}
