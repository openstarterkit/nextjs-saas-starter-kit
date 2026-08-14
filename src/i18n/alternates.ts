import type { Metadata } from "next"
import { routing } from "./routing"
import { siteConfig } from "@/config/site"

/** `/pricing` in `en`, `/it/pricing` in `it`. The `as-needed` rule, once. */
export function localizedPath(path: string, locale: string): string {
  return locale === routing.defaultLocale ? path : `/${locale}${path}`
}

/**
 * The `alternates` block for a page, given the locales it genuinely exists in.
 *
 * Two rules, and both are about not competing with ourselves in search:
 *
 * **A page nobody translated declares no alternates, and points its canonical
 * at the original.** Otherwise `/it/docs/billing` would announce itself as the
 * Italian version of a page whose text is word for word the English one, and
 * ask to be indexed as a separate result. Untranslated URLs still resolve, and
 * still serve the English text with a note: they are there for a reader who
 * followed the language switch, not for a crawler to file away.
 *
 * **A translated page cross-links every language and names an `x-default`.**
 * That is the pair a search engine needs to show the right one per reader
 * instead of picking for itself.
 *
 * @param path unprefixed path, e.g. `/docs/billing`
 * @param locale the locale being rendered
 * @param translated locales this page is genuinely written in
 */
export function localeAlternates(
  path: string,
  locale: string,
  translated: readonly string[]
): Metadata["alternates"] {
  const url = (target: string) => `${siteConfig.url}${localizedPath(path, target)}`

  if (!translated.includes(locale)) {
    return { canonical: url(routing.defaultLocale) }
  }

  if (translated.length < 2) {
    return { canonical: url(locale) }
  }

  return {
    canonical: url(locale),
    languages: {
      ...Object.fromEntries(translated.map((target) => [target, url(target)])),
      "x-default": url(routing.defaultLocale),
    },
  }
}
