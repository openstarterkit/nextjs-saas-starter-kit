import Link from "next/link"
import { redirect } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { registerUser } from "@/app/actions/auth"
import { LogoMark } from "@/components/logo"
import { PendingButton } from "@/components/auth/pending-button"
import { AuthNotice } from "@/components/auth/auth-notice"
import { Input } from "@/components/ui/input"
import { siteConfig } from "@/config/site"

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams
  const t = await getTranslations("auth.signup")
  // An unknown code must not throw: the query string is user controlled, so a
  // key that does not exist falls back to the generic message.
  const errorMessage = error ? (t.has(`errors.${error}`) ? t(`errors.${error}`) : t("errors.generic")) : null

  // On the public demo the page stays visible as a showcase, but the form is
  // disabled: the demo has no email service attached and runs on shared
  // fixture accounts.
  const isDemo = process.env.DEMO_MODE === "true"
  // Marketing deployments delegate auth to the demo deployment.
  if (!isDemo && siteConfig.links.demo) redirect(siteConfig.links.demo)

  const hasEmailService = !!process.env.RESEND_API_KEY

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-3xl border border-border bg-card/80 p-8 shadow-[var(--shadow-soft-lg)] backdrop-blur-xl">
        <div className="mb-8 text-center">
          <div className="mb-4 flex justify-center">
            <LogoMark className="h-12 w-12 rounded-2xl ring-1 ring-primary/15" iconClassName="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{t("title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {hasEmailService ? t("subtitleVerified") : t("subtitlePassword")}
          </p>
        </div>

        {isDemo && (
          <AuthNotice>
            {t("demoNotice")}{" "}
            {t.rich("demoNoticeExtra", {
              resend: (chunks) => (
                <a
                  href="https://resend.com"
                  className="underline underline-offset-2"
                  target="_blank"
                  rel="noreferrer"
                >
                  {chunks}
                </a>
              ),
            })}
          </AuthNotice>
        )}
        {!isDemo && !hasEmailService && (
          <AuthNotice>
            {t.rich("noEmailService", {
              code: (chunks) => <code>{chunks}</code>,
            })}
          </AuthNotice>
        )}

        {errorMessage && (
          <p className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-center text-sm text-destructive">
            {errorMessage}
          </p>
        )}

        <form action={registerUser} className="flex flex-col gap-3">
          <Input name="name" type="text" placeholder={t("namePlaceholder")} autoComplete="name" maxLength={100} disabled={isDemo} className="h-12 rounded-full px-4" />
          <Input name="email" type="email" placeholder={t("emailPlaceholder")} autoComplete="email" required disabled={isDemo} className="h-12 rounded-full px-4" />
          <Input
            name="password"
            type="password"
            placeholder={t("passwordPlaceholder")}
            autoComplete="new-password"
            required
            minLength={8}
            maxLength={72}
            disabled={isDemo}
            className="h-12 rounded-full px-4"
          />
          <PendingButton
            disabled={isDemo}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground transition-all hover:-translate-y-0.5 hover:shadow-soft disabled:pointer-events-none disabled:opacity-45"
          >
            {t("submit")}
          </PendingButton>
        </form>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          {t.rich("haveAccount", {
            signin: (chunks) => (
              <Link href="/login" className="underline underline-offset-4 hover:text-foreground">
                {chunks}
              </Link>
            ),
          })}
        </p>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          {t.rich("legal", {
            terms: (chunks) => (
              <Link href="/terms" className="underline underline-offset-4 hover:text-foreground">{chunks}</Link>
            ),
            privacy: (chunks) => (
              <Link href="/privacy" className="underline underline-offset-4 hover:text-foreground">{chunks}</Link>
            ),
          })}
        </p>
      </div>
    </div>
  )
}
