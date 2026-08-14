"use client"

import Link from "next/link"
import { Check, ChevronDown, Globe } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { usePathname } from "@/i18n/navigation"
import { routing } from "@/i18n/routing"
import { languageName } from "@/i18n/language-name"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"

/**
 * Language picker for the documentation section.
 *
 * **It is here and not in the navbar, and that is a content decision rather
 * than a technical one.** A switch in the navbar promises the whole site in
 * the language it offers; on a site where only the docs are translated it
 * would deliver an Italian menu around English pages, and on `/pricing` an
 * Italian frame around plan names that come out of the database in English.
 * Scoping it to the section that is actually translated keeps the promise the
 * control makes equal to what it delivers.
 *
 * Move it into the navbar the day you translate the rest: the plumbing does
 * not change, only where the control is mounted.
 *
 * Each entry keeps the current path and swaps the prefix, so switching from
 * `/docs/billing` lands on `/it/docs/billing` and not back at the index. A
 * page with no translation yet still resolves: it serves the English text and
 * says so, which is a better answer than a 404 for a page that exists.
 *
 * The targets are built here rather than handed to next-intl's `Link`, which
 * prefixes the default locale when you name it explicitly: switching back to
 * English would land on `/en/docs/billing`, a second address for a page that
 * already has one at `/docs/billing`. Under `as-needed` the canonical English
 * URL carries no prefix, and that is the one this offers.
 */
export function DocsLanguageSwitch() {
  const t = useTranslations("language")
  const locale = useLocale()
  const pathname = usePathname()

  // `usePathname` here is the locale-aware one, so `pathname` never carries a
  // prefix and building the target is the `as-needed` rule itself.
  const href = (target: string) =>
    target === routing.defaultLocale ? pathname : `/${target}${pathname}`

  // One language, no picker. The kit ships with two and plenty of people will
  // want one: dropping a locale from `routing.ts` should take the control with
  // it, not leave a menu with a single entry to be hunted down in a component.
  if (routing.locales.length < 2) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={t("label")}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Globe className="h-4 w-4 shrink-0" />
          <span className="truncate">{languageName(locale)}</span>
          <ChevronDown className="ml-auto h-3.5 w-3.5 shrink-0 opacity-60" aria-hidden="true" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[8rem]">
        {routing.locales.map((value) => (
          <DropdownMenuItem key={value} asChild>
            <Link href={href(value)} lang={value} hrefLang={value}>
              {languageName(value)}
              {locale === value && <Check className="ml-auto" />}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
