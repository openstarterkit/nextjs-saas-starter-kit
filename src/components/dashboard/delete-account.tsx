"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"

import { deleteAccount } from "@/app/actions/account"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

/**
 * Delete account, behind a typed confirmation.
 *
 * The address has to match before the button turns on. That is deliberate
 * friction: this is the one action in the product with no undo, and a dialog
 * whose primary button is armed on open is a dialog people dismiss by clicking
 * it. The server checks the same thing again, so a browser cannot skip it.
 *
 * AlertDialog rather than Dialog: it does not close on a click outside, which
 * on a form where you have just typed your own address is the difference
 * between a careless click and losing what you wrote.
 */
export function DeleteAccount({ email }: { email: string }) {
  const t = useTranslations("dashboard.settings.deleteAccount")
  const [typed, setTyped] = useState("")

  const matches = typed.trim().toLowerCase() === email.toLowerCase()

  return (
    <AlertDialog onOpenChange={() => setTyped("")}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm">
          {t("trigger")}
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("title")}</AlertDialogTitle>
          <AlertDialogDescription>{t("description")}</AlertDialogDescription>
        </AlertDialogHeader>

        <form action={deleteAccount} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="confirm">{t("confirmLabel", { email })}</Label>
            <Input
              id="confirm"
              name="confirm"
              autoComplete="off"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder={email}
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button type="button" variant="outline">
                {t("cancel")}
              </Button>
            </AlertDialogCancel>
            <Button type="submit" variant="destructive" disabled={!matches}>
              {t("confirm")}
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  )
}
