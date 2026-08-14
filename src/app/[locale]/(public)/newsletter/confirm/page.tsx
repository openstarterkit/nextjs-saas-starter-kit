import type { Metadata } from "next"
import Link from "next/link"
import { getTranslations } from "next-intl/server"
import { prisma } from "@/lib/prisma"
import { sendNewsletterWelcomeEmail, syncNewsletterContact } from "@/lib/email"
import { siteConfig } from "@/config/site"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "newsletter" })
  return {
    title: `${t("confirmTitle")} | ${siteConfig.name}`,
    robots: { index: false },
  }
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
  const t = await getTranslations("newsletter")

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
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              {t("confirmedHeading")}
            </h1>
            <p className="mt-4 text-muted-foreground">{t("confirmedBody")}</p>
          </>
        )}
        {state === "expired" && (
          <>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              {t("expiredHeading")}
            </h1>
            <p className="mt-4 text-muted-foreground">{t("expiredBody")}</p>
          </>
        )}
        {state === "invalid" && (
          <>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              {t("invalidHeading")}
            </h1>
            <p className="mt-4 text-muted-foreground">{t("invalidBody")}</p>
          </>
        )}
        <Link
          href="/pricing"
          className="mt-8 inline-block rounded-full px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-soft [background-image:var(--gradient-brand)]"
        >
          {state === "confirmed" ? t("backToSite") : t("backToPricing")}
        </Link>
      </div>
    </section>
  )
}
