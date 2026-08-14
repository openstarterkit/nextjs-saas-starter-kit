import type { Metadata } from "next"
import Link from "next/link"
import { getTranslations } from "next-intl/server"
import { prisma } from "@/lib/prisma"
import { removeNewsletterContact } from "@/lib/email"
import { siteConfig } from "@/config/site"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "newsletter" })
  return {
    title: `${t("unsubscribeTitle")} | ${siteConfig.name}`,
    robots: { index: false },
  }
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
  const t = await getTranslations("newsletter")

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
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              {t("unsubscribedHeading")}
            </h1>
            <p className="mt-4 text-muted-foreground">{t("unsubscribedBody")}</p>
          </>
        ) : (
          <>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              {t("unknownHeading")}
            </h1>
            <p className="mt-4 text-muted-foreground">{t("unknownBody")}</p>
          </>
        )}
        <Link
          href="/"
          className="mt-8 inline-block rounded-full px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-soft [background-image:var(--gradient-brand)]"
        >
          {t("backToSite")}
        </Link>
      </div>
    </section>
  )
}
