"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import type { TocItem } from "@/lib/docs"

/**
 * "On this page" outline for the current doc, with scroll-spy: the heading
 * currently near the top of the viewport is highlighted. Hidden on narrow
 * screens (it's the third column, shown from xl up).
 */
export function OnThisPage({ items }: { items: TocItem[] }) {
  const [active, setActive] = useState<string>(items[0]?.slug ?? "")

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id)
        }
      },
      // Fire when a heading reaches the top ~20% band of the viewport.
      { rootMargin: "0px 0px -80% 0px", threshold: 0 }
    )
    for (const item of items) {
      const el = document.getElementById(item.slug)
      if (el) observer.observe(el)
    }
    return () => observer.disconnect()
  }, [items])

  if (items.length === 0) return null

  return (
    <nav aria-label="On this page">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        On this page
      </p>
      <ul className="space-y-1 text-sm">
        {items.map((item) => (
          <li key={item.slug} style={{ paddingLeft: `${(item.depth - 2) * 0.75}rem` }}>
            <a
              href={`#${item.slug}`}
              className={cn(
                "block py-1 transition-colors",
                active === item.slug
                  ? "font-medium text-primary dark:text-blue-400"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {item.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
