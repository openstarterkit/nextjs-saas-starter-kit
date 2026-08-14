import type { ReactNode } from "react"

/**
 * Outer shell of the navbar.
 *
 * It used to hide the navbar on `/docs` entirely. That is gone: the
 * documentation keeps the site's header like every other page, and the
 * stickiness lives on the layout wrapper (banner and navbar pin together in
 * demo mode) rather than here.
 */
export function NavbarWrapper({ children }: { children: ReactNode }) {
  return <header className="w-full px-4 pt-4">{children}</header>
}
