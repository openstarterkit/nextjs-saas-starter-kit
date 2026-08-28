"use client"

import { useEffect, useRef, useState } from "react"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import type { TocItem } from "@/lib/toc"

/**
 * Outline of the current page, with scroll-spy: the heading nearest the top of
 * the viewport is highlighted.
 *
 * The list scrolls, not the whole outline: the "Contents" label stays put and
 * only the entries move, which is what keeps a long outline readable. The
 * scroll box lives here rather than in the page so both callers get the same
 * behaviour, and so the effect below can find it without reaching upwards
 * through markup it does not own.
 */
export function OnThisPage({ items }: { items: TocItem[] }) {
  const t = useTranslations("docs")
  const [active, setActive] = useState<string>(items[0]?.slug ?? "")
  const boxRef = useRef<HTMLDivElement>(null)

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

  /**
   * Keep the highlighted entry visible while you read.
   *
   * Without this the outline highlights something you cannot see: the list has
   * its own scrollbar, and reading to the bottom of a long article leaves the
   * active entry below the fold of a box that never moved.
   *
   * The scroll is done by hand rather than with `scrollIntoView`, which cannot
   * be told to leave the page alone: on a nested scroller it will happily move
   * the window too, and the article would jump under the reader.
   */
  useEffect(() => {
    const box = boxRef.current
    if (!box) return
    const link = box.querySelector<HTMLElement>(`a[data-slug="${CSS.escape(active)}"]`)
    if (!link) return

    const boxRect = box.getBoundingClientRect()
    const linkRect = link.getBoundingClientRect()
    const margin = 16

    if (linkRect.top < boxRect.top + margin) {
      box.scrollTop -= boxRect.top + margin - linkRect.top
    } else if (linkRect.bottom > boxRect.bottom - margin) {
      box.scrollTop += linkRect.bottom - boxRect.bottom + margin
    }
  }, [active])

  if (items.length === 0) return null

  return (
    <nav aria-label={t("contents")}>
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {t("contents")}
      </p>
      {/*
        `pr-3` is what stops the scrollbar sitting on top of the text, and
        `scrollbar-gutter: stable` reserves its width whether it is there or
        not, so a short outline and a long one line up at the same left edge.
      */}
      <div
        ref={boxRef}
        className="max-h-[calc(100dvh-var(--header-h,4.5rem)-8rem)] overflow-y-auto overscroll-contain pr-3 [scrollbar-gutter:stable] [scrollbar-width:thin] [scrollbar-color:var(--color-border)_transparent]"
      >
        <ul className="space-y-1 text-sm">
          {items.map((item) => (
            <li key={item.slug} style={{ paddingLeft: `${(item.depth - 2) * 0.75}rem` }}>
              <a
                href={`#${item.slug}`}
                data-slug={item.slug}
                className={cn(
                  "block py-1 transition-colors",
                  active === item.slug
                    ? "font-medium text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {item.text}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  )
}
