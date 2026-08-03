import { auth } from "@/auth"
import { NextResponse } from "next/server"

/**
 * Private surfaces, matched by prefix. Anything not listed here falls through
 * to the router, so a URL that does not exist renders your 404 page.
 *
 * This is a denylist on purpose. With the allowlist it replaced, every path
 * the list did not know about looked private: a typo like `/doc` instead of
 * `/docs` was bounced to `/login`, and an anonymous visitor never saw the 404
 * page at all. Loosening the proxy opens nothing, because each private area
 * already gates itself server-side: `(dashboard)/layout.tsx` and
 * `(admin)/layout.tsx` call `auth()` and redirect, and the private API routes
 * each return 401 on their own. Treat this file as defence in depth, and add
 * a prefix here when you add a private area outside `/dashboard`.
 */
const PROTECTED_ROUTES = ["/dashboard", "/api/checkout", "/api/billing"]
const ADMIN_ROUTES = ["/admin", "/api/admin"]
const AUTH_ROUTES = ["/login", "/signup"]

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isLoggedIn = !!req.auth
  const isAdmin = req.auth?.user?.role === "ADMIN"

  const isAuthRoute = AUTH_ROUTES.some((r) => pathname.startsWith(r))
  const isAdminRoute = ADMIN_ROUTES.some((r) => pathname.startsWith(r))
  const isProtectedRoute = PROTECTED_ROUTES.some((r) => pathname.startsWith(r))

  // `/api/auth` and the inbound webhooks (e.g. Stripe) carry no session and
  // need no special case here: they are not in the lists above, so they pass.
  if (isAuthRoute && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl))
  }

  if (isAdminRoute) {
    if (!isLoggedIn) return NextResponse.redirect(new URL("/login", req.nextUrl))
    if (!isAdmin) return NextResponse.redirect(new URL("/dashboard", req.nextUrl))
    return NextResponse.next()
  }

  if (isProtectedRoute && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.nextUrl))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
