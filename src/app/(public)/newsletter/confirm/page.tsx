import type { Metadata } from "next"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { sendNewsletterWelcomeEmail, syncNewsletterContact } from "@/lib/email"
import { siteConfig } from "@/config/site"

export const metadata: Metadata = {
  title: `Confirm subscription | ${siteConfig.name}`,
  robots: { index: false },
}

const CONFIRM_WINDOW_MS = 7 * 24 * 60 * 60 * 1000

/**
 * Double opt-in, step 2 of 2: the emailed link lands here. Confirming is
 * idempotent (clicking twice is fine) and re-activates a previously
 * unsubscribed address. Expired or unknown tokens get a way to start over.
 */
export default async function NewsletterConfirmPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams

  let state: "confirmed" | "expired" | "invalid" = "invalid"

  if (token) {
    const sub = await prisma.newsletterSubscriber.findUnique({ where: { confirmToken: token } })
    if (!sub) {
      state = "invalid"
    } else if (sub.confirmedAt && !sub.unsubscribedAt) {
      state = "confirmed" // already done: same happy page, no side effects
      // Server Component: reading the clock for the expiry window is intentional.
      // eslint-disable-next-line react-hooks/purity
    } else if (Date.now() - sub.createdAt.getTime() > CONFIRM_WINDOW_MS) {
      state = "expired"
    } else {
      await prisma.newsletterSubscriber.update({
        where: { id: sub.id },
        data: { confirmedAt: sub.confirmedAt ?? new Date(), unsubscribedAt: null },
      })
      try {
        await syncNewsletterContact(sub.email)
        await sendNewsletterWelcomeEmail(
          sub.email,
          `${siteConfig.url}/newsletter/unsubscribe?token=${sub.unsubscribeToken}`
        )
      } catch (error) {
        // The subscription itself succeeded; email/audience sync can retry later.
        console.error("[newsletter] post-confirm side effects failed:", error)
      }
      state = "confirmed"
    }
  }

  return (
    <section className="flex min-h-[60vh] items-center py-24">
      <div className="mx-auto max-w-xl px-6 text-center">
        {state === "confirmed" && (
          <>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">You&apos;re in 🎉</h1>
            <p className="mt-4 text-muted-foreground">
              One short email a week, and a discount waiting for you at launch. Unsubscribe anytime,
              one click.
            </p>
          </>
        )}
        {state === "expired" && (
          <>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">This link has expired</h1>
            <p className="mt-4 text-muted-foreground">
              Confirmation links are valid for 7 days. Subscribe again and we will send you a fresh
              one.
            </p>
          </>
        )}
        {state === "invalid" && (
          <>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Link not valid</h1>
            <p className="mt-4 text-muted-foreground">
              This confirmation link is not valid anymore. Subscribe again to get a new one.
            </p>
          </>
        )}
        <Link
          href="/pricing"
          className="mt-8 inline-block rounded-full px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-soft [background-image:var(--gradient-brand)]"
        >
          {state === "confirmed" ? "Back to the site" : "Back to pricing"}
        </Link>
      </div>
    </section>
  )
}
