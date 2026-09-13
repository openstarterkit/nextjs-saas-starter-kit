import Link from "next/link"
import { getTranslations } from "next-intl/server"

import { verifyTwoFactorCode, verifyTwoFactorBackupCode } from "@/app/actions/auth"
import { LogoMark } from "@/components/logo"
import { PendingButton } from "@/components/auth/pending-button"
import { Input } from "@/components/ui/input"

/**
 * The second factor, between the password and the session.
 *
 * There is nothing to guard here and nothing to look up: the challenge lives in
 * a short-lived cookie the sign-in step set, and a visitor who arrives without
 * one simply cannot pass. That is why this page reads no session and answers
 * the same way to everyone — it holds no secret to leak.
 *
 * Two modes, one page. `?mode=backup` swaps the authenticator code for a backup
 * code, because someone reaching for those has usually lost the phone and does
 * not need a second page to find on top of it.
 */
export default async function TwoFactorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; mode?: string }>
}) {
  const { error, mode } = await searchParams
  const t = await getTranslations("auth.twoFactor")
  const backup = mode === "backup"

  const errorMessage = error
    ? t.has(`errors.${error}`)
      ? t(`errors.${error}`)
      : t("errors.generic")
    : null

  return (
    <div className="rounded-3xl border border-border bg-card/80 p-8 shadow-[var(--shadow-soft-lg)] backdrop-blur-xl">
      <div className="mb-8 text-center">
        <div className="mb-4 flex justify-center">
          <LogoMark className="h-12 w-12 rounded-2xl ring-1 ring-primary/15" iconClassName="h-7 w-7" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {backup ? t("backupTitle") : t("title")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {backup ? t("backupSubtitle") : t("subtitle")}
        </p>
      </div>

      {errorMessage && (
        <p className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-center text-sm text-destructive">
          {errorMessage}
        </p>
      )}

      <form
        action={backup ? verifyTwoFactorBackupCode : verifyTwoFactorCode}
        className="flex flex-col gap-3"
      >
        <label htmlFor="code" className="sr-only">
          {backup ? t("backupLabel") : t("codeLabel")}
        </label>
        <Input
          id="code"
          name="code"
          // A one-time-code field on mobile offers the code from the keyboard
          // suggestion bar, which is the difference between typing six digits
          // and copying them across two apps.
          autoComplete="one-time-code"
          inputMode={backup ? "text" : "numeric"}
          autoFocus
          required
          // The shape of one code, so that "enter one, not the list" is visible
          // before it has to be said in an error message.
          placeholder={backup ? "ABCDE-FGHJK" : "123456"}
          className={`h-12 rounded-full px-4 ${backup ? "" : "text-center font-mono text-lg tracking-[0.4em]"}`}
        />
        <PendingButton className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground transition-all hover:-translate-y-0.5 hover:shadow-soft disabled:pointer-events-none disabled:opacity-80">
          {t("submit")}
        </PendingButton>
      </form>

      {/* Said here, and only here, because this is where the person who needs
          it has arrived: they clicked through to backup codes, which means the
          phone is already gone. The answer is unwelcome — there is no
          self-service reset — and a screen that stays silent about it leaves
          someone trying combinations at midnight instead of asking for help. */}
      {backup && (
        <p className="mt-4 rounded-lg border border-border bg-muted/50 px-4 py-3 text-xs text-muted-foreground">
          {t("backupLost")}
        </p>
      )}

      <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
        <Link
          href={backup ? "/2fa" : "/2fa?mode=backup"}
          className="underline underline-offset-4 hover:text-foreground"
        >
          {backup ? t("useApp") : t("useBackup")}
        </Link>
        <Link href="/login" className="underline underline-offset-4 hover:text-foreground">
          {t("backToLogin")}
        </Link>
      </div>
    </div>
  )
}
