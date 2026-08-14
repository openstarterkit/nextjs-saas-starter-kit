/**
 * A language written in itself: `en` → "English", `it` → "Italiano".
 *
 * Taken from `Intl.DisplayNames` rather than a table in a message file, so
 * adding a locale to `routing.ts` is the only edit a new language needs. A
 * table would also have to be filled in for every language *by* every other
 * language, which is where switchers usually end up half translated.
 *
 * Endonyms are the convention for language pickers for a reason: a reader who
 * cannot read the current page still recognises their own language's name.
 * ICU spells most of them lowercase ("italiano"), which is correct in prose
 * and wrong in a list, so the first letter is raised in the target language.
 */
export function languageName(locale: string): string {
  try {
    const name = new Intl.DisplayNames([locale], { type: "language" }).of(locale)
    if (!name) return locale
    return name.charAt(0).toLocaleUpperCase(locale) + name.slice(1)
  } catch {
    // A runtime built without the full ICU data set: the code is a poor label
    // but an honest one, and it beats crashing the page over a menu item.
    return locale
  }
}
