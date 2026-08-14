"use client"

import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { Sun, Moon, Monitor, Check } from "lucide-react"
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
  // null = not mounted yet (avoids hydration mismatch on the icon)
  const [theme, setTheme] = useState<Theme | null>(null)
  const [, force] = useState(0)

  useEffect(() => {
    const stored = localStorage.getItem("theme")
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme(stored === "dark" || stored === "light" ? stored : "system")
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
    setTheme(next)
    if (next === "system") {
      localStorage.removeItem("theme")
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
      document.documentElement.classList.toggle("dark", prefersDark)
    } else {
      localStorage.setItem("theme", next)
      document.documentElement.classList.toggle("dark", next === "dark")
    }
  }

  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
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
