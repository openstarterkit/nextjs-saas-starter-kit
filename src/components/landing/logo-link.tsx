"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

/**
 * Logo link: navigates home, but when already on the home page (where a
 * same-URL <Link> would do nothing) it smooth-scrolls back to the top and
 * clears any section #hash left by the anchor nav.
 */
export function LogoLink({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <Link
      href="/"
      className={className}
      onClick={(e) => {
        if (pathname === "/") {
          e.preventDefault()
          window.scrollTo({ top: 0, behavior: "smooth" })
          history.replaceState(null, "", "/")
        }
      }}
    >
      {children}
    </Link>
  )
}
