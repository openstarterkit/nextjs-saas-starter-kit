"use client"

import { useActionState, useState } from "react"
import { useTranslations } from "next-intl"

import {
  startTwoFactorSetup,
  confirmTwoFactorSetup,
  regenerateBackupCodes,
  disableTwoFactor,
  type SetupState,
} from "@/app/actions/two-factor"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
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
 * Two-factor authentication, in three states: off, pairing, on.
 *
 * The pairing state exists only in this component's memory. That is not a
 * shortcut, it is the requirement: the backup codes are shown exactly once and
 * are never retrievable again, so they must not survive a redirect, sit in a
 * query string, or be fetched a second time. Leaving the page before writing
 * them down means generating a new set, which the card says out loud.
 *
 * Every call is a server action. No secret, no code and no password is handled
 * by anything in this file beyond being typed into a form.
 */
export function TwoFactorCard({
  enabled,
  hasPassword,
  isDemo,
}: {
  enabled: boolean
  hasPassword: boolean
  isDemo: boolean
}) {
  const t = useTranslations("dashboard.settings.twoFactor")
  const [setupState, setupAction, setupPending] = useActionState<SetupState, FormData>(
    startTwoFactorSetup,
    {}
  )
  const [confirmState, confirmAction, confirmPending] = useActionState<SetupState, FormData>(
    confirmTwoFactorSetup,
    {}
  )
  const [codesState, codesAction, codesPending] = useActionState<SetupState, FormData>(
    regenerateBackupCodes,
    {}
  )

  const error = setupState.error ?? confirmState.error ?? codesState.error
  const codes = setupState.setup?.backupCodes ?? codesState.backupCodes

  if (isDemo) {
    return <p className="text-sm text-muted-foreground">{t("demo")}</p>
  }

  if (!enabled && !hasPassword) {
    return <p className="text-sm text-muted-foreground">{t("needsPassword")}</p>
  }

  return (
    <div className="space-y-4 text-sm">
      {error && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-destructive">
          {t(`errors.${error}`)}
        </p>
      )}

      {/* ── On ─────────────────────────────────────────────────────────── */}
      {enabled && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="font-medium">{t("status")}</span>
            <Badge variant="secondary">{t("on")}</Badge>
          </div>

          {codes && <BackupCodes codes={codes} />}

          <div className="flex flex-wrap gap-2">
            <form action={codesAction} className="space-y-2">
              {/* The button alone reads like an option. The line above it is
                  what makes it a remedy, for the two people who need it: one
                  who has just spent a code, one who cannot find the list. */}
              <p className="text-xs text-muted-foreground">{t("regenerateHint")}</p>
              {/* Labelled rather than left to the placeholder: a placeholder is
                  gone the moment you type, and it is not a label to a screen
                  reader at all. */}
              <Label htmlFor="regenerate-password">{t("passwordLabel")}</Label>
              <p className="max-w-prose text-xs text-muted-foreground">{t("passwordWhyShort")}</p>
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  id="regenerate-password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  className="h-9 w-full sm:w-56"
                  required
                />
                <Button type="submit" variant="outline" size="sm" disabled={codesPending}>
                  {t("regenerate")}
                </Button>
              </div>
            </form>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm">
                  {t("turnOff")}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t("turnOffTitle")}</AlertDialogTitle>
                  <AlertDialogDescription>{t("turnOffDescription")}</AlertDialogDescription>
                </AlertDialogHeader>
                <form action={disableTwoFactor} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="disable-password">{t("passwordLabel")}</Label>
                    <p className="text-xs text-muted-foreground">{t("passwordWhyShort")}</p>
                    <Input
                      id="disable-password"
                      name="password"
                      type="password"
                      autoComplete="current-password"
                      required
                    />
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogCancel asChild>
                      <Button type="button" variant="outline">
                        {t("cancel")}
                      </Button>
                    </AlertDialogCancel>
                    <Button type="submit" variant="destructive">
                      {t("turnOff")}
                    </Button>
                  </AlertDialogFooter>
                </form>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      )}

      {/* ── Pairing ────────────────────────────────────────────────────── */}
      {!enabled && setupState.setup && (
        <div className="space-y-4">
          <p className="text-muted-foreground">{t("scan")}</p>
          {/* Named apps, not "an authenticator app". Somebody who has never set
              one up cannot act on a category noun, and this is the screen where
              they find that out. */}
          <p className="text-xs text-muted-foreground">{t("apps")}</p>

          {/* White plate on purpose: a QR has to stay dark-on-light to be
              readable, in either theme. The markup is generated by our own
              server from the pairing URI, not by anything the user typed. */}
          <div
            className="inline-block rounded-xl bg-white p-3 [&_svg]:h-44 [&_svg]:w-44"
            dangerouslySetInnerHTML={{ __html: setupState.setup.qrSvg }}
          />

          <div>
            <p className="text-xs text-muted-foreground">{t("manualEntry")}</p>
            <code className="mt-1 inline-block break-all rounded-md bg-muted px-2 py-1 font-mono text-xs">
              {setupState.setup.secret}
            </code>
            {/* Base32 has no 0, 1, 8 or 9 in it, so the ambiguity people expect
                when copying a long key simply is not there. Saying so is faster
                than letting them squint at it. */}
            <p className="mt-1 max-w-prose text-xs text-muted-foreground">{t("keyShape")}</p>
          </div>

          {codes && <BackupCodes codes={codes} />}

          <form action={confirmAction} className="flex flex-wrap items-end gap-2">
            <div className="space-y-1.5">
              <Label htmlFor="totp-code">{t("codeLabel")}</Label>
              <Input
                id="totp-code"
                name="code"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="123456"
                className="h-9 w-40 font-mono tracking-widest"
                required
              />
            </div>
            <Button type="submit" size="sm" disabled={confirmPending}>
              {t("confirm")}
            </Button>
          </form>
        </div>
      )}

      {/* ── Off ────────────────────────────────────────────────────────── */}
      {!enabled && !setupState.setup && (
        <form action={setupAction} className="space-y-3">
          <p className="text-muted-foreground">{t("blurb")}</p>
          <p className="text-xs text-muted-foreground">{t("apps")}</p>
          <div className="space-y-1.5">
            <Label htmlFor="enable-password">{t("passwordLabel")}</Label>
            {/* A password field that appears without saying which password, or
                why, is the exact thing people are told not to fill in. In a
                security flow the explanation is part of the control. */}
            <p className="max-w-prose text-xs text-muted-foreground">{t("passwordWhy")}</p>
            <div className="flex flex-wrap items-end gap-2">
              <Input
                id="enable-password"
                name="password"
                type="password"
                autoComplete="current-password"
                className="h-9 w-full sm:w-56"
                required
              />
              <Button type="submit" size="sm" disabled={setupPending}>
                {t("turnOn")}
              </Button>
            </div>
          </div>
        </form>
      )}
    </div>
  )
}

