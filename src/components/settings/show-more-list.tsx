"use client"

import * as React from "react"

/**
 * A list that shows its first `limit` rows and a button for the rest.
 *
 * The rows are rendered on the server, forms and all, and arrive here as
 * children: this only decides how many are visible. They are all in the page
 * already, so the button reveals them at once instead of fetching, which is
 * the right trade for a list measured in tens, like the sessions of one
 * account. Once open it stays open: nobody needs the list shorter again.
 */
export function ShowMoreList({
  children,
  limit,
  moreLabel,
  className,
}: {
  children: React.ReactNode
  limit: number
  /** The button's text, with the number of hidden rows already in it: a
      function cannot cross from a server component to this one. */
  moreLabel: string
  className?: string
}) {
  const [open, setOpen] = React.useState(false)
  const rows = React.Children.toArray(children)
  const hidden = rows.length - limit

  return (
    <>
      <ul className={className}>{open || hidden <= 0 ? rows : rows.slice(0, limit)}</ul>
      {!open && hidden > 0 && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-xs font-medium text-primary underline-offset-4 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {moreLabel}
        </button>
      )}
    </>
  )
}
