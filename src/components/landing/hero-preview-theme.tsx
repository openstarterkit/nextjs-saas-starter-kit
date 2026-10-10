"use client"

import { createContext, useContext, useState } from "react"
import { Moon, Sun } from "lucide-react"
import { cn } from "@/lib/utils"

type Mode = "site" | "light" | "dark"

const PreviewTheme = createContext<() => void>(() => {})

/**
 * The hero's dashboard preview with a theme of its own. It starts as the page
 * is, and the switch in its top bar flips only the preview: `.light` or
 * `.dark` on this frame redefines the tokens for everything inside it, and
 * the `dark:` variant follows (globals.css). The page around it, and the
 * theme the visitor chose, are left alone.
 */
export function PreviewThemeFrame({ className, children }: { className?: string; children: React.ReactNode }) {
  const [mode, setMode] = useState<Mode>("site")

  function flip() {
    setMode((m) => {
      const isDark = m === "site" ? document.documentElement.classList.contains("dark") : m === "dark"
      return isDark ? "light" : "dark"
    })
  }

  return (
    <PreviewTheme.Provider value={flip}>
      <div className={cn(mode !== "site" && mode, "text-foreground", className)}>{children}</div>
    </PreviewTheme.Provider>
  )
}

/**
 * A two-position switch, sun and moon, with the active side lifted: an icon
 * alone read as part of the picture, and nobody tried it. The active side is
 * pure CSS through `dark:`, so it follows the preview's own theme. Out of the
 * tab order on purpose: the preview is aria-hidden, a picture that happens to
 * respond to the mouse, and a focusable control inside it would be reachable
 * by keyboard yet silent to a screen reader.
 */
export function PreviewThemeToggle() {
  const flip = useContext(PreviewTheme)
  const side = "flex h-6 w-7 items-center justify-center rounded-full transition-colors"
  return (
    <button
      type="button"
      tabIndex={-1}
      onClick={flip}
      className="flex items-center gap-0.5 rounded-full border border-border bg-muted p-0.5 transition-colors hover:border-primary/40"
    >
      <span className={cn(side, "bg-primary text-primary-foreground dark:bg-transparent dark:text-muted-foreground")}>
        <Sun size={14} />
      </span>
      <span className={cn(side, "text-muted-foreground dark:bg-primary dark:text-primary-foreground")}>
        <Moon size={14} />
      </span>
    </button>
  )
}