/**
 * The codes, with the warning above them rather than below: by the time you
 * read a note under a list you have already scrolled past the list.
 */
function BackupCodes({ codes }: { codes: string[] }) {
  const t = useTranslations("dashboard.settings.twoFactor")
  const [copied, setCopied] = useState(false)

  const text = codes.join("\n")

  async function copy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard permission can be refused; the codes are on screen anyway.
    }
  }

  function download() {
    const url = URL.createObjectURL(new Blob([text], { type: "text/plain" }))
    const a = document.createElement("a")
    a.href = url
    a.download = "backup-codes.txt"
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
      <p className="text-sm font-medium text-foreground">{t("codesTitle")}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{t("codesWarning")}</p>
      <p className="mt-1 text-xs text-muted-foreground">{t("codesStore")}</p>
      <p className="mt-1 text-xs text-muted-foreground">{t("codesShape")}</p>
      {/* Why there are ten, and that they are spent one at a time. Without this
          the natural move is to copy all ten and paste all ten, which the
          sign-in screen then rejects as "wrong code" — true, and useless. */}
      <p className="mt-1 max-w-prose text-xs text-muted-foreground">{t("codesHowToUse")}</p>
      <ul className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1 font-mono text-sm sm:grid-cols-3">
        {codes.map((code) => (
          <li key={code}>{code}</li>
        ))}
      </ul>
      <div className="mt-3 flex gap-2">
        <Button type="button" variant="outline" size="sm" onClick={copy}>
          {copied ? t("copied") : t("copy")}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={download}>
          {t("download")}
        </Button>
      </div>
    </div>
  )
}
