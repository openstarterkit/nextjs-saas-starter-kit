import Link from "next/link"
import { redirect } from "next/navigation"
import { requestPasswordReset } from "@/app/actions/auth"
import { LogoMark } from "@/components/logo"
import { PendingButton } from "@/components/auth/pending-button"
import { AuthNotice } from "@/components/auth/auth-notice"
import { Input } from "@/components/ui/input"
import { siteConfig } from "@/config/site"
import { isKitSite } from "@/config/kit"

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string }>
}) {
  const { sent } = await searchParams

  // On the public demo the page stays visible as a showcase, but the form is
  // disabled: no email service is attached there.
  const isDemo = process.env.DEMO_MODE === "true"
  if (!isDemo && siteConfig.links.demo) redirect(siteConfig.links.demo)

  // Without an email service the reset link can never arrive: say so
  // honestly instead of pretending to send.
  const hasEmailService = !!process.env.RESEND_API_KEY
  const formDisabled = isDemo || !hasEmailService

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-3xl border border-border bg-card/80 p-8 shadow-[var(--shadow-soft-lg)] backdrop-blur-xl">
        <div className="mb-8 text-center">
          <div className="mb-4 flex justify-center">
            <LogoMark className="h-12 w-12 rounded-2xl ring-1 ring-primary/15" iconClassName="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Reset your password</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Enter your email and we&apos;ll send you a reset link
          </p>
        </div>

        {isDemo && (
          <AuthNotice>
            This live demo has no email service attached, so password reset is disabled here.
            {isKitSite ? (
              <>
                {" "}
                In your own deployment, wire an email provider (the kit ships with{" "}
                <a
                  href="https://resend.com"
                  className="underline underline-offset-2"
                  target="_blank"
                  rel="noreferrer"
                >
                  Resend
                </a>
                ) and this flow goes live.
              </>
            ) : (
              " Everything else works as it would in production."
            )}
          </AuthNotice>
        )}
        {!isDemo && !hasEmailService && (
          <AuthNotice>
            Password reset needs an email service. Set <code>RESEND_API_KEY</code> to enable it (
            {isKitSite && "the kit ships with Resend, "}see <code>docs/configuration.md</code>).
          </AuthNotice>
        )}

        {sent === "1" && !formDisabled ? (
          <p className="rounded-lg border border-primary/30 bg-primary/10 px-4 py-3 text-center text-sm text-primary">
            If an account exists for that email, a reset link is on its way. It&apos;s valid for 30
            minutes.
          </p>
        ) : (
          <form action={requestPasswordReset} className="flex flex-col gap-3">
            <Input name="email" type="email" placeholder="you@example.com" autoComplete="email" required disabled={formDisabled} className="h-12 rounded-full px-4" />
            <PendingButton
              disabled={formDisabled}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground transition-all hover:-translate-y-0.5 hover:shadow-soft disabled:pointer-events-none disabled:opacity-45"
            >
              Send reset link
            </PendingButton>
          </form>
        )}

        <p className="mt-4 text-center text-xs text-muted-foreground">
          <Link href="/login" className="underline underline-offset-4 hover:text-foreground">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
