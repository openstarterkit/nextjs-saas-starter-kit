import { notFound } from "next/navigation"
import { hasLocale, NextIntlClientProvider } from "next-intl"
import { getMessages, setRequestLocale } from "next-intl/server"
import { routing } from "@/i18n/routing"

/**
 * Wraps the public surface in the requested locale.
 *
 * Only the public pages live under `[locale]`. The dashboard, the admin panel,
 * the sign-in pages and the API sit outside it on purpose: see
 * `src/i18n/routing.ts` for why, and what to change if you want them
 * localized too.
 */
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  // An unknown locale is a 404, not a silent fall back to English: a URL that
  // renders content under a language it does not have would be indexed as if
  // that translation existed.
  if (!hasLocale(routing.locales, locale)) notFound()

  // Lets the pages below be statically rendered instead of opting the whole
  // subtree into dynamic rendering the moment a translation is read.
  setRequestLocale(locale)

  /**
   * A second provider, and it is not redundant with the one in the root
   * layout.
   *
   * The root layout sits above this segment, so it is not re-rendered when
   * the segment changes: following the language switch from `/docs/billing`
   * to `/it/docs/billing` left every client component holding the language it
   * was loaded with. The page turned Italian around a sidebar, an outline and
   * a language button that stayed English, which reads exactly like a
   * translation that stopped halfway. Nothing threw, so nothing said so, and
   * a reload made it look fine again.
   *
   * Here the locale is the segment itself, and both it and the messages are
   * passed explicitly rather than inherited: what the client is handed cannot
   * disagree with the URL it was asked for.
   *
   * The root one stays for the areas outside this prefix: the dashboard, the
   * admin panel, the sign-in pages and the 404, which always render in the
   * default locale but still read their strings from the message files.
   */
  return (
    <NextIntlClientProvider locale={locale} messages={await getMessages({ locale })}>
      {children}
    </NextIntlClientProvider>
  )
}
