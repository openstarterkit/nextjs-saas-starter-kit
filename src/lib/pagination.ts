/**
 * Which page buttons a pagination shows: every page while they are few, and
 * past that the first, the last and the neighbours of the current one, with a
 * gap for what is left out: 1 … 4 5 6 … 50.
 *
 * Always seven entries once the pages are more than seven, so the control
 * keeps its width while you move through it instead of growing and shrinking
 * under the cursor. A gap never stands for a single page: that page is shown,
 * since a button takes the same room as the dots.
 */
export type PageItem = number | "gap"

const SLOTS = 7

export function pageItems(page: number, totalPages: number): PageItem[] {
  if (totalPages <= SLOTS) return Array.from({ length: totalPages }, (_, i) => i + 1)

  const current = Math.min(Math.max(page, 1), totalPages)
  // Near either end the run of pages hugs it: 1 2 3 4 5 … 50.
  if (current <= 4) return [1, 2, 3, 4, 5, "gap", totalPages]
  if (current >= totalPages - 3) {
    return [1, "gap", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages]
  }
  return [1, "gap", current - 1, current, current + 1, "gap", totalPages]
}
