"use client"

import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { Sun, Moon, Monitor, Check } from "lucide-react"
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"

type Theme = "light" | "dark" | "system"

const options: { value: Theme; icon: typeof Sun }[] = [
  { value: "light", icon: Sun },
  { value: "dark", icon: Moon },
  { value: "system", icon: Monitor },
]

/** Tells every theme control on the page that the choice changed. */
const THEME_EVENT = "themechange"

/**
 * The theme choice and the way to change it, shared by every control on the
 * page: the switch in the header and the one in the account menu stay in step,
 * because a change made by one is announced to the others.
 */
export function useThemeChoice() {
  // null = not mounted yet (avoids hydration mismatch on the icon)
  const [theme, setTheme] = useState<Theme | null>(null)
  const [, force] = useState(0)

  useEffect(() => {
    const read = () => {
      const stored = localStorage.getItem("theme")
      setTheme(stored === "dark" || stored === "light" ? stored : "system")
    }
    read()
    window.addEventListener(THEME_EVENT, read)
    return () => window.removeEventListener(THEME_EVENT, read)
  }, [])

  // When "system" is selected, follow OS changes live
  useEffect(() => {
    if (theme !== "system") return
    const mq = window.matchMedia("(prefers-color-scheme: dark)")
    const onChange = () => {
      document.documentElement.classList.toggle("dark", mq.matches)
      force((n) => n + 1)
    }
    mq.addEventListener("change", onChange)
    return () => mq.removeEventListener("change", onChange)
  }, [theme])

  function apply(next: Theme) {
    if (next === "system") {
      localStorage.removeItem("theme")
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
      document.documentElement.classList.toggle("dark", prefersDark)
    } else {
      localStorage.setItem("theme", next)
      document.documentElement.classList.toggle("dark", next === "dark")
    }
    window.dispatchEvent(new Event(THEME_EVENT))
  }

  return { theme, apply }
}

/**
 * The three themes as a row of icon buttons, for a menu: the account menu at
 * the foot of the sidebar, as in the Vercel dashboard. Clicking one does not
 * close the menu, so the change can be seen and undone.
 */
export function ThemeSwitch() {
  const t = useTranslations("theme")
  const { theme, apply } = useThemeChoice()
  const labels: Record<Theme, string> = {
    light: t("light"),
    dark: t("dark"),
    system: t("system"),
  }
  return (
    <div data-theme-control className="flex items-center justify-between gap-3 px-2 py-1.5 text-sm">
      <span className="text-muted-foreground">{t("title")}</span>
      {/* Items of the menu, not buttons inside it: a menu may only hold menu
          items, and plain buttons were skipped by the arrow keys and announced
          as something else. A radio group says which one is chosen; choosing
          keeps the menu open, so the change is seen where it was made. */}
      <DropdownMenuPrimitive.RadioGroup
        value={theme ?? undefined}
        onValueChange={(value) => apply(value as Theme)}
        aria-label={t("label")}
        className="flex items-center gap-0.5 rounded-full border border-border p-0.5"
      >
        {options.map(({ value, icon: Icon }) => (
          <DropdownMenuPrimitive.RadioItem
            key={value}
            value={value}
            onSelect={(event) => event.preventDefault()}
            aria-label={labels[value]}
            title={labels[value]}
            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring data-[highlighted]:text-foreground data-[state=checked]:bg-secondary data-[state=checked]:text-foreground"
          >
            <Icon size={14} />
          </DropdownMenuPrimitive.RadioItem>
        ))}
      </DropdownMenuPrimitive.RadioGroup>
    </div>
  )
}

export function ThemeToggle() {
  const t = useTranslations("theme")
  // Spelled out rather than `t(value)`: a key built from a variable cannot be
  // matched against the message file, and the check that catches a renamed or
  // orphaned key stops covering this namespace the moment one appears.
  const labels: Record<Theme, string> = {
    light: t("light"),
    dark: t("dark"),
    system: t("system"),
  }
  const { theme, apply } = useThemeChoice()

  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          data-theme-control
          aria-label={t("label")}
          className="flex h-9 w-9 items-center justify-center rounded-[var(--radius)] text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          {theme === null ? null : isDark ? <Moon size={18} /> : <Sun size={18} />}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[8rem]">
        {options.map(({ value, icon: Icon }) => (
          <DropdownMenuItem key={value} onClick={() => apply(value)}>
            <Icon />
            {labels[value]}
            {theme === value && <Check className="ml-auto" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
