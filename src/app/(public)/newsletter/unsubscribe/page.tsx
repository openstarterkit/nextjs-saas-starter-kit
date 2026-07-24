import type { Metadata } from "next"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { removeNewsletterContact } from "@/lib/email"
import { siteConfig } from "@/config/site"

export const metadata: Metadata = {
  title: `Unsubscribe | ${siteConfig.name}`,
  robots: { index: false },
}

/**
 * One-click unsubscribe with immediate effect: flips unsubscribedAt in the
 * database and removes the contact from the Resend Audience. Idempotent.
 */
export default async function NewsletterUnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams

  let done = false
  if (token) {
    const sub = await prisma.newsletterSubscriber.findUnique({ where: { unsubscribeToken: token } })
    if (sub) {
      if (!sub.unsubscribedAt) {
        await prisma.newsletterSubscriber.update({
          where: { id: sub.id },
          data: { unsubscribedAt: new Date() },
        })
        try {
          await removeNewsletterContact(sub.email)
        } catch (error) {
          console.error("[newsletter] audience removal failed:", error)
        }
      }
      done = true
    }
  }

  return (
    <section className="flex min-h-[60vh] items-center py-24">
      <div className="mx-auto max-w-xl px-6 text-center">
        {done ? (
          <>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">You&apos;re unsubscribed</h1>
            <p className="mt-4 text-muted-foreground">
              No more emails from us, effective immediately. Changed your mind? You can subscribe
              again anytime.
            </p>
          </>
        ) : (
          <>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Link not valid</h1>
            <p className="mt-4 text-muted-foreground">
              This unsubscribe link does not match any subscription. If you keep receiving emails,
              reply to one of them and we will remove you by hand.
            </p>
          </>
        )}
        <Link
          href="/"
          className="mt-8 inline-block rounded-full px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-soft [background-image:var(--gradient-brand)]"
        >
          Back to the site
        </Link>
      </div>
    </section>
  )
}
