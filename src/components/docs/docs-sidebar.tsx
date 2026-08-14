import { getLocale, getTranslations } from "next-intl/server"
import { getDocs } from "@/lib/docs"
import { DocsNav } from "@/components/docs/docs-nav"
import { DocsLanguageSwitch } from "@/components/docs/docs-language-switch"

/**
 * Left column of the documentation section: the guide list and the language
 * picker, in the language the reader asked for.
 *
 * Shared by both docs layouts. The index page sits in the `(public)` group so
 * it keeps the marketing footer, the guides sit in `(docs)` where they do not,
 * and before this existed the column was written twice.
 *
 * **On a phone it goes last, and that is the whole point of `order-last`.**
 * With one column, a left sidebar becomes a header: the nine guide links, the
 * language switch and a full width button all landed above the title, so a
 * reader arriving at a guide met a screen of navigation before a word of it.
 * The DOM order is untouched, so on a wide screen the visual order still
 * matches the source, and on a phone the landmarks let assistive tech reach
 * the nav without scrolling to it.
 */
export async function DocsSidebar() {
  const [t, locale] = await Promise.all([getTranslations("docs"), getLocale()])
  const docs = getDocs(locale)

  return (
    <aside className="order-last border-t border-border/60 pt-8 md:order-none md:w-52 md:shrink-0 md:border-0 md:pt-0">
      {/* Pinned under the header and given its own scrollbar, so the guide
          list stays put while the article moves and never needs the page
          scrolled to reach its last entry. `--header-h` is measured by
          `StickyHeader`; the fallback covers the first paint. It stops being
          sticky where this column ends, which is what lets the footer come
          up over it. */}
      <div className="md:sticky md:top-[calc(var(--header-h,4.5rem)+2rem)] md:max-h-[calc(100dvh-var(--header-h,4.5rem)-4rem)] md:overflow-y-auto">
        {/* Above the guide list, because it decides which list you are about
            to read rather than being an afterthought to it. Capped on a phone,
            where this column is the full width of the screen and a menu
            stretched across it reads as the page's main event. */}
        <div className="mx-auto mb-4 w-full max-w-xs border-b border-border/60 pb-4 md:max-w-none">
          <DocsLanguageSwitch />
        </div>
        <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t("sectionLabel")}
        </p>
        <DocsNav items={docs.map((d) => ({ slug: d.slug, title: d.title }))} />
      </div>
    </aside>
  )
}
