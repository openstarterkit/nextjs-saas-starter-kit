import { Search } from "lucide-react"
import { getTranslations } from "next-intl/server"

import { Input } from "@/components/ui/input"

/**
 * Project search: a plain GET form, so the query lives in the URL.
 *
 * That makes a filtered list linkable and shareable, keeps the back button
 * meaningful, and works with JavaScript off. The filtering itself happens in
 * the database query rather than over an array in the browser, which is the
 * version that still holds when the list is longer than one screen.
 *
 * No submit button on purpose: a form with a single text field submits on
 * Enter on its own, so the button would only be width spent next to the one
 * action that matters on this page.
 */
export async function ProjectSearch({ query }: { query: string }) {
  const t = await getTranslations("dashboard.projects")

  return (
    <form className="relative w-full sm:w-56">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        name="q"
        defaultValue={query}
        placeholder={t("searchPlaceholder")}
        aria-label={t("searchPlaceholder")}
        className="pl-9"
      />
    </form>
  )
}
