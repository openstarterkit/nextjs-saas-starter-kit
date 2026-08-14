import { getRequestConfig } from "next-intl/server"
import { hasLocale } from "next-intl"
import { routing } from "./routing"
import { isKitSite } from "@/config/kit"
import { collapseMessages, type Messages } from "./collapse"

/**
 * Fills the gaps in `translated` with `source`, all the way down.
 *
 * A shallow merge would not do: a partial `it.json` that defines `docs.title`
 * would replace the whole `docs` object and take every sibling key with it,
 * so translating one string would silently blank the others. The merge has to
 * walk the tree.
 */
function withFallback(source: Messages, translated: Messages): Messages {
  const out: Messages = { ...source }
  for (const [key, value] of Object.entries(translated)) {
    const base = out[key]
    const mergeable =
      value && typeof value === "object" && !Array.isArray(value) &&
      base && typeof base === "object" && !Array.isArray(base)
    out[key] = mergeable ? withFallback(base as Messages, value as Messages) : value
  }
  return out
}

/**
 * Loads the message file for the requested locale.
 *
 * **English is the source and is always complete.** Any key missing from
 * another locale falls back to English rather than rendering an empty string
 * or the key itself, so a partial translation is honest instead of broken.
 * That is what makes it reasonable to ship a locale covering only part of the
 * site: translate the pages that matter to you and leave the rest.
 */
export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale

  const source: Messages = (await import(`../locales/${routing.defaultLocale}.json`)).default
  if (locale === routing.defaultLocale) {
    return { locale, messages: collapseMessages(source, isKitSite) as never }
  }

  const translated: Messages = (await import(`../locales/${locale}.json`)).default
  return { locale, messages: collapseMessages(withFallback(source, translated), isKitSite) as never }
})
