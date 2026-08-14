"use client"

import { useTranslations } from "next-intl"

import { useEffect, useState } from "react"
import { ArrowUp } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Floating "back to top" button. Fades in once the user has scrolled down,
 * smooth-scrolls to the top on click (respecting prefers-reduced-motion).
 */
export function BackToTop() {
  const t = useTranslations("nav")
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  function scrollToTop() {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" })
  }

  return (
    <button
      type="button"
      aria-label={t("backToTop")}
      onClick={scrollToTop}
      className={cn(
        "fixed bottom-6 right-6 z-40 flex h-11 w-11 items-center justify-center rounded-full border border-border bg-background/80 text-foreground shadow-soft backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:text-primary hover:shadow-[var(--shadow-glow)]",
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
      )}
    >
      <ArrowUp className="h-5 w-5" />
    </button>
  )
}
