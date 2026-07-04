"use client"

import { useEffect, useRef, useState } from "react"
import { usePathname } from "next/navigation"

const sections = [
  { id: "features", label: "Features" },
  { id: "pricing", label: "Pricing" },
  { id: "faq", label: "FAQ" },
] as const

export type SectionId = (typeof sections)[number]["id"]

export { sections }

export function useActiveSection() {
  const pathname = usePathname()
  const [active, setActive] = useState<string | null>(null)
  const visible = useRef(new Set<string>())

  const current = pathname === "/" ? active : null

  useEffect(() => {
    if (pathname !== "/") return
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.current.add(entry.target.id)
          else visible.current.delete(entry.target.id)
        }
        setActive(sections.find(({ id }) => visible.current.has(id))?.id ?? null)
      },
      { rootMargin: "-35% 0px -55% 0px" }
    )
    for (const { id } of sections) {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    }
    return () => observer.disconnect()
  }, [pathname])

  return current
}
