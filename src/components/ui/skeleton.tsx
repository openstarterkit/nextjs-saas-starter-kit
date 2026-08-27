import { cn } from "@/lib/utils"

/**
 * Placeholder for content that has not arrived.
 *
 * Give it the size of the thing it stands in for, not a generic block: a
 * skeleton whose shape matches what replaces it keeps the layout still, while
 * one that does not causes the page to jump the moment the data lands, which is
 * worse than the spinner it was meant to improve on.
 *
 * `aria-hidden` because it carries no information. A screen reader is told the
 * region is busy by whatever wraps it, not by an empty grey box.
 */
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn("animate-pulse rounded-[var(--radius)] bg-secondary", className)}
      {...props}
    />
  )
}

export { Skeleton }
