import { createNavigation } from "next-intl/navigation"
import { routing } from "./routing"

/**
 * Locale aware navigation, for the parts of the site that have translations.
 *
 * These wrappers keep the current locale when you move between pages: from
 * `/it/docs` a `<Link href="/docs/getting-started">` lands on
 * `/it/docs/getting-started`, and `usePathname()` gives you `/docs` rather
 * than `/it/docs`, so an "is this link active" check does not need to know
 * about prefixes.
 *
 * **`Link` is used in the documentation section and nowhere else, on purpose.**
 * A link that carries the locale into a page nobody translated would publish
 * English text under an Italian URL, which is duplicate content with our own
 * hands: the same page reachable at two addresses with the same words. The
 * rest of the site keeps plain `next/link`, so leaving the docs also leaves
 * the prefix behind.
 *
 * Translate more of your app and that rule flips: import `Link` from here in
 * every section you have translated, and the prefix follows the reader.
 *
 * **`usePathname` is the opposite: every client component under `[locale]`
 * should take it from here, translated section or not.** A component that
 * compares the path against something it knows, to highlight a link or hide a
 * header, is asking "which page is this", and the answer must not change with
 * the language. Read from `next/navigation` those comparisons silently stop
 * matching the moment a prefix appears, which is how the navbar kept showing
 * on the Italian docs while it was correctly hidden on the English ones.
 */
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing)
