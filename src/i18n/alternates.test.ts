import { describe, expect, it } from "vitest"
import { localeAlternates, localizedPath } from "./alternates"
import { translatedLocales } from "@/lib/docs"
import { routing } from "./routing"
import { siteConfig } from "@/config/site"

/**
 * These pin an SEO rule whose failure is silent and slow.
 *
 * Every page under `[locale]` resolves in every locale, because an
 * untranslated one falls back to English rather than 404. Announce those URLs
 * as alternates and you have told a search engine that two addresses hold the
 * same page in two languages, when they hold the same page in one: duplicate
 * content, published by us, about ourselves, discovered months later as a
 * ranking that went nowhere.
 *
 * Nothing else can catch it. The pages render, the build passes, and the
 * markup is well formed either way.
 */
const url = (path: string) => `${siteConfig.url}${path}`

describe("localizedPath", () => {
  it("leaves the default locale unprefixed, so indexed URLs never move", () => {
    expect(localizedPath("/docs/billing", "en")).toBe("/docs/billing")
    expect(localizedPath("/docs/billing", "it")).toBe("/it/docs/billing")
  })
})

describe("localeAlternates", () => {
  it("cross-links the languages a page really exists in, and names an x-default", () => {
    const alternates = localeAlternates("/docs/getting-started", "it", ["en", "it"])
    expect(alternates).toEqual({
      canonical: url("/it/docs/getting-started"),
      languages: {
        en: url("/docs/getting-started"),
        it: url("/it/docs/getting-started"),
        "x-default": url("/docs/getting-started"),
      },
    })
  })

  it("declares no alternate for a page that exists in one language", () => {
    expect(localeAlternates("/docs/deployment", "en", ["en"])).toEqual({
      canonical: url("/docs/deployment"),
    })
  })

  it("points a fallback page at the original instead of claiming to be one", () => {
    // `/it/docs/deployment` serves the English text. Self-canonicalising here
    // is the whole defect: it submits a second address for the same words.
    expect(localeAlternates("/docs/deployment", "it", ["en"])).toEqual({
      canonical: url("/docs/deployment"),
    })
  })
})

describe("translatedLocales", () => {
  it("agrees with the files on disk, not with the configured locale list", () => {
    // The check that ties the rule above to reality: read from `routing` and
    // every page would look translated in every language.
    for (const doc of ["getting-started", "projects", "billing-and-plans"]) {
      const locales = translatedLocales(doc)
      expect(locales).toContain(routing.defaultLocale)
      expect(locales.every((l) => routing.locales.includes(l as never))).toBe(true)
    }
  })

  it("never reports a locale that has no file", () => {
    expect(translatedLocales("a-slug-that-does-not-exist")).toEqual([routing.defaultLocale])
  })
})
