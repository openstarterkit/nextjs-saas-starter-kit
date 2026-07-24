import Link from "next/link"
import { redirect } from "next/navigation"
import { signIn } from "@/auth"
import { signInWithPassword, signInWithMagicLink } from "@/app/actions/auth"
import { LogoMark } from "@/components/logo"
import { PendingButton } from "@/components/auth/pending-button"
import { Input } from "@/components/ui/input"
import { siteConfig } from "@/config/site"

// Human copy for every error code this page can land with: our own action
// redirects (credentials, email, rate) plus the Auth.js built-ins (e.g.
// Verification for an expired magic link).
const ERROR_MESSAGES: Record<string, string> = {
  credentials: "Invalid email or password.",
  email: "Enter a valid email address.",
  rate: "Too many attempts. Try again in a few minutes.",
  Verification: "That sign-in link is invalid or has expired. Request a new one.",
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; reset?: string }>
}) {
  const { error, reset } = await searchParams
  const errorMessage = error
    ? (ERROR_MESSAGES[error] ?? "Something went wrong. Try again.")
    : null

  // Demo deployments disable real OAuth (no personal data collected) and
  // offer one-click sign-in to shared fixture accounts instead.
  const isDemo = process.env.DEMO_MODE === "true"
  // Magic link needs Resend configured; without it the kit still offers
  // OAuth and email+password.
  const hasMagicLink = !!process.env.RESEND_API_KEY

  // Marketing deployments delegate sign-in to the demo deployment
  // (same place the navbar and footer already point).
  if (!isDemo && siteConfig.links.demo) redirect(siteConfig.links.demo)

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-3xl border border-border bg-card/80 p-8 shadow-[var(--shadow-soft-lg)] backdrop-blur-xl">
        <div className="mb-8 text-center">
          <div className="mb-4 flex justify-center">
            <LogoMark className="h-12 w-12 rounded-2xl ring-1 ring-primary/15" iconClassName="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Welcome back</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isDemo ? "This is a live demo - jump straight in" : "Sign in to your account to continue"}
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <form
            action={async () => {
              "use server"
              await signIn("google", { redirectTo: "/dashboard" })
            }}
          >
            <PendingButton
              disabled={isDemo}
              className="flex h-12 w-full items-center justify-center gap-3 rounded-full border border-border bg-background px-4 text-sm font-semibold text-foreground transition-all hover:-translate-y-0.5 hover:bg-secondary hover:shadow-soft disabled:pointer-events-none disabled:opacity-45"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z"/>
                <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"/>
                <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z"/>
                <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z"/>
              </svg>
              Continue with Google
            </PendingButton>
          </form>

          <form
            action={async () => {
              "use server"
              await signIn("github", { redirectTo: "/dashboard" })
            }}
          >
            <PendingButton
              disabled={isDemo}
              className="flex h-12 w-full items-center justify-center gap-3 rounded-full border border-border bg-background px-4 text-sm font-semibold text-foreground transition-all hover:-translate-y-0.5 hover:bg-secondary hover:shadow-soft disabled:pointer-events-none disabled:opacity-45"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
              </svg>
              Continue with GitHub
            </PendingButton>
          </form>

          {isDemo && (
            <p className="text-center text-xs text-muted-foreground">
              OAuth sign-in is enabled in your own deployment - this demo uses shared accounts.
              <br />
              Curious about the email flows?{" "}
              <Link href="/signup" className="underline underline-offset-4 hover:text-foreground">
                Preview sign-up
              </Link>{" "}
              and{" "}
              <Link href="/forgot-password" className="underline underline-offset-4 hover:text-foreground">
                password reset
              </Link>
              .
            </p>
          )}
        </div>

        {!isDemo && (
          <>
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-card px-2 text-xs text-muted-foreground">or continue with email</span>
              </div>
            </div>

            {errorMessage && (
              <p className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-center text-sm text-destructive">
                {errorMessage}
              </p>
            )}
            {reset === "1" && (
              <p className="mb-4 rounded-lg border border-primary/30 bg-primary/10 px-4 py-2.5 text-center text-sm text-primary">
                Password updated. Sign in with your new password.
              </p>
            )}

            <form action={signInWithPassword} className="flex flex-col gap-3">
              <Input name="email" type="email" placeholder="you@example.com" autoComplete="email" required className="h-12 rounded-full px-4" />
              <Input name="password" type="password" placeholder="Password" autoComplete="current-password" required className="h-12 rounded-full px-4" />
              <PendingButton className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground transition-all hover:-translate-y-0.5 hover:shadow-soft disabled:pointer-events-none disabled:opacity-80">
                Sign in
              </PendingButton>
              {hasMagicLink && (
                // Same email field, different submit: sends a one-time sign-in
                // link instead of checking the password. formNoValidate because
                // the password field is irrelevant for this path.
                <PendingButton
                  formAction={signInWithMagicLink}
                  formNoValidate
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-full border border-border px-4 text-sm font-semibold text-foreground transition-all hover:-translate-y-0.5 hover:bg-secondary hover:shadow-soft disabled:pointer-events-none disabled:opacity-80"
                >
                  ✉️ Email me a sign-in link
                </PendingButton>
              )}
            </form>

            <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
              <Link href="/forgot-password" className="underline underline-offset-4 hover:text-foreground">
                Forgot password?
              </Link>
              <Link href="/signup" className="underline underline-offset-4 hover:text-foreground">
                No account? Sign up
              </Link>
            </div>
          </>
        )}

        {isDemo && (
          <>
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-card px-2 text-xs text-muted-foreground">try the demo</span>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <form
                action={async (formData: FormData) => {
                  "use server"
                  await signIn("demo", formData, { redirectTo: "/dashboard" })
                }}
              >
                <input type="hidden" name="role" value="user" />
                <PendingButton className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground transition-all hover:-translate-y-0.5 hover:shadow-soft disabled:pointer-events-none disabled:opacity-80">
                  <span>▶</span> Explore as User
                </PendingButton>
              </form>

              <form
                action={async (formData: FormData) => {
                  "use server"
                  await signIn("demo", formData, { redirectTo: "/admin" })
                }}
              >
                <input type="hidden" name="role" value="admin" />
                <PendingButton className="flex h-12 w-full items-center justify-center gap-2 rounded-full border border-primary/40 px-4 text-sm font-semibold text-primary transition-all hover:-translate-y-0.5 hover:bg-primary/5 hover:shadow-soft disabled:pointer-events-none disabled:opacity-80">
                  <span>🛡</span> Explore as Admin
                </PendingButton>
              </form>

              <p className="text-center text-xs text-muted-foreground">
                One click, no email - shared accounts with fake data, reset periodically.
              </p>
            </div>
          </>
        )}

        <p className="mt-6 text-center text-xs text-muted-foreground">
          By signing in, you agree to our{" "}
          <a href="/terms" className="underline underline-offset-4 hover:text-foreground">Terms</a>
          {" "}and{" "}
          <a href="/privacy" className="underline underline-offset-4 hover:text-foreground">Privacy Policy</a>.
        </p>

        {process.env.NODE_ENV === "development" && (
          <>
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-card px-2 text-xs text-muted-foreground">dev only</span>
              </div>
            </div>
            <form
              action={async (formData: FormData) => {
                "use server"
                await signIn("dev", formData, { redirectTo: "/dashboard" })
              }}
            >
              <input type="hidden" name="password" value="dev" />
              <button
                type="submit"
                className="flex h-12 w-full items-center justify-center gap-2 rounded-full border border-dashed border-border px-4 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                <span>🔧</span> Dev Login (Admin)
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
