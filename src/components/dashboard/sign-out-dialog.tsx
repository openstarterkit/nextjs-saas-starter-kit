"use client"

import { useTranslations } from "next-intl"

import * as React from "react"
import { LogOut } from "lucide-react"
import { signOutAction } from "@/app/actions/auth"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"

/**
 * Branded sign-out confirmation — replaces the unstyled Auth.js page.
 * Pass a `trigger` for the uncontrolled case, or drive it with
 * `open`/`onOpenChange` (e.g. from a dropdown menu item).
 */
export function SignOutDialog({
  trigger,
  open,
  onOpenChange,
}: {
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  const t = useTranslations("dashboard.signOut")
  const [pending, startTransition] = React.useTransition()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <div className="mb-1">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
              <LogOut className="h-5 w-5" />
            </span>
          </div>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>
            You&apos;ll be signed out of your account and returned to the homepage.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={pending}>
              Cancel
            </Button>
          </DialogClose>
          <Button
            variant="destructive"
            onClick={() => startTransition(async () => signOutAction())}
            disabled={pending}
          >
            {pending ? t("pending") : t("confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
