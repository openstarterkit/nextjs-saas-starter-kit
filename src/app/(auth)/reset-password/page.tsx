import Link from "next/link"
import { redirect } from "next/navigation"
import { resetPassword } from "@/app/actions/auth"
import { LogoMark } from "@/components/logo"
import { PendingButton } from "@/components/auth/pending-button"
import { Input } from "@/components/ui/input"
import { siteConfig } from "@/config/site"

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string }>
}) {
  const { token, error } = await searchParams

  if (process.env.DEMO_MODE === "true") redirect("/login")
  if (siteConfig.links.demo) redirect(siteConfig.links.demo)

  const expired = error === "expired" || !token

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-3xl border border-border bg-card/80 p-8 shadow-[var(--shadow-soft-lg)] backdrop-blur-xl">
        <div className="mb-8 text-center">
          <div className="mb-4 flex justify-center">
            <LogoMark className="h-12 w-12 rounded-2xl ring-1 ring-primary/15" iconClassName="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Choose a new password</h1>
        </div>

        {expired ? (
          <>
            <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-center text-sm text-destructive">
              This reset link is invalid or has expired.
            </p>
            <p className="mt-4 text-center text-xs text-muted-foreground">
              <Link href="/forgot-password" className="underline underline-offset-4 hover:text-foreground">
                Request a new one
              </Link>
            </p>
          </>
        ) : (
          <>
            {error === "policy" && (
              <p className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-center text-sm text-destructive">
                Passwords must be 8 to 72 characters.
              </p>
            )}
            <form action={resetPassword} className="flex flex-col gap-3">
              <input type="hidden" name="token" value={token} />
              <Input
                name="password"
                type="password"
                placeholder="New password (min 8 characters)"
                autoComplete="new-password"
                required
                minLength={8}
                maxLength={72}
                className="h-12 rounded-full px-4"
              />
              <PendingButton className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground transition-all hover:-translate-y-0.5 hover:shadow-soft disabled:pointer-events-none disabled:opacity-80">
                Update password
              </PendingButton>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
