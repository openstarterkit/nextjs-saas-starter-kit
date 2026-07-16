"use client"

import { usePathname } from "next/navigation"

export function NavbarWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isDocsPage = pathname?.startsWith("/docs")

  // Completely hide and do not render the navbar on documentation pages.
  if (isDocsPage) {
    return null
  }

  // Stickiness lives on the layout wrapper (banner + navbar stick together
  // in demo mode), not here.
  return (
    <header className="w-full px-4 pt-4">
      {children}
    </header>
  )
}
