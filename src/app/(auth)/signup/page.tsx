import Link from "next/link"
import { redirect } from "next/navigation"
import { registerUser } from "@/app/actions/auth"
import { LogoMark } from "@/components/logo"
import { PendingButton } from "@/components/auth/pending-button"
import { AuthNotice } from "@/components/auth/auth-notice"
import { Input } from "@/components/ui/input"
import { siteConfig } from "@/config/site"

const ERROR_MESSAGES: Record<string, string> = {
  invalid: "Check your details: valid email and a password of at least 8 characters.",
  exists: "An account with this email already exists. Sign in instead.",
  rate: "Too many attempts. Try again in a few minutes.",
}

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams
  const errorMessage = error ? (ERROR_MESSAGES[error] ?? "Something went wrong. Try again.") : null

  // On the public demo the page stays visible as a showcase, but the form is
  // disabled: the demo has no email service attached and runs on shared
  // fixture accounts.
  const isDemo = process.env.DEMO_MODE === "true"
  // Marketing deployments delegate auth to the demo deployment.
  if (!isDemo && siteConfig.links.demo) redirect(siteConfig.links.demo)

  const hasEmailService = !!process.env.RESEND_API_KEY

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-3xl border border-border bg-background/80 p-8 shadow-[var(--shadow-soft-lg)] backdrop-blur-xl">
        <div className="mb-8 text-center">
          <div className="mb-4 flex justify-center">
            <LogoMark className="h-12 w-12 rounded-2xl ring-1 ring-primary/15" iconClassName="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Create your account</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {hasEmailService
              ? "We'll email you a link to verify your address and sign you in"
              : "Sign up with your email and a password"}
          </p>
        </div>

        {isDemo && (
          <AuthNotice>
            This live demo has no email service attached, so sign-up is disabled here. In your own
            deployment, wire an email provider (the kit ships with{" "}
            <a href="https://resend.com" className="underline underline-offset-2" target="_blank" rel="noreferrer">
              Resend
            </a>
            ) and this flow goes live.
          </AuthNotice>
        )}
        {!isDemo && !hasEmailService && (
          <AuthNotice>
            No email service is configured, so accounts are created without email verification. Set{" "}
            <code>RESEND_API_KEY</code> to enable it (the kit ships with Resend, see{" "}
            <code>docs/configuration.md</code>).
          </AuthNotice>
        )}

        {errorMessage && (
          <p className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-center text-sm text-destructive">
            {errorMessage}
          </p>
        )}

        <form action={registerUser} className="flex flex-col gap-3">
          <Input name="name" type="text" placeholder="Name (optional)" autoComplete="name" maxLength={100} disabled={isDemo} className="h-12 rounded-full px-4" />
          <Input name="email" type="email" placeholder="you@example.com" autoComplete="email" required disabled={isDemo} className="h-12 rounded-full px-4" />
          <Input
            name="password"
            type="password"
            placeholder="Password (min 8 characters)"
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
            Create account
          </PendingButton>
        </form>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="underline underline-offset-4 hover:text-foreground">
            Sign in
          </Link>
        </p>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          By signing up, you agree to our{" "}
          <a href="/terms" className="underline underline-offset-4 hover:text-foreground">Terms</a>
          {" "}and{" "}
          <a href="/privacy" className="underline underline-offset-4 hover:text-foreground">Privacy Policy</a>.
        </p>
      </div>
    </div>
  )
}
