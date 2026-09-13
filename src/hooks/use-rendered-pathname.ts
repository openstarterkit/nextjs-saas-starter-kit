"use client"

import { useSelectedLayoutSegments } from "next/navigation"

/**
 * Path of the route currently rendered under the calling layout, e.g.
 * "/dashboard/projects". Unlike `usePathname`, this is derived from the
 * rendered tree rather than the browser URL, so it can't go stale after
 * server-action redirects (like sign-in with `redirectTo`).
 *
 * One consequence worth knowing, because it looks like a bug and isn't:
 * with an intercepting route the URL moves but the page underneath doesn't,
 * so this keeps returning the page underneath. Opening Settings as a modal
 * from the dashboard puts "/dashboard/settings" in the address bar while
 * this still says "/dashboard", and the sidebar keeps Dashboard lit. That
 * is the intended reading of a modal: it is a veil over the page you are
 * on, and closing it leaves you where you already were. Landing on the same
 * URL cold renders the full Settings page and lights Settings instead.
 */
export function useRenderedPathname() {
  const segments = useSelectedLayoutSegments()
  // Route groups like "(dashboard)" are organizational, not part of the URL.
  return "/" + segments.filter((s) => !s.startsWith("(")).join("/")
}
