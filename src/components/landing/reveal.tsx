"use client"

import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

interface RevealProps {
  children: React.ReactNode
  className?: string
  /** Delay in ms before the animation starts once in view */
  delay?: number
  as?: "div" | "section" | "li"
}

/**
 * Fades + slides its children in when they scroll into view.
 * Uses IntersectionObserver (no animation library). Honors
 * prefers-reduced-motion via the global CSS reset in globals.css.
 */
export function Reveal({ children, className, delay = 0, as = "div" }: RevealProps) {
  const ref = useRef<HTMLElement | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -10% 0px" }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const Comp = as

  return (
    <Comp
      ref={ref as React.Ref<never>}
      style={visible ? { animationDelay: `${delay}ms` } : undefined}
      className={cn(
        "transition-none",
        visible ? "animate-fade-in-up" : "opacity-0",
        className
      )}
    >
      {children}
    </Comp>
  )
}
