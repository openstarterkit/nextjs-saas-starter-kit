import { defineRouting } from "next-intl/routing"

/**
 * Locale routing for the public site.
 *
 * **Only the public surface is localized.** The dashboard, the admin panel,
 * the sign-in pages and the API live outside `[locale]`, so a URL like
 * `/it/dashboard` does not exist. That is a deliberate simplification and a
 * security property at once: `src/proxy.ts` matches private routes by prefix,
 * and a locale segment in front of `/dashboard` would stop those prefixes from
 * matching. Keeping the private area out of the prefix removes the problem
 * instead of asking every future route list to remember it.
 *
 * If you want your dashboard localized too, move those route groups under
 * `src/app/[locale]/` and teach `proxy.ts` to strip the locale before it
 * compares prefixes. The strings are already extracted, so it is routing work
 * and not a rewrite.
 */
export const routing = defineRouting({
  locales: ["en", "it"],
  defaultLocale: "en",

  /**
   * `as-needed` keeps English URLs exactly as they are today: `/pricing`, not
   * `/en/pricing`. Only non-default locales carry a prefix, so adding a
   * language never invalidates the URLs you already have indexed.
   */
  localePrefix: "as-needed",

  /**
   * No automatic redirect based on `Accept-Language`. A visitor who lands on an
   * English URL stays there, and switches language from a visible control.
   * Guessing from browser headers sends people to a page they did not ask for
   * and makes a shared link resolve differently for each reader.
   */
  localeDetection: false,
})

export type Locale = (typeof routing.locales)[number]
