"use client"

import { useEffect, useState } from "react"
import { PanelLeftClose, PanelLeftOpen } from "lucide-react"

const STORAGE_KEY = "sidebar-collapsed"

/**
 * Collapses the desktop sidebar to icons only. State lives as a class on
 * <html> (styled via the `sidebar-collapsed:` variant in globals.css) and
 * persists in localStorage; the root layout restores it before first paint
 * (see `sidebarInit`). Hidden on mobile, where MobileNav takes over.
 */
export function SidebarCollapseToggle() {
  // null = not mounted yet (avoids hydration mismatch on the icon)
  const [collapsed, setCollapsed] = useState<boolean | null>(null)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCollapsed(document.documentElement.classList.contains("sidebar-collapsed"))
  }, [])

  function toggle() {
    const next = !document.documentElement.classList.contains("sidebar-collapsed")
    document.documentElement.classList.toggle("sidebar-collapsed", next)
    localStorage.setItem(STORAGE_KEY, next ? "1" : "0")
    setCollapsed(next)
  }

  const label = collapsed ? "Expand sidebar" : "Collapse sidebar"
  return (
    <button
      aria-label={label}
      title={label}
      onClick={toggle}
      className="hidden h-9 w-9 items-center justify-center rounded-[var(--radius)] text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground md:flex"
    >
      {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
    </button>
  )
}
