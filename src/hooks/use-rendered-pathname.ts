"use client"

import { useSelectedLayoutSegments } from "next/navigation"

/**
 * Path of the route currently rendered under the calling layout, e.g.
 * "/dashboard/projects". Unlike `usePathname`, this is derived from the
 * rendered tree rather than the browser URL, so it can't go stale after
 * server-action redirects (like sign-in with `redirectTo`).
 */
export function useRenderedPathname() {
  const segments = useSelectedLayoutSegments()
  // Route groups like "(dashboard)" are organizational, not part of the URL.
  return "/" + segments.filter((s) => !s.startsWith("(")).join("/")
}
