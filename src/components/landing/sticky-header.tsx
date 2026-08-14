"use client"

import { useEffect, useRef } from "react"

/**
 * The banner and the navbar, pinned to the top, publishing their own height
 * as `--header-h`.
 *
 * Anything that has to sit *under* a sticky header needs to know how tall it
 * is, and here that is not a constant: the demo banner is there only when
 * `DEMO_MODE` is on, and it wraps to two lines on a narrow screen. A number
 * written into a class would be right on one deployment and wrong on the
 * other, and wrong in a way that looks like a small misalignment rather than
 * a bug, so nobody would chase it.
 *
 * The docs rails read the variable to know where to stop. Everything else
 * ignores it.
 */
export function StickyHeader({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const publish = () =>
      document.documentElement.style.setProperty("--header-h", `${el.offsetHeight}px`)
    publish()
    const observer = new ResizeObserver(publish)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={ref} className="sticky top-0 z-50">
      {children}
    </div>
  )
}
