import Link from "next/link"
import { LogoMark } from "@/components/logo"

// Landing page after a magic link (or signup verification) email is sent.
// Configured as pages.verifyRequest in src/auth.ts.
export default function VerifyRequestPage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-3xl border border-border bg-card/80 p-8 text-center shadow-[var(--shadow-soft-lg)] backdrop-blur-xl">
        <div className="mb-4 flex justify-center">
          <LogoMark className="h-12 w-12 rounded-2xl ring-1 ring-primary/15" iconClassName="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Check your email</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          We sent you a sign-in link. It&apos;s valid for 15 minutes and can be used once.
        </p>
        <p className="mt-4 text-xs text-muted-foreground">
          Nothing in your inbox? Check the spam folder, or{" "}
          <Link href="/login" className="underline underline-offset-4 hover:text-foreground">
            try again
          </Link>
          .
        </p>
      </div>
    </div>
  )
}
