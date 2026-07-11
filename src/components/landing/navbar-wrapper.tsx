"use client"

import { usePathname } from "next/navigation"

export function NavbarWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isDocsPage = pathname?.startsWith("/docs")

  // Completely hide and do not render the navbar on documentation pages.
  if (isDocsPage) {
    return null
  }

  return (
    <header className="sticky top-0 z-50 w-full px-4 pt-4">
      {children}
    </header>
  )
}
