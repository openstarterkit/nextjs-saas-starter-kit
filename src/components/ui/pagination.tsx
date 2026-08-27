import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * Page navigation for a paginated list.
 *
 * Takes an `href` builder rather than a base path, so a caller decides what a
 * page URL looks like: the blog index wants `/blog/page/2` while a category
 * wants `/blog/category/guides/page/2`, and both want page 1 to stay at the
 * bare address instead of gaining a redundant `/page/1`.
 *
 * Every entry is a real link, so the whole control works before JavaScript and
 * a crawler can walk the archive. The current page is a `span` with
 * `aria-current`, because a link to where you already are is noise for anyone
 * navigating by keyboard or screen reader.
 */
export function Pagination({
  page,
  totalPages,
  href,
  labels,
  className,
}: {
  page: number
  totalPages: number
  href: (page: number) => string
  labels: { previous: string; next: string; navigation: string; page: string }
  className?: string
}) {
  if (totalPages <= 1) return null

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
  const base =
    "inline-flex h-9 min-w-9 items-center justify-center gap-1 rounded-[var(--radius)] border px-3 text-sm transition-colors"

  return (
    <nav aria-label={labels.navigation} className={cn("flex justify-center gap-2", className)}>
      {page > 1 ? (
        <Link
          href={href(page - 1)}
          rel="prev"
          className={cn(base, "border-border text-muted-foreground hover:text-foreground")}
        >
          <ChevronLeft className="h-4 w-4" />
          {labels.previous}
        </Link>
      ) : (
        <span className={cn(base, "border-transparent text-muted-foreground/40")} aria-hidden="true">
          <ChevronLeft className="h-4 w-4" />
          {labels.previous}
        </span>
      )}

      <ul className="flex gap-1">
        {pages.map((n) =>
          n === page ? (
            <li key={n}>
              <span
                aria-current="page"
                aria-label={`${labels.page} ${n}`}
                className={cn(base, "border-primary bg-primary/10 font-medium text-primary")}
              >
                {n}
              </span>
            </li>
          ) : (
            <li key={n}>
              <Link
                href={href(n)}
                aria-label={`${labels.page} ${n}`}
                className={cn(base, "border-border text-muted-foreground hover:text-foreground")}
              >
                {n}
              </Link>
            </li>
          )
        )}
      </ul>

      {page < totalPages ? (
        <Link
          href={href(page + 1)}
          rel="next"
          className={cn(base, "border-border text-muted-foreground hover:text-foreground")}
        >
          {labels.next}
          <ChevronRight className="h-4 w-4" />
        </Link>
      ) : (
        <span className={cn(base, "border-transparent text-muted-foreground/40")} aria-hidden="true">
          {labels.next}
          <ChevronRight className="h-4 w-4" />
        </span>
      )}
    </nav>
  )
}
